from django.urls import path
from django.db import DatabaseError
from . import views, convocatorias

urlpatterns = [
    path("", views.login_view, name="login"),

    path("panel/", views.panel_view, name="panel"),

    path("salir/", views.logout_view, name="logout"),

    path("registro/", views.registro_view, name="registro"),

    path("convocatorias/", convocatorias.lista, name="convocatorias"),
    
    path("convocatorias/<int:pk>/aplicar/", convocatorias.aplicar, name="convocatoria_aplicar"),

    path(
        "convocatorias/crear/",
        convocatorias.crear,
        name="convocatoria_crear"
    ),

    path(
        "convocatorias/<int:pk>/editar/",
        convocatorias.editar,
        name="convocatoria_editar"
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