"""Datos de la sesion disponibles en TODAS las plantillas.

Se registra en config/settings.py, dentro de TEMPLATES -> context_processors:
    'usuarios.context_processors.sesion'
"""
from django.db import DatabaseError

ETIQUETAS_ROL = {
    "ADMINISTRADOR": "Administrador",
    "EVALUADOR": "Evaluador",
    "ESTUDIANTE": "Estudiante",
}


def _evaluaciones_pendientes():
    """Evaluaciones que aun no terminan (numerito del menu).

    Django llama a esta funcion solo si la plantilla usa la variable,
    asi que no consulta Oracle en las paginas que no muestran el menu.
    """
    from .models import Evaluacion

    try:
        return Evaluacion.objects.exclude(estado__iexact="COMPLETADA").count()
    except DatabaseError:
        return 0


def sesion(request):
    rol = request.session.get("usuario_rol", "")
    nombre = request.session.get("usuario_nombre", "")
    return {
        "rol": rol,
        "rol_etiqueta": ETIQUETAS_ROL.get(rol, ""),
        "usuario_nombre": nombre,
        "iniciales": nombre[:2].upper(),
        # Si la vista pasa este mismo dato, el de la vista manda.
        "evaluaciones_pendientes": _evaluaciones_pendientes,
    }