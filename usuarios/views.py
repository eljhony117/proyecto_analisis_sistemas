import re
import secrets
from functools import wraps

from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import DatabaseError, IntegrityError
from django.db.models import Count
from django.shortcuts import redirect, render

from .models import Convocatoria, Evaluacion, HistorialEstado, SolicitudBecas, Usuario

# Roles que se pueden elegir al registrarse (deben coincidir con CK_USU_ROL en Oracle)
ROLES_REGISTRABLES = ("ADMINISTRADOR", "EVALUADOR", "ESTUDIANTE")

PATRON_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$")

# (valor en la base, etiqueta en pantalla, clase CSS de la barra)
NIVELES = [
    ("MEDIO", "Nivel Medio", "blue-fill"),
    ("UNIVERSIDAD", "Universitario", "green-fill"),
    ("POSGRADO", "Posgrado", "yellow-fill"),
]

# Color del punto en "Actividad reciente" segun el estado nuevo
DOT_POR_ESTADO = {
    "APROBADA": "dot-green",
    "RECHAZADA": "dot-red",
    "EN_REVISION": "dot-blue",
    "PENDIENTE": "dot-yellow",
}


# ---------------------------------------------------------------------------
# Control de acceso
# ---------------------------------------------------------------------------
def login_requerido(vista):
    """Si no hay sesion iniciada, manda al login."""
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return redirect("login")
        return vista(request, *args, **kwargs)
    return envoltura


def rol_requerido(*roles):
    """Exige sesion iniciada y que el rol del usuario este en `roles`."""
    def decorador(vista):
        @wraps(vista)
        def envoltura(request, *args, **kwargs):
            if not request.session.get("usuario_id"):
                return redirect("login")
            if request.session.get("usuario_rol") not in roles:
                messages.error(request, "No tenés permiso para entrar a esa sección.")
                return redirect("panel")
            return vista(request, *args, **kwargs)
        return envoltura
    return decorador


# ---------------------------------------------------------------------------
# Inicio de sesion
# ---------------------------------------------------------------------------
def login_view(request):
    if request.method == "POST":
        correo = request.POST.get("correo", "").strip()
        contrasena = request.POST.get("contrasena", "")

        if not correo or not contrasena:
            return render(request, "usuarios/login.html", {
                "error": "Debe ingresar correo y contraseña.",
            })

        try:
            usuario = Usuario.objects.filter(correo__iexact=correo).first()
        except DatabaseError:
            return render(request, "usuarios/login.html", {
                "error": "No se pudo conectar con la base de datos. Intentá de nuevo.",
            })

        if usuario and secrets.compare_digest(
            usuario.contrasena.encode(), contrasena.encode()
        ):
            request.session["usuario_id"] = int(usuario.id_usuario)
            request.session["usuario_nombre"] = usuario.nombre
            request.session["usuario_rol"] = (usuario.rol or "").upper()
            return redirect("panel")

        return render(request, "usuarios/login.html", {
            "error": "Correo o contraseña incorrectos.",
        })

    return render(request, "usuarios/login.html")


def logout_view(request):
    request.session.flush()
    return redirect("login")


# ---------------------------------------------------------------------------
# Registro de cuentas (guarda en la tabla USUARIO)
# ---------------------------------------------------------------------------
def validar_contrasena(contrasena):
    """Mismas reglas que el trigger TRG_VALIDA_PASWORD_USUARIO."""
    if not 8 <= len(contrasena) <= 18:
        return "La contraseña debe tener entre 8 y 18 caracteres."
    if not re.search(r"[A-Z]", contrasena):
        return "La contraseña debe tener al menos una letra mayúscula."
    if not re.search(r"[a-z]", contrasena):
        return "La contraseña debe tener al menos una letra minúscula."
    if not re.search(r"[0-9]", contrasena):
        return "La contraseña debe tener al menos un número."
    if not re.search(r"[^A-Za-z0-9]", contrasena):
        return "La contraseña debe tener al menos un carácter especial."
    return None


def mensaje_oracle(error):
    """Saca el texto de un error ORA-200xx lanzado por un trigger."""
    m = re.search(r"ORA-200\d\d:\s*(.+)", str(error))
    return m.group(1).strip() if m else None


