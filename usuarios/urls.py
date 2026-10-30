from django.urls import path
from . import views, convocatorias, solicitudes, reportes

urlpatterns = [
    path("", views.login_view, name="login"),
    path("panel/", views.panel_view, name="panel"),
    path("salir/", views.logout_view, name="logout"),
    path("registro/", views.registro_view, name="registro"),

    # Convocatorias (Oracle)
    path("convocatorias/", convocatorias.lista, name="convocatorias"),
    path("convocatorias/crear/", convocatorias.crear, name="convocatoria_crear"),
    path("convocatorias/<int:pk>/editar/", convocatorias.editar, name="convocatoria_editar"),
    path("convocatorias/<int:pk>/aplicar/", convocatorias.aplicar, name="convocatoria_aplicar"),

    # Solicitudes (Oracle)
    path("solicitudes/", solicitudes.lista, name="solicitudes"),
    path("solicitudes/<int:pk>/estado/", solicitudes.estado, name="solicitud_estado"),

    # Reportes (Oracle)
    path("reportes/", reportes.lista, name="reportes"),

    # Todavía con datos de ejemplo
    path("evaluaciones/", views.evaluaciones_view, name="evaluaciones"),
    path("comites/", views.comites_view, name="comites"),
]