"""Reglas de las evaluaciones, sin depender de Django (se pueden probar solas)."""
import unicodedata

ESTADOS = {"pendiente": ("Pendiente", "PENDIENTE"),
           "progreso": ("En progreso", "EN PROGRESO"),
           "completada": ("Completada", "COMPLETADA")}
PRIORIDADES = {"high": "● Prioridad Alta", "medium": "● Prioridad Media",
               "low": "● Prioridad Baja"}
PUNTAJE_MIN, PUNTAJE_MAX = 0, 100


def _normal(texto):
    t = unicodedata.normalize("NFD", texto or "")
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return " ".join(t.upper().split())


def estado_clave(valor_db):
    n = _normal(valor_db)
    if n.startswith("COMPLET") or n.startswith("FINAL") or n.startswith("TERMIN"):
        return "completada"
    if "PROG" in n or n.startswith("EN "):
        return "progreso"
    return "pendiente"


def valor_estado(clave, existentes):
    """Texto a guardar en la base para `clave`: se reutiliza el que ya usan las
    filas existentes (para respetar el formato del equipo); si no hay, el
    valor por defecto."""
    for v in existentes:
        if v and estado_clave(v) == clave:
            return v
    return ESTADOS[clave][1]


def prioridad(fecha_cierre, hoy):
    """Por urgencia: cuanto mas cerca el cierre de la convocatoria, mas alta."""
    dias = (fecha_cierre - hoy).days
    if dias < 0:
        return "low"
    if dias <= 15:
        return "high"
    if dias <= 45:
        return "medium"
    return "low"


def validar_puntaje(texto):
    """(numero, error)."""
    try:
        n = float(str(texto).strip().replace(",", "."))
    except ValueError:
        return None, f"El puntaje debe ser un número entre {PUNTAJE_MIN} y {PUNTAJE_MAX}."
    if n != n or not (PUNTAJE_MIN <= n <= PUNTAJE_MAX):
        return None, f"El puntaje debe ser un número entre {PUNTAJE_MIN} y {PUNTAJE_MAX}."
    return round(n, 2), None


def puntaje_texto(n):
    return str(int(n)) if float(n).is_integer() else f"{n:.1f}"
