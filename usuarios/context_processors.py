"""Datos de la sesion disponibles en TODAS las plantillas.

Se registra en config/settings.py, dentro de TEMPLATES -> context_processors:
    'usuarios.context_processors.sesion'
"""

ETIQUETAS_ROL = {
    "ADMINISTRADOR": "Administrador",
    "EVALUADOR": "Evaluador",
    "ESTUDIANTE": "Estudiante",
}


def sesion(request):
    rol = request.session.get("usuario_rol", "")
    return {
        "rol": rol,
        "rol_etiqueta": ETIQUETAS_ROL.get(rol, ""),
    }