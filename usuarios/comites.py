"""Comites evaluadores con datos reales de Oracle (COMITE y MIEMBRO_COMITE).

- lista: administrador y evaluador.
- crear / editar: solo el administrador (se valida aqui, en el servidor).
"""
import logging
from functools import wraps

from django.db import DatabaseError, IntegrityError, connection, transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from . import comites_reglas as reglas
from .convocatorias import _solo_admin_json
from .models import Comite, Docente, MiembroComite
from .views import rol_requerido

log = logging.getLogger(__name__)


def _docentes():
    return [{"id": d.id_docente, "nombre": f"{d.nombre} {d.apellido}"}
            for d in Docente.objects.order_by("nombre", "apellido")]


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def lista(request):
    miembros = {}
    for cid, did, nom, ape in (MiembroComite.objects
                               .values_list("id_comite_id", "id_docente_id",
                                            "id_docente__nombre", "id_docente__apellido")
                               .order_by("id_docente__nombre")):
        miembros.setdefault(cid, []).append((did, f"{nom} {ape}"))

    comites = []
    for c in Comite.objects.annotate(n_ev=Count("evaluacion")).order_by("id_comite"):
        m = miembros.get(c.id_comite, [])
        comites.append({
            "id": c.id_comite,
            "nombre": c.nombre_comite,
            "n_miembros": len(m),
            "miembros": "|".join(x[1] for x in m),
            "docentes_ids": ",".join(str(x[0]) for x in m),
            "evaluaciones": c.n_ev,
            "activo": bool(m),
        })
    return render(request, "usuarios/comites.html",
                  {"comites": comites, "docentes": _docentes()})


# ---------------------------------------------------------------------------
# Escritura
# ---------------------------------------------------------------------------
def _error_bd(exc):
    log.exception("Error de base de datos en comites")
    return "No se pudo guardar en la base de datos."


def _valores_miembro(cur):
    cur.execute("SELECT ES_EVALUADOR, ESTADO_AUTORIZACION FROM MIEMBRO_COMITE")
    return reglas.valores_miembro_por_defecto([tuple(r) for r in cur.fetchall()])


def _insertar_comite(cur, nombre):
    """INSERT sin ID (IDENTITY / trigger); si no se llena solo, MAX+1."""
    try:
        with transaction.atomic():
            cur.execute("INSERT INTO COMITE (NOMBRE_COMITE) VALUES (%s)", [nombre])
    except IntegrityError as exc:
        t = str(exc).upper()
        if "ORA-01400" not in t or "ID_COMITE" not in t:
            raise
        with transaction.atomic():
            cur.execute("SELECT NVL(MAX(ID_COMITE), 0) + 1 FROM COMITE")
            nuevo = cur.fetchone()[0]
            cur.execute("INSERT INTO COMITE (ID_COMITE, NOMBRE_COMITE) VALUES (%s, %s)",
                        [nuevo, nombre])
    cur.execute("SELECT MAX(ID_COMITE) FROM COMITE WHERE NOMBRE_COMITE = %s", [nombre])
    return cur.fetchone()[0]


def _agregar_miembros(cur, id_comite, ids, por_defecto):
    for did in ids:
        cur.execute(
            "INSERT INTO MIEMBRO_COMITE (ID_COMITE, ID_DOCENTE, ES_EVALUADOR, "
            "ESTADO_AUTORIZACION) VALUES (%s, %s, %s, %s)",
            [id_comite, did, por_defecto[0], por_defecto[1]])


def _validar(request, excluir_id=None):
    datos, errores = reglas.validar(
        request.POST.get("nombre"), request.POST.getlist("docentes"),
        {d["id"] for d in _docentes()})
    if "nombre" not in errores:
        repetido = Comite.objects.filter(nombre_comite__iexact=datos["nombre"])
        if excluir_id:
            repetido = repetido.exclude(pk=excluir_id)
        if repetido.exists():
            errores["nombre"] = "Ya existe un comité con ese nombre."
    return datos, errores


@_solo_admin_json
@require_POST
def crear(request):
    datos, errores = _validar(request)
    if errores:
        return JsonResponse({"ok": False, "errores": errores}, status=400)
    try:
        with transaction.atomic(), connection.cursor() as cur:
            defecto = _valores_miembro(cur)
            nuevo = _insertar_comite(cur, datos["nombre"])
            _agregar_miembros(cur, nuevo, datos["docentes"], defecto)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Comité creado."})


@_solo_admin_json
@require_POST
def editar(request, pk):
    if not Comite.objects.filter(pk=pk).exists():
        return JsonResponse({"ok": False, "error": "El comité no existe."}, status=404)
    datos, errores = _validar(request, excluir_id=pk)
    if errores:
        return JsonResponse({"ok": False, "errores": errores}, status=400)
    try:
        with transaction.atomic(), connection.cursor() as cur:
            defecto = _valores_miembro(cur)
            Comite.objects.filter(pk=pk).update(nombre_comite=datos["nombre"])
            cur.execute("SELECT ID_DOCENTE FROM MIEMBRO_COMITE WHERE ID_COMITE = %s", [pk])
            actuales = {r[0] for r in cur.fetchall()}
            quitar = actuales - set(datos["docentes"])
            for did in quitar:
                cur.execute("DELETE FROM MIEMBRO_COMITE WHERE ID_COMITE = %s AND ID_DOCENTE = %s",
                            [pk, did])
            _agregar_miembros(cur, pk, [d for d in datos["docentes"] if d not in actuales],
                              defecto)
    except DatabaseError as exc:
        return JsonResponse({"ok": False, "error": _error_bd(exc)}, status=500)
    return JsonResponse({"ok": True, "mensaje": "Cambios guardados."})
