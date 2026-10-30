"""Reglas de las solicitudes de beca, sin depender de Django (se pueden probar solas)."""
import unicodedata

from .convocatorias_reglas import fecha_texto  # noqa: F401  (mismo formato "30 dic 2026")

# clave de pantalla -> (texto, valor en la base)
ESTADOS = {
    "pendiente": ("Pendiente", "PENDIENTE"),
    "revision": ("En revisión", "EN REVISION"),
    "aprobada": ("Aprobada", "APROBADA"),
    "rechazada": ("Rechazada", "RECHAZADA"),
}
# Estados desde los que el administrador puede aprobar o rechazar
RESOLUBLES = ("pendiente", "revision")
DESTINOS = ("aprobada", "rechazada")

NIVELES = {"MEDIO": "Nivel Medio", "UNIVERSIDAD": "Universitario",
           "UNIVERSITARIO": "Universitario", "POSGRADO": "Posgrado"}


def _normal(texto):
    t = unicodedata.normalize("NFD", texto or "")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return " ".join(t.upper().split())


def estado_visible(valor_db):
    """(clave, texto) para mostrar. Valores desconocidos se muestran tal cual."""
    n = _normal(valor_db)
    if n.startswith("APROB"):
        return "aprobada", ESTADOS["aprobada"][0]
    if n.startswith("RECHAZ"):
        return "rechazada", ESTADOS["rechazada"][0]
    if n.startswith("EN REV") or n.startswith("REVIS"):
        return "revision", ESTADOS["revision"][0]
    if n.startswith("PEND"):
        return "pendiente", ESTADOS["pendiente"][0]
    return "pendiente", (valor_db or "Pendiente").capitalize()


def nivel_texto(valor_db):
    return NIVELES.get(_normal(valor_db), (valor_db or "").title())


def validar_cambio(clave_actual, destino):
    """Error (texto) o None. `destino` es 'aprobada' o 'rechazada'."""
    if destino not in DESTINOS:
        return "Acción no válida."
    if clave_actual not in RESOLUBLES:
        return "Esta solicitud ya fue resuelta."
    return None


def mensaje_oracle(texto_error):
    """Saca el mensaje de un RAISE_APPLICATION_ERROR (ORA-20000..20999)."""
    import re
    m = re.search(r"ORA-20\d{3}:\s*(.+)", texto_error or "")
    if not m:
        return None
    return m.group(1).splitlines()[0].strip()
