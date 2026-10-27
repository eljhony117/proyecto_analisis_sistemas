from django.urls import path
from django.db import DatabaseError
from . import views


urlpatterns = [
    path("", views.login_view, name="login"),

    path("panel/", views.panel_view, name="panel"),

    path("salir/", views.logout_view, name="logout"),

    path("registro/", views.registro_view, name="registro"),

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