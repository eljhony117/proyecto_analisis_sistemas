"""Convocatorias con datos reales de Oracle: listar, crear y editar.

- lista:  la ven el administrador y el estudiante.
- crear / editar: solo el administrador. El permiso se valida aqui, en el
  servidor; ocultar los botones en pantalla no basta.

Las reglas (validaciones, estado visible, textos) estan en
convocatorias_reglas.py.
"""
import logging
from datetime import date
from functools import wraps

from django.conf import settings
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from . import convocatorias_reglas as reglas
from .models import Convocatoria, Institucion, SolicitudBecas, Usuario
from .views import rol_requerido

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Permiso para los endpoints que responden JSON
# (rol_requerido redirige a otra pagina; aqui hay que responder con un error)
# ---------------------------------------------------------------------------
def _solo_admin_json(vista):
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return JsonResponse(
                {"ok": False, "error": "Tu sesión expiró. Vuelve a iniciar sesión."},
                status=401)
        if request.session.get("usuario_rol") != "ADMINISTRADOR":
            return JsonResponse(
                {"ok": False, "error": "Solo el administrador puede hacer esto."},
                status=403)
        return vista(request, *args, **kwargs)
    return envoltura


# ---------------------------------------------------------------------------
# Lectura
# ---------------------------------------------------------------------------
def _instituciones():
    filas = Institucion.objects.select_related("id_universidad", "id_escuela") \
                               .order_by("id_institucion")
    lista = []
    for inst in filas:
        id_, nivel, nombre = reglas.nivel_y_nombre(inst)
        lista.append({"id": id_, "nivel": nivel, "nombre": nombre})
    return lista


def _id_estudiante(request):
    """ID_ESTUDIANTE del usuario que inicio sesion (None si no esta enlazado)."""
    return (Usuario.objects
            .filter(pk=request.session.get("usuario_id"))
            .values_list("id_estudiante_id", flat=True)
            .first())


@rol_requerido("ADMINISTRADOR", "ESTUDIANTE")
def lista(request):
    hoy = date.today()
    filas = (
        Convocatoria.objects
        .select_related("id_institucion__id_universidad", "id_institucion__id_escuela")
        .annotate(n_solicitudes=Count("solicitudbecas"))
        .order_by("-fecha_inicio", "-id_convocatoria")
    )

    # Solo para el estudiante: a que convocatorias ya aplico y si su usuario
    # ya esta enlazado con una fila de ESTUDIANTE.
    id_estudiante = None
    aplicadas = set()
    if request.session.get("usuario_rol") == "ESTUDIANTE":
        id_estudiante = _id_estudiante(request)
        if id_estudiante:
            aplicadas = set(SolicitudBecas.objects
                            .filter(id_estudiante_id=id_estudiante)
                            .values_list("id_convocatoria_id", flat=True))

    tarjetas = []
    for c in filas:
        inst_id, nivel, inst_nombre = reglas.nivel_y_nombre(c.id_institucion)
        estado_ui, etiqueta = reglas.estado_visible(
            c.estado, c.fecha_inicio, c.fecha_finalizacion, hoy)
        cupos = c.cupos or 0
        pct = reglas.porcentaje(c.n_solicitudes, cupos)
        tarjetas.append({
            "id": c.id_convocatoria,
            "nombre": c.nombre,
            "descripcion": c.descripcion or "",
            "nivel": nivel,
            "institucion": inst_nombre,
            "institucion_id": inst_id if inst_id is not None else "",
            "estado_db": (c.estado or "").upper(),
            "estado_ui": estado_ui,
            "etiqueta": etiqueta,
            "inicio_iso": c.fecha_inicio.isoformat(),
            "fin_iso": c.fecha_finalizacion.isoformat(),
            "fin_txt": reglas.fecha_texto(c.fecha_finalizacion),
            "cupos": cupos,
            "n": c.n_solicitudes,
            "pct": pct,
            "lleno": pct >= 100,
            "aplicada": 1 if c.id_convocatoria in aplicadas else 0,
        })

    return render(request, "usuarios/convocatorias.html", {
        "convocatorias": tarjetas,
        "instituciones": _instituciones(),
        "hoy": hoy.isoformat(),
        "tiene_perfil": 1 if id_estudiante else 0,
        "departamentos": reglas.DEPARTAMENTOS,
    })


# ---------------------------------------------------------------------------
# Escritura
# ---------------------------------------------------------------------------
def _error_bd(exc):
    """Mensaje para el usuario. El detalle tecnico solo va al registro."""
    log.exception("Error de base de datos en convocatorias")
    texto = str(exc).upper()
    if "CK_CONV_NOMBRE" in texto:
        return "El nombre solo puede tener letras y espacios."
    if "CK_CONV_FECHAS" in texto:
        return "La fecha de cierre no puede ser anterior a la de inicio."
    if "CK_CONV_ESTADO" in texto:
        return "Estado no permitido por la base de datos."
    if "CK_CONV_CUPOS" in texto:
        return "Los cupos deben ser mayores que cero."
    mensaje = "No se pudo guardar en la base de datos."
    if settings.DEBUG:
        mensaje += " (" + str(exc).splitlines()[0] + ")"
    return mensaje


COLUMNAS = ("NOMBRE, FECHA_INICIO, FECHA_FINALIZACION, ESTADO, "
            "ID_INSTITUCION, DESCRIPCION, CUPOS")


