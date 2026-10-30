"""Solicitudes de beca con datos reales de Oracle.

- lista: el administrador y el evaluador ven todas; el estudiante solo las suyas.
- estado: solo el administrador aprueba o rechaza (se valida aqui, en el
  servidor). Los triggers de la base (doble aprobacion, historial,
  notificacion, auditoria) se disparan solos con el UPDATE.
"""
import logging

from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from . import solicitudes_reglas as reglas
from .convocatorias import _solo_admin_json
from .models import SolicitudBecas, Usuario
from .views import login_requerido

log = logging.getLogger(__name__)


@login_requerido
def lista(request):
    rol = request.session.get("usuario_rol")
    filas = (SolicitudBecas.objects
             .select_related("id_estudiante", "id_convocatoria")
             .order_by("-id_solicitud"))

    sin_perfil = False
    if rol == "ESTUDIANTE":
        id_est = (Usuario.objects.filter(pk=request.session.get("usuario_id"))
                  .values_list("id_estudiante_id", flat=True).first())
        if id_est:
            filas = filas.filter(id_estudiante_id=id_est)
        else:
            filas, sin_perfil = filas.none(), True

    solicitudes = []
    for s in filas:
        clave, texto = reglas.estado_visible(s.estado_solicitud)
        est = s.id_estudiante
        solicitudes.append({
            "id": s.id_solicitud,
            "estudiante": f"{est.nombre} {est.apellido}",
            "nivel": reglas.nivel_texto(est.nivel_educativo),
            "convocatoria": s.id_convocatoria.nombre,
            "fecha": reglas.fecha_texto(s.fecha_solicitud) if s.fecha_solicitud else "—",
            "estado": clave,
            "estado_texto": texto,
            "resoluble": clave in reglas.RESOLUBLES,
        })
    return render(request, "usuarios/solicitudes.html",
                  {"solicitudes": solicitudes, "sin_perfil": sin_perfil})


@_solo_admin_json
@require_POST
def estado(request, pk):
    destino = (request.POST.get("estado") or "").strip().lower()
    sol = SolicitudBecas.objects.filter(pk=pk).first()
    if sol is None:
        return JsonResponse({"ok": False, "error": "La solicitud no existe."}, status=404)

    actual, _ = reglas.estado_visible(sol.estado_solicitud)
    error = reglas.validar_cambio(actual, destino)
    if error:
        return JsonResponse({"ok": False, "error": error}, status=400)

    try:
        with transaction.atomic():
            SolicitudBecas.objects.filter(pk=pk).update(
                estado_solicitud=reglas.ESTADOS[destino][1])
    except DatabaseError as exc:
        log.exception("Error al cambiar el estado de la solicitud %s", pk)
        # Los mensajes de los triggers (p. ej. doble aprobacion) se muestran tal cual.
        mensaje = reglas.mensaje_oracle(str(exc)) or "No se pudo actualizar la solicitud."
        return JsonResponse({"ok": False, "error": mensaje}, status=409)
    return JsonResponse({"ok": True, "mensaje": "Solicitud " + (
        "aprobada." if destino == "aprobada" else "rechazada.")})
