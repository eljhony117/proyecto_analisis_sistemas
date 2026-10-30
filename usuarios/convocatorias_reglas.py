"""Reglas de las convocatorias, sin depender de Django.

Todo lo que valida o decide algo vive aqui para poder probarlo solo. Las vistas
(convocatorias.py) solo leen la base, llaman a estas funciones y responden.

Las reglas replican las restricciones de la tabla CONVOCATORIA en Oracle:
  CK_CONV_NOMBRE  -> solo letras (con tildes y ñ) y espacios
  CK_CONV_FECHAS  -> FECHA_FINALIZACION >= FECHA_INICIO
  CK_CONV_ESTADO  -> ABIERTO, CERRADO o CANCELADO
  NOMBRE VARCHAR2(50), DESCRIPCION VARCHAR2(500), CUPOS NUMBER(6)
"""
import re
from datetime import date

ESTADOS_DB = ("ABIERTO", "CERRADO", "CANCELADO")
ETIQUETA_ESTADO_DB = {"ABIERTO": "Abierta", "CERRADO": "Cerrada", "CANCELADO": "Cancelada"}

PATRON_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$")
MAX_NOMBRE = 50
MIN_NOMBRE = 3
MAX_DESCRIPCION = 500
MAX_CUPOS = 999999

MESES = ["ene", "feb", "mar", "abr", "may", "jun",
         "jul", "ago", "sep", "oct", "nov", "dic"]


def fecha_texto(d):
    """30 dic 2026. Es el formato que lee el JS de las tarjetas, y no depende
    del idioma del servidor."""
    return f"{d.day:02d} {MESES[d.month - 1]} {d.year}"


def estado_visible(estado_db, inicio, fin, hoy):
    """Estado que se muestra en pantalla: (clave, etiqueta).

    La base solo guarda ABIERTO, CERRADO o CANCELADO. "Proxima" no se guarda:
    es una convocatoria ABIERTO cuya fecha de inicio todavia no llega. Una
    ABIERTO cuya fecha de cierre ya paso se muestra como Cerrada.
    """
    e = (estado_db or "").strip().upper()
    if e == "CANCELADO":
        return "cerrada", "Cancelada"
    if e == "CERRADO" or fin < hoy:
        return "cerrada", "Cerrada"
    if inicio > hoy:
        return "proxima", "Próxima"
    return "abierta", "Abierta"


def nivel_y_nombre(inst):
    """(id, nivel, nombre) de una institucion.

    La tabla INSTITUCION no tiene nombre: apunta a una universidad o a una
    escuela. Universidad -> UNIVERSITARIO; escuela -> NIVEL MEDIO.
    """
    if inst is None:
        return None, "GENERAL", "Sin institución"
    if inst.id_universidad_id:
        return inst.id_institucion, "UNIVERSITARIO", inst.id_universidad.nombre
    if inst.id_escuela_id:
        return inst.id_institucion, "NIVEL MEDIO", inst.id_escuela.nombre
    return inst.id_institucion, "GENERAL", f"Institución {inst.id_institucion}"


def porcentaje(solicitudes, cupos):
    if not cupos:
        return 0
    return min(100, round(solicitudes * 100 / cupos))


def _fecha(valor):
    try:
        return date.fromisoformat((valor or "").strip())
    except ValueError:
        return None


def _entero(valor):
    try:
        return int(str(valor).strip())
    except (TypeError, ValueError):
        return None


def validar(post, ids_instituciones, hoy, creando):
    """Valida lo que manda el formulario.

    `post` es un dict (request.POST sirve). Devuelve (datos, errores):
    `errores` es {campo: mensaje} y esta vacio si todo esta bien. Al crear,
    la fecha de cierre no puede ser anterior a hoy; al editar si (para poder
    cerrar o reabrir convocatorias viejas).
    """
    errores = {}
    datos = {}

    nombre = " ".join((post.get("nombre") or "").split())
    if len(nombre) < MIN_NOMBRE:
        errores["nombre"] = f"El nombre debe tener al menos {MIN_NOMBRE} letras."
    elif len(nombre) > MAX_NOMBRE:
        errores["nombre"] = f"El nombre no puede pasar de {MAX_NOMBRE} caracteres."
    elif not PATRON_NOMBRE.match(nombre):
        errores["nombre"] = "El nombre solo puede tener letras y espacios (sin números ni signos)."
    datos["nombre"] = nombre

    inst = _entero(post.get("institucion"))
    if inst is None or inst not in ids_instituciones:
        errores["institucion"] = "Selecciona una institución de la lista."
    datos["institucion"] = inst

    inicio = _fecha(post.get("fecha_inicio"))
    fin = _fecha(post.get("fecha_cierre"))
    if inicio is None:
        errores["fecha_inicio"] = "Indica la fecha de inicio."
    if fin is None:
        errores["fecha_cierre"] = "Indica la fecha de cierre."
    if inicio and fin:
        if fin < inicio:
            errores["fecha_cierre"] = "La fecha de cierre no puede ser anterior a la de inicio."
        elif creando and fin < hoy:
            errores["fecha_cierre"] = "La fecha de cierre ya pasó."
    datos["fecha_inicio"], datos["fecha_cierre"] = inicio, fin

    cupos = _entero(post.get("cupos"))
    if cupos is None or not (1 <= cupos <= MAX_CUPOS):
        errores["cupos"] = f"Los cupos deben ser un número entre 1 y {MAX_CUPOS}."
    datos["cupos"] = cupos

    descripcion = (post.get("descripcion") or "").strip()
    if not descripcion:
        errores["descripcion"] = "Escribe una descripción."
    elif len(descripcion) > MAX_DESCRIPCION:
        errores["descripcion"] = f"La descripción no puede pasar de {MAX_DESCRIPCION} caracteres."
    datos["descripcion"] = descripcion

    if creando:
        datos["estado"] = "ABIERTO"
    else:
        estado = (post.get("estado") or "").strip().upper()
        if estado not in ESTADOS_DB:
            errores["estado"] = "Selecciona un estado válido."
        datos["estado"] = estado

    return datos, errores


# ---------------------------------------------------------------------------
# Aplicar a una convocatoria (SOLICITUD_BECAS)
# ---------------------------------------------------------------------------
# Estado con el que nace una solicitud. TRG_VALIDA_DOBLE_APROBACION usa
# 'APROBADA'; si la tabla tiene un CHECK con otros valores, cambiar aqui.
ESTADO_SOLICITUD_INICIAL = "PENDIENTE"

DEPARTAMENTOS = [
    "Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula",
    "El Progreso", "Escuintla", "Guatemala", "Huehuetenango", "Izabal",
    "Jalapa", "Jutiapa", "Petén", "Quetzaltenango", "Quiché", "Retalhuleu",
    "Sacatepéquez", "San Marcos", "Santa Rosa", "Sololá", "Suchitepéquez",
    "Totonicapán", "Zacapa",
]


def validar_aplicacion(departamento, clave_estado):
    """(departamento_limpio, error). `clave_estado` viene de estado_visible."""
    if clave_estado == "proxima":
        return None, "Esta convocatoria todavía no está abierta."
    if clave_estado != "abierta":
        return None, "Esta convocatoria ya no recibe solicitudes."
    dep = (departamento or "").strip()
    if dep not in DEPARTAMENTOS:
        return None, "Selecciona un departamento de la lista."
    return dep, None
