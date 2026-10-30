"""Reportes y estadisticas con datos reales de Oracle (solo lectura)."""
from datetime import date

from django.shortcuts import render

from . import reportes_reglas as reglas
from .convocatorias_reglas import estado_visible as estado_conv
from .models import Convocatoria, Evaluacion, SolicitudBecas
from .views import rol_requerido


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def lista(request):
    hoy = date.today()
    filas = list(SolicitudBecas.objects.values_list(
        "id_convocatoria_id", "estado_solicitud",
        "id_estudiante__nivel_educativo", "fecha_solicitud"))
    convs = list(Convocatoria.objects.order_by("id_convocatoria"))

    datos = reglas.resumir(
        filas, [(c.id_convocatoria, c.nombre) for c in convs], hoy)
    datos["convocatorias_abiertas"] = sum(
        1 for c in convs
        if estado_conv(c.estado, c.fecha_inicio, c.fecha_finalizacion, hoy)[0] == "abierta")
    datos["evaluaciones"] = Evaluacion.objects.count()
    datos["meses_rango"] = (f'{datos["meses"][0]["etiqueta"]} – '
                            f'{datos["meses"][-1]["etiqueta"]} {hoy.year}')
    return render(request, "usuarios/reportes.html", datos)
