import secrets
from functools import wraps

from django.db.models import Count
from django.shortcuts import redirect, render

from .models import (
    Convocatoria,
    Evaluacion,
    HistorialEstado,
    SolicitudBecas,
    Usuario,
)

# Valor en la base de datos, etiqueta en pantalla y clase CSS
NIVELES = [
    ("MEDIO", "Nivel Medio", "blue-fill"),
    ("UNIVERSIDAD", "Universitario", "green-fill"),
    ("POSGRADO", "Posgrado", "yellow-fill"),
]

# Color del punto en "Actividad reciente" según el estado nuevo
DOT_POR_ESTADO = {
    "APROBADA": "dot-green",
    "RECHAZADA": "dot-red",
    "EN_REVISION": "dot-blue",
    "PENDIENTE": "dot-yellow",
}

# ---------------------------------------------------------------------------
# Sesión
# ---------------------------------------------------------------------------
def login_requerido(vista):
    """Si no hay sesión iniciada, manda al login."""

    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return redirect("login")

        return vista(request, *args, **kwargs)

    return envoltura

# ---------------------------------------------------------------------------
# Inicio de sesión
# ---------------------------------------------------------------------------
def login_view(request):
    if request.method == "POST":
        correo = request.POST.get("correo", "").strip()
        # No aplicar strip() a la contraseña.
        contrasena = request.POST.get("contrasena", "")

        if not correo or not contrasena:
            return render(request, "usuarios/login.html", {
                "error": "Debe ingresar correo y contraseña."
            })

        try:
            usuario = Usuario.objects.filter(
                correo__iexact=correo
            ).first()

            # Diagnóstico temporal: no imprimir contraseñas.
            print("¿Usuario encontrado?:", usuario is not None)

            if usuario is not None:
                coincide = secrets.compare_digest(
                    usuario.contrasena.encode("utf-8"),
                    contrasena.encode("utf-8"),
                )

                print("¿Contraseña coincide?:", coincide)

                if coincide:
                    request.session["usuario_id"] = usuario.id_usuario
                    request.session["usuario_nombre"] = usuario.nombre

                    return redirect("panel")

            return render(request, "usuarios/login.html", {
                "error": "Correo o contraseña incorrectos."
            })

        except Exception as e:
            # Diagnóstico temporal para desarrollo.
            print("Error al intentar iniciar sesión:", repr(e))

            return render(request, "usuarios/login.html", {
                "error": (
                    "Ocurrió un error al intentar iniciar sesión. "
                    "Revisa la terminal para conocer el detalle."
                )
            })

    return render(request, "usuarios/login.html")

# ---------------------------------------------------------------------------
# Cerrar sesión
# ---------------------------------------------------------------------------
def logout_view(request):
    request.session.flush()
    return redirect("login")

# ---------------------------------------------------------------------------
# Panel principal
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

    # ---- Solicitudes por nivel educativo ----
    conteo = (
        SolicitudBecas.objects
        .values_list("id_estudainte__nivel_educativo")
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

    # ---- Convocatorias abiertas: las cinco que cierran primero ----
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
            "pct": (
                round(c.n_solicitudes * 100 / total)
                if total else 0
            ),
        })

    # ---- Actividad reciente: últimos cambios de estado ----
    actividad = []

    ultimos = (
        HistorialEstado.objects
        .order_by("-fecha_cambio", "-id_historial")[:6]
    )

    for h in ultimos:
        anterior = h.estado_anterior.replace("_", " ").lower()
        nuevo = h.estado_nuevo.replace("_", " ").lower()

        actividad.append({
            "texto": (
                f"Solicitud #{h.id_solicitud_id}: "
                f"de {anterior} a {nuevo}"
            ),
            "fecha": h.fecha_cambio,
            "dot": DOT_POR_ESTADO.get(
                h.estado_nuevo.upper(),
                "dot-blue-dark",
            ),
        })

    # ---- Evaluaciones que aún no terminan ----
    evaluaciones_pendientes = (
        Evaluacion.objects
        .exclude(estado__iexact="COMPLETADA")
        .count()
    )

    # ---- Datos enviados a la plantilla ----
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

    # IMPORTANTE: el panel debe cargar panel.html.
    return render(request, "usuarios/panel.html", contexto)
# ---------------------------------------------------------------------------
# Otras páginas
# ---------------------------------------------------------------------------
@login_requerido
def convocatorias_view(request):
    return render(request, "usuarios/convocatorias.html")

@login_requerido
def solicitudes_view(request):
    return render(request, "usuarios/solicitudes.html")

@login_requerido
def evaluaciones_view(request):
    return render(request, "usuarios/evaluaciones.html")

@login_requerido
def comites_view(request):
    return render(request, "usuarios/comites.html")

@login_requerido
def reportes_view(request):
    return render(request, "usuarios/reportes.html")