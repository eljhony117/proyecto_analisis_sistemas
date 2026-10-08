from django.urls import path
from . import views


urlpatterns = [
    path("", views.login_view, name="login"),

    path("panel/", views.panel_view, name="panel"),

    path(
        "convocatorias/",
        views.convocatorias_view,
        name="convocatorias"
    ),

    path(
        "solicitudes/",
        views.solicitudes_view,
        name="solicitudes"
    ),

    path(
        "evaluaciones/",
        views.evaluaciones_view,
        name="evaluaciones"
    ),

    path(
        "comites/",
        views.comites_view,
        name="comites"
    ),

    path(
        "reportes/",
        views.reportes_view,
        name="reportes"
    ),
]