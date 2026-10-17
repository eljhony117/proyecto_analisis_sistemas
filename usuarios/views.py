import secrets
from functools import wraps

from django.db.models import Count
from django.shortcuts import redirect, render

from .models import Convocatoria, Evaluacion, HistorialEstado, SolicitudBecas, Usuario

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
# Sesion
# ---------------------------------------------------------------------------
def login_requerido(vista):
    """Si no hay sesion iniciada, manda al login."""
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        if not request.session.get("usuario_id"):
            return redirect("login")
        return vista(request, *args, **kwargs)
    return envoltura


def login_view(request):
    if request.method == "POST":
        correo = (request.POST.get("correo") or request.POST.get("email") or "").strip()
        contrasena = request.POST.get("contrasena") or request.POST.get("password") or ""

        usuario = Usuario.objects.filter(correo__iexact=correo).first()
        if usuario and secrets.compare_digest(
            usuario.contrasena.encode(), contrasena.encode()
        ):
            request.session["usuario_id"] = int(usuario.id_usuario)
            request.session["usuario_nombre"] = usuario.nombre
            return redirect("panel")

        return render(request, "usuarios/login.html",
                      {"error": "Correo o contraseña incorrectos."})

    return render(request, "usuarios/login.html")


def logout_view(request):
    request.session.flush()
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
# Otras paginas (todavia sin datos de Oracle POR EL MOMENTO)
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