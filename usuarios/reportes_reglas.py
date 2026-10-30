"""Calculo de los reportes, sin depender de Django (se puede probar solo)."""
from datetime import date

from .solicitudes_reglas import estado_visible, nivel_texto

MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
NIVELES = [("Nivel Medio", "blue-fill"), ("Universitario", "green-fill"),
           ("Posgrado", "yellow-fill")]


def _pct(parte, total):
    return round(parte * 100 / total) if total else 0


def _ultimos_meses(hoy, cantidad=6):
    meses = []
    y, m = hoy.year, hoy.month
    for _ in range(cantidad):
        meses.append((y, m))
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return list(reversed(meses))


def resumir(filas, convocatorias, hoy):
    """filas: [(id_convocatoria, estado_db, nivel_db, fecha_solicitud o None)]
    convocatorias: [(id_convocatoria, nombre)]."""
    total = len(filas)
    estados = [estado_visible(f[1])[0] for f in filas]
    aprobadas = estados.count("aprobada")

    # ---- por mes (ultimos 6) ----
    claves = _ultimos_meses(hoy)
    conteo = {k: 0 for k in claves}
    for f in filas:
        d = f[3]
        if d and (d.year, d.month) in conteo:
            conteo[(d.year, d.month)] += 1
    mayor = max(conteo.values()) if conteo else 0
    meses = [{"etiqueta": MESES_CORTOS[m - 1], "n": conteo[(y, m)],
              "alto": round(conteo[(y, m)] * 100 / mayor) if mayor else 0}
             for (y, m) in claves]

    # ---- por nivel educativo ----
    por_nivel = {}
    for f in filas:
        n = nivel_texto(f[2])
        por_nivel[n] = por_nivel.get(n, 0) + 1
    niveles = [{"etiqueta": nom, "n": por_nivel.get(nom, 0),
                "pct": _pct(por_nivel.get(nom, 0), total), "color": col}
               for nom, col in NIVELES]

    # ---- por convocatoria ----
    por_conv = []
    for cid, nombre in convocatorias:
        sel = [e for f, e in zip(filas, estados) if f[0] == cid]
        n = len(sel)
        ap, re_ = sel.count("aprobada"), sel.count("rechazada")
        por_conv.append({"nombre": nombre, "n": n, "aprobadas": ap,
                         "rechazadas": re_, "pendientes": n - ap - re_,
                         "pct": _pct(ap, n)})
    por_conv.sort(key=lambda c: (-c["n"], c["nombre"]))

    return {"total": total, "aprobadas": aprobadas,
            "tasa": round(aprobadas * 100 / total, 1) if total else 0,
            "meses": meses, "niveles": niveles, "por_conv": por_conv}
