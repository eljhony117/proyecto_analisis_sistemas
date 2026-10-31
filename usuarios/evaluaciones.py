"""Evaluaciones con datos reales de Oracle (tabla EVALUACION).

- lista: administrador y evaluador.
- asignar: solo el administrador. Crea la fila de EVALUACION (comite + docente
  + solicitud).
- evaluar: administrador o evaluador. Guarda el puntaje y el estado.
Los permisos se validan aqui, en el servidor.
"""
import logging
from datetime import date
from functools import wraps

from django.db import DatabaseError, IntegrityError, connection, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from . import evaluaciones_reglas as reglas
from . import solicitudes_reglas as sol_reglas
from .convocatorias import _solo_admin_json
from .models import Evaluacion, MiembroComite, SolicitudBecas
from .views import rol_requerido

log = logging.getLogger(__name__)

SIN_ASIGNAR = "Sin asignar"


def _evaluadores():
    """Docentes que pertenecen a algun comite como evaluadores."""
    vistos, lista = set(), []
    filas = (MiembroComite.objects
             .filter(es_evaluador__iexact="S")
             .values_list("id_docente_id", "id_docente__nombre",
                          "id_docente__apellido", "id_comite__nombre_comite")
             .order_by("id_docente__nombre"))
    for did, nom, ape, comite in filas:
        if did in vistos:
            continue
        vistos.add(did)
        lista.append({"id": did, "nombre": f"{nom} {ape}", "comite": comite})
    return lista


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def lista(request):
    hoy = date.today()
    tarjetas = []

    evals = (Evaluacion.objects
             .select_related("id_docente", "id_solicitud__id_estudiante",
                             "id_solicitud__id_convocatoria")
             .order_by("-id_solicitud_id", "-id_evaluacion"))
    for e in evals:
        s = e.id_solicitud
        clave = reglas.estado_clave(e.estado)
        puntaje = e.calificacion
        tiene = clave != "pendiente" and puntaje is not None and (puntaje > 0 or clave == "completada")
        tarjetas.append({
            "solicitud": s.id_solicitud, "eval": e.id_evaluacion,
            "estudiante": f"{s.id_estudiante.nombre} {s.id_estudiante.apellido}",
            "convocatoria": s.id_convocatoria.nombre,
            "evaluador": f"{e.id_docente.nombre} {e.id_docente.apellido}",
            "estado": clave, "estado_texto": reglas.ESTADOS[clave][0],
            "puntaje": reglas.puntaje_texto(puntaje) if tiene else "—", "tiene_puntaje": tiene,
            "observaciones": e.observaciones or "",
            "prioridad": ("low" if clave == "completada" else
                          reglas.prioridad(s.id_convocatoria.fecha_finalizacion, hoy)),
        })

    # Solicitudes que todavia esperan evaluador
    sin_eval = (SolicitudBecas.objects
                .filter(evaluacion__isnull=True)
                .select_related("id_estudiante", "id_convocatoria")
                .order_by("-id_solicitud"))
    for s in sin_eval:
        if sol_reglas.estado_visible(s.estado_solicitud)[0] not in sol_reglas.RESOLUBLES:
            continue
        tarjetas.append({
            "solicitud": s.id_solicitud, "eval": "",
            "estudiante": f"{s.id_estudiante.nombre} {s.id_estudiante.apellido}",
            "convocatoria": s.id_convocatoria.nombre,
            "evaluador": SIN_ASIGNAR, "estado": "pendiente",
            "estado_texto": reglas.ESTADOS["pendiente"][0],
            "puntaje": "—", "tiene_puntaje": False, "observaciones": "",
            "prioridad": reglas.prioridad(s.id_convocatoria.fecha_finalizacion, hoy),
        })

    tarjetas.sort(key=lambda t: -t["solicitud"])
    for t in tarjetas:
        t["prioridad_texto"] = reglas.PRIORIDADES[t["prioridad"]]
        t["sin_asignar"] = t["evaluador"] == SIN_ASIGNAR
    return render(request, "usuarios/evaluaciones.html", {
        "evaluaciones": tarjetas,
        "evaluaciones_pendientes": sum(1 for t in tarjetas if t["estado"] == "pendiente"),
        "evaluadores": _evaluadores(),
    })


# ---------------------------------------------------------------------------
# Escritura
# ---------------------------------------------------------------------------
def _mensaje(exc):
    log.exception("Error de base de datos en evaluaciones")
    return sol_reglas.mensaje_oracle(str(exc)) or "No se pudo guardar en la base de datos."