def _insertar(datos):
    """INSERT sin la columna de ID: se llena sola si es IDENTITY o si hay un
    trigger con secuencia. Si no se llena sola (ORA-01400 sobre
    ID_CONVOCATORIA) se calcula el siguiente numero."""
    params = [datos["nombre"], datos["fecha_inicio"], datos["fecha_cierre"],
              datos["estado"], datos["institucion"], datos["descripcion"],
              datos["cupos"]]
    marcas = ", ".join(["%s"] * len(params))
    with connection.cursor() as cur:
        try:
            with transaction.atomic():
                cur.execute(
                    f"INSERT INTO CONVOCATORIA ({COLUMNAS}) VALUES ({marcas})", params)
        except IntegrityError as exc:
            texto = str(exc).upper()
            if "ORA-01400" not in texto or "ID_CONVOCATORIA" not in texto:
                raise
            with transaction.atomic():
                cur.execute(
                    "SELECT NVL(MAX(ID_CONVOCATORIA), 0) + 1 FROM CONVOCATORIA")
                nuevo = cur.fetchone()[0]
                cur.execute(
                    f"INSERT INTO CONVOCATORIA (ID_CONVOCATORIA, {COLUMNAS}) "
                    f"VALUES (%s, {marcas})", [nuevo] + params)


def _ids_instituciones():
    return set(Institucion.objects.values_list("id_institucion", flat=True))


@_solo_admin_json
@require_POST
def crear(request):
    datos, errores = reglas.validar(
        request.POST, _ids_instituciones(), hoy=date.today(), creando=True)
    if errores:
        return JsonResponse({"ok": False, "errores": errores}, status=400)
    try:
        _insertar(datos)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Convocatoria creada."})


@_solo_admin_json
@require_POST
def editar(request, pk):
    if not Convocatoria.objects.filter(pk=pk).exists():
        return JsonResponse({"ok": False, "error": "La convocatoria no existe."},
                            status=404)
    datos, errores = reglas.validar(
        request.POST, _ids_instituciones(), hoy=date.today(), creando=False)
    if errores:
        return JsonResponse({"ok": False, "errores": errores}, status=400)
    try:
        with transaction.atomic():
            Convocatoria.objects.filter(pk=pk).update(
                nombre=datos["nombre"],
                fecha_inicio=datos["fecha_inicio"],
                fecha_finalizacion=datos["fecha_cierre"],
                estado=datos["estado"],
                id_institucion_id=datos["institucion"],
                descripcion=datos["descripcion"],
                cupos=datos["cupos"],
            )
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Cambios guardados."})


# ---------------------------------------------------------------------------
# Aplicar (solo estudiante)
# ---------------------------------------------------------------------------
def _solo_estudiante_json(vista):
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return JsonResponse(
                {"ok": False, "error": "Tu sesión expiró. Vuelve a iniciar sesión."},
                status=401)
        if request.session.get("usuario_rol") != "ESTUDIANTE":
            return JsonResponse(
                {"ok": False, "error": "Solo un estudiante puede aplicar."},
                status=403)
        return vista(request, *args, **kwargs)
    return envoltura


@_solo_estudiante_json
@require_POST
def aplicar(request, pk):
    id_estudiante = _id_estudiante(request)
    if not id_estudiante:
        return JsonResponse({"ok": False, "error":
            "Tu usuario aún no tiene perfil de estudiante. "
            "Pide al administrador que lo complete."}, status=409)

    conv = Convocatoria.objects.filter(pk=pk).first()
    if conv is None:
        return JsonResponse({"ok": False, "error": "La convocatoria no existe."},
                            status=404)

    # El estado se vuelve a calcular aqui: el boton deshabilitado no basta.
    clave, _ = reglas.estado_visible(
        conv.estado, conv.fecha_inicio, conv.fecha_finalizacion, date.today())
    depto, error = reglas.validar_aplicacion(request.POST.get("departamento"), clave)
    if error:
        return JsonResponse({"ok": False, "error": error}, status=400)

    if SolicitudBecas.objects.filter(
            id_estudiante_id=id_estudiante, id_convocatoria_id=pk).exists():
        return JsonResponse({"ok": False, "error": "Ya aplicaste a esta convocatoria."},
                            status=409)

    try:
        _insertar_solicitud(id_estudiante, pk, depto)
    except IntegrityError as exc:
        if "UNIQUE" in str(exc).upper() or "ORA-00001" in str(exc).upper():
            return JsonResponse({"ok": False, "error": "Ya aplicaste a esta convocatoria."},
                                status=409)
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Tu solicitud fue registrada."})


COLUMNAS_SOL = "ID_ESTUDIANTE, ID_CONVOCATORIA, ESTADO_SOLICITUD, DEPARTAMENTO"


def _insertar_solicitud(id_estudiante, id_convocatoria, departamento):
    """Igual que _insertar: sin ID si la columna se llena sola; si no, MAX+1."""
    params = [id_estudiante, id_convocatoria,
              reglas.ESTADO_SOLICITUD_INICIAL, departamento]
    marcas = ", ".join(["%s"] * len(params))
    with connection.cursor() as cur:
        try:
            with transaction.atomic():
                cur.execute(
                    f"INSERT INTO SOLICITUD_BECAS ({COLUMNAS_SOL}) VALUES ({marcas})",
                    params)
        except IntegrityError as exc:
            texto = str(exc).upper()
            if "ORA-01400" not in texto or "ID_SOLICITUD" not in texto:
                raise
            with transaction.atomic():
                cur.execute("SELECT NVL(MAX(ID_SOLICITUD), 0) + 1 FROM SOLICITUD_BECAS")
                nuevo = cur.fetchone()[0]
                cur.execute(
                    f"INSERT INTO SOLICITUD_BECAS (ID_SOLICITUD, {COLUMNAS_SOL}) "
                    f"VALUES (%s, {marcas})", [nuevo] + params)
