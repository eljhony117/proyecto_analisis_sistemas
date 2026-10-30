"""Reglas de los comites, sin depender de Django (se pueden probar solas)."""
import re

MAX_NOMBRE = 50
MIN_NOMBRE = 3
# COMITE.NOMBRE_COMITE: se permiten letras, numeros, espacios y signos comunes
PATRON_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,&()\-]+$")


def validar(nombre, ids_docentes, ids_validos):
    """Devuelve (datos, errores). `ids_docentes` son los valores enviados."""
    errores = {}
    nombre = " ".join((nombre or "").split())
    if len(nombre) < MIN_NOMBRE:
        errores["nombre"] = f"El nombre debe tener al menos {MIN_NOMBRE} letras."
    elif len(nombre) > MAX_NOMBRE:
        errores["nombre"] = f"El nombre no puede pasar de {MAX_NOMBRE} caracteres."
    elif not PATRON_NOMBRE.match(nombre):
        errores["nombre"] = "El nombre tiene caracteres no permitidos."

    ids = []
    for v in ids_docentes or []:
        try:
            n = int(str(v).strip())
        except ValueError:
            errores["docentes"] = "Selección de docentes no válida."
            break
        if n not in ids_validos:
            errores["docentes"] = "Selección de docentes no válida."
            break
        if n not in ids:
            ids.append(n)
    if "docentes" not in errores and not ids:
        errores["docentes"] = "Selecciona al menos un docente."
    return {"nombre": nombre, "docentes": ids}, errores


def valores_miembro_por_defecto(filas):
    """(es_evaluador, estado_autorizacion) mas usados en las filas existentes
    [(es_evaluador, estado_autorizacion), ...]; si no hay, valores iniciales."""
    if not filas:
        return "S", "AUTORIZADO"
    cuenta = {}
    for f in filas:
        cuenta[f] = cuenta.get(f, 0) + 1
    return max(cuenta, key=cuenta.get)