def _evaluador_o_admin_json(vista):
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return JsonResponse({"ok": False, "error": "Tu sesión expiró. Vuelve a iniciar sesión."},
                                status=401)
        if request.session.get("usuario_rol") not in ("ADMINISTRADOR", "EVALUADOR"):
            return JsonResponse({"ok": False, "error": "No tienes permiso para evaluar."},
                                status=403)
        return vista(request, *args, **kwargs)
    return envoltura


def _estados_existentes():
    return list(Evaluacion.objects.values_list("estado", flat=True).distinct())


@_solo_admin_json
@require_POST
def asignar(request):
    try:
        id_sol = int(request.POST.get("solicitud", ""))
        id_doc = int(request.POST.get("docente", ""))
    except ValueError:
        return JsonResponse({"ok": False, "error": "Datos no válidos."}, status=400)

    sol = SolicitudBecas.objects.filter(pk=id_sol).first()
    if sol is None:
        return JsonResponse({"ok": False, "error": "La solicitud no existe."}, status=404)
    if Evaluacion.objects.filter(id_solicitud_id=id_sol).exists():
        return JsonResponse({"ok": False, "error": "Esta solicitud ya tiene evaluador."}, status=409)

    id_comite = (MiembroComite.objects
                 .filter(id_docente_id=id_doc, es_evaluador__iexact="S")
                 .values_list("id_comite_id", flat=True).first())
    if id_comite is None:
        return JsonResponse({"ok": False, "error":
            "Ese docente no es evaluador de ningún comité."}, status=400)

    estado = reglas.valor_estado("progreso", _estados_existentes())
    cols = "ID_COMITE, ID_DOCENTE, FECHA, ID_SOLICITUD, CALIFICACION, ESTADO"
    params = [id_comite, id_doc, date.today(), id_sol, 0, estado]
    marcas = ", ".join(["%s"] * len(params))
    try:
        with connection.cursor() as cur:
            try:
                with transaction.atomic():
                    cur.execute(f"INSERT INTO EVALUACION ({cols}) VALUES ({marcas})", params)
            except IntegrityError as exc:
                t = str(exc).upper()
                if "ORA-01400" not in t or "ID_EVALUACION" not in t:
                    raise
                with transaction.atomic():
                    cur.execute("SELECT NVL(MAX(ID_EVALUACION), 0) + 1 FROM EVALUACION")
                    nuevo = cur.fetchone()[0]
                    cur.execute(f"INSERT INTO EVALUACION (ID_EVALUACION, {cols}) "
                                f"VALUES (%s, {marcas})", [nuevo] + params)
    except IntegrityError as exc:
        if "ORA-00001" in str(exc).upper():
            return JsonResponse({"ok": False, "error": "Esta solicitud ya tiene evaluador."},
                                status=409)
        return JsonResponse({"ok": False, "error": _mensaje(exc)}, status=500)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _mensaje(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Evaluador asignado."})


@_evaluador_o_admin_json
@require_POST
def evaluar(request):
    try:
        id_eval = int(request.POST.get("evaluacion", ""))
    except ValueError:
        return JsonResponse({"ok": False, "error": "Primero debes asignar un evaluador."},
                            status=400)
    ev = Evaluacion.objects.filter(pk=id_eval).first()
    if ev is None:
        return JsonResponse({"ok": False, "error": "La evaluación no existe."}, status=404)
    if reglas.estado_clave(ev.estado) == "completada":
        return JsonResponse({"ok": False, "error": "Esta evaluación ya está completada."},
                            status=409)

    puntaje, error = reglas.validar_puntaje(request.POST.get("puntaje"))
    destino = (request.POST.get("estado") or "").strip().lower()
    if error is None and destino not in ("progreso", "completada"):
        error = "Estado no válido."
    obs, error_obs = reglas.validar_observaciones(request.POST.get("observaciones"))
    if error or error_obs:
        return JsonResponse({"ok": False, "errores": {"puntaje": error or error_obs}},
                            status=400)

    try:
        with transaction.atomic():
            campos = dict(
                observaciones=obs or None,
                calificacion=puntaje,
                estado=reglas.valor_estado(destino, _estados_existentes()),
                fecha=date.today())
            if destino == "completada":
                campos["resultado"] = reglas.resultado(puntaje)
            Evaluacion.objects.filter(pk=id_eval).update(**campos)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _mensaje(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Evaluación guardada."})