def registro_view(request):
    if request.method != "POST":
        return redirect("login")

    nombre = " ".join(request.POST.get("nombre", "").split())
    correo = request.POST.get("correo", "").strip()
    rol = request.POST.get("rol", "").strip().upper()
    contrasena = request.POST.get("contrasena", "")
    confirmar = request.POST.get("confirmar", "")

    print("ROL RECIBIDO DEL FORMULARIO:", repr(rol))

    def volver(error):
        return render(request, "usuarios/login.html", {
            "error_registro": error,
            "tab": "registro",
            "form_nombre": nombre,
            "form_correo": correo,
            "form_rol": rol,
        })

    if not nombre or not correo or not contrasena:
        return volver("Completá todos los campos.")

    if len(nombre) > 50 or not PATRON_NOMBRE.match(nombre):
        return volver("El nombre solo puede tener letras y espacios (máximo 50 caracteres).")

    try:
        validate_email(correo)
    except ValidationError:
        return volver("El correo no es válido.")
    if len(correo) > 100:
        return volver("El correo es demasiado largo (máximo 100 caracteres).")

    if rol not in ROLES_REGISTRABLES:
        return volver("Elegí un rol válido.")

    if contrasena != confirmar:
        return volver("Las contraseñas no coinciden.")

    error = validar_contrasena(contrasena)
    if error:
        return volver(error)

    try:
        if Usuario.objects.filter(correo__iexact=correo).exists():
            return volver("Ya existe una cuenta con ese correo.")
        Usuario.objects.create(
            nombre=nombre, contrasena=contrasena, correo=correo, rol=rol
        )
    except IntegrityError:
        return volver("No se pudo crear la cuenta: el correo ya está registrado o un dato no cumple las reglas.")
    except DatabaseError as e:
        return volver(mensaje_oracle(e) or "No se pudo conectar con la base de datos. Intentá de nuevo.")

    messages.success(request, "Cuenta creada. Ya podés iniciar sesión.")
    return redirect("login")


# ---------------------------------------------------------------------------
# Panel
# ---------------------------------------------------------------------------
@login_requerido
def panel_view(request):
    nombre = request.session.get("usuario_nombre", "")

    # ---- Totales de solicitudes ----
    total = SolicitudBecas.objects.count()
    aprobadas = SolicitudBecas.objects.filter(
        estado_solicitud__iexact="APROBADA"
    ).count()
    tasa = round(aprobadas * 100 / total, 1) if total else 0

    # ---- Solicitudes por nivel (segun el nivel del estudiante) ----
    conteo = (
        SolicitudBecas.objects
        .values_list("id_estudiante__nivel_educativo")
        .annotate(n=Count("pk"))
        .order_by()
    )
    por_nivel = {}
    for nivel, n in conteo:
        clave = (nivel or "").upper()
        por_nivel[clave] = por_nivel.get(clave, 0) + n

    niveles = []
    for clave, etiqueta, color in NIVELES:
        n = por_nivel.get(clave, 0)
        niveles.append({
            "etiqueta": etiqueta,
            "total": n,
            "color": color,
            "pct": round(n * 100 / total) if total else 0,
        })

    # ---- Convocatorias abiertas (las 5 que cierran primero) ----
    abiertas = (
        Convocatoria.objects
        .filter(estado__iexact="ABIERTO")
        .select_related("id_institucion")
        .annotate(n_solicitudes=Count("solicitudbecas"))
        .order_by("fecha_finalizacion")[:5]
    )
    convocatorias = []
    for c in abiertas:
        inst = c.id_institucion
        if inst is None:
            nivel = "GENERAL"
        elif inst.id_universidad_id:
            nivel = "UNIVERSITARIO"
        else:
            nivel = "NIVEL MEDIO"
        convocatorias.append({
            "nombre": c.nombre,
            "nivel": nivel,
            "cierre": c.fecha_finalizacion,
            "solicitudes": c.n_solicitudes,
            # No hay campo de cupo en la base: el porcentaje es la parte
            # de todas las solicitudes que recibio esta convocatoria.
            "pct": round(c.n_solicitudes * 100 / total) if total else 0,
        })

    # ---- Actividad reciente (ultimos cambios de estado) ----
    actividad = []
    ultimos = HistorialEstado.objects.order_by("-fecha_cambio", "-id_historial")[:6]
    for h in ultimos:
        anterior = h.estado_anterior.replace("_", " ").lower()
        nuevo = h.estado_nuevo.replace("_", " ").lower()
        actividad.append({
            "texto": f"Solicitud #{h.id_solicitud_id}: de {anterior} a {nuevo}",
            "fecha": h.fecha_cambio,
            "dot": DOT_POR_ESTADO.get(h.estado_nuevo.upper(), "dot-blue-dark"),
        })

    # ---- Evaluaciones que aun no terminan (para el badge del menu) ----
    evaluaciones_pendientes = Evaluacion.objects.exclude(
        estado__iexact="COMPLETADA"
    ).count()

    contexto = {
        "usuario_nombre": nombre,
        "iniciales": nombre[:2].upper(),
        "total": total,
        "aprobadas": aprobadas,
        "tasa": tasa,
        "niveles": niveles,
        "convocatorias": convocatorias,
        "actividad": actividad,
        "evaluaciones_pendientes": evaluaciones_pendientes,
    }
    return render(request, "usuarios/panel.html", contexto)


# ---------------------------------------------------------------------------
# Otras paginas (todavia sin datos de Oracle), con el permiso de cada rol
# ---------------------------------------------------------------------------
@rol_requerido("ADMINISTRADOR", "ESTUDIANTE")
def convocatorias_view(request):
    return render(request, "usuarios/convocatorias.html")


@login_requerido
def solicitudes_view(request):
    return render(request, "usuarios/solicitudes.html")


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def evaluaciones_view(request):
    return render(request, "usuarios/evaluaciones.html")


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def comites_view(request):
    return render(request, "usuarios/comites.html")


@rol_requerido("ADMINISTRADOR", "EVALUADOR")
def reportes_view(request):
    return render(request, "usuarios/reportes.html")