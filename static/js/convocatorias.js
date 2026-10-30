/* Convocatorias: crear y gestionar guardando en Oracle (solo administrador).

   Va despues de convocatorias.js y no lo modifica. Hace tres cosas:
   1) Intercepta el envio de "Nueva convocatoria" y de "Gestionar" para
      mandarlos al servidor, en vez de dibujar la tarjeta solo en pantalla.
   2) Adapta el formulario de "Gestionar" (que convocatorias.js crea con
      Nivel y Estado de demostracion) a los campos reales: Institucion, fecha
      de inicio y los estados que acepta la base.
   3) Muestra los errores del servidor dentro del formulario.

   El permiso real se valida en el servidor (convocatorias.py). */
(function () {
    "use strict";

    var ESTADOS = [["ABIERTO", "Abierta"], ["CERRADO", "Cerrada"], ["CANCELADO", "Cancelada"]];
    var NOMBRE_PATRON = "[A-Za-zÁÉÍÓÚáéíóúÑñ ]+";

    function $(id) { return document.getElementById(id); }

    function iniciar() {
        if (document.body.dataset.rol !== "ADMINISTRADOR") { return; }

        var meta = document.querySelector('meta[name="csrf-token"]');
        var csrf = meta ? meta.content : "";
        var urlCrear = document.body.dataset.urlCrear;
        var urlEditar = document.body.dataset.urlEditar;     // .../convocatorias/0/editar/
        var hoy = document.body.dataset.hoy || "";
        var instituciones = [];
        try {
            instituciones = JSON.parse($("instituciones-data").textContent);
        } catch (e) { /* sin lista: el formulario de gestionar quedara vacio */ }

        var idEditando = null;

        // ---------- 2) adaptar el formulario de Gestionar ----------
        var selInst = $("gestionarNivel");
        if (selInst) {
            selInst.innerHTML = '<option value="">Seleccionar</option>';
            instituciones.forEach(function (i) {
                var op = document.createElement("option");
                op.value = i.id;
                op.textContent = i.nombre + " · " + i.nivel;
                selInst.appendChild(op);
            });
            selInst.closest(".form-field").querySelector("label").textContent = "Institución";
        }

        var selEstado = $("gestionarEstado");
        if (selEstado) {
            selEstado.innerHTML = "";
            ESTADOS.forEach(function (e) {
                var op = document.createElement("option");
                op.value = e[0];
                op.textContent = e[1];
                selEstado.appendChild(op);
            });
        }

        var campoCierre = $("gestionarFecha");
        if (campoCierre && !$("gestionarInicio")) {
            var cont = document.createElement("div");
            cont.className = "form-field";
            cont.innerHTML = '<label>Fecha de inicio</label>' +
                '<input id="gestionarInicio" type="date" required>';
            var destino = campoCierre.closest(".form-field");
            destino.parentNode.insertBefore(cont, destino);
        }

        var nombreG = $("gestionarNombre");
        if (nombreG) {
            nombreG.maxLength = 50;
            nombreG.pattern = NOMBRE_PATRON;
            nombreG.title = "Solo letras y espacios (sin números ni signos)";
        }
        var descG = $("gestionarDescripcion");
        if (descG) { descG.maxLength = 500; }
        var cuposG = $("gestionarCupos");
        if (cuposG) { cuposG.max = 999999; }

        var formG = $("formGestionarConvocatoria");
        if (formG && !$("gestionarError")) {
            var caja = document.createElement("div");
            caja.id = "gestionarError";
            caja.className = "form-error";
            caja.hidden = true;
            formG.querySelector(".modal-body").appendChild(caja);
        }

        // ---------- valores por defecto al abrir "Nueva convocatoria" ----------
        document.addEventListener("click", function (ev) {
            if (ev.target.closest("#openNewConvModal")) {
                limpiarError("newConvError");
                if (!$("convStartDate").value) { $("convStartDate").value = hoy; }
                $("convCloseDate").min = hoy;
            }
        });

        // ---------- cargar los datos reales al abrir "Gestionar" ----------
        // convocatorias.js ya abrio el modal con datos de demostracion; este
        // listener corre despues (esta en document, el suyo en la lista).
        document.addEventListener("click", function (ev) {
            var boton = ev.target.closest(".manage-button");
            if (!boton) { return; }
            var card = boton.closest(".convocatoria-card");
            if (!card) { return; }
            idEditando = card.dataset.id;
            limpiarError("gestionarError");
            $("gestionarNombre").value = card.querySelector("h3").textContent.trim();
            $("gestionarNivel").value = card.dataset.institucion || "";
            $("gestionarEstado").value = card.dataset.estadoDb || "ABIERTO";
            $("gestionarInicio").value = card.dataset.inicio || "";
            $("gestionarFecha").value = card.dataset.cierre || "";
            $("gestionarCupos").value = card.dataset.cupos || "";
            var p = card.querySelector(".card-information > p");
            $("gestionarDescripcion").value =
                (!p || p.classList.contains("sin-descripcion")) ? "" : p.textContent.trim();
        });

        // ---------- 1) guardar en el servidor ----------
        // Captura en document: corre antes que el envio de convocatorias.js y
        // lo detiene.
        document.addEventListener("submit", function (ev) {
            var form = ev.target;
            if (form.id === "newConvForm") {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                enviar(form, urlCrear, "newConvError", {
                    nombre: $("convName").value,
                    institucion: $("convInstitucion").value,
                    fecha_inicio: $("convStartDate").value,
                    fecha_cierre: $("convCloseDate").value,
                    cupos: $("convSlots").value,
                    descripcion: $("convDescription").value
                });
            } else if (form.id === "formGestionarConvocatoria") {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                if (!idEditando) { return; }
                enviar(form, urlEditar.replace("/0/", "/" + idEditando + "/"), "gestionarError", {
                    nombre: $("gestionarNombre").value,
                    institucion: $("gestionarNivel").value,
                    estado: $("gestionarEstado").value,
                    fecha_inicio: $("gestionarInicio").value,
                    fecha_cierre: $("gestionarFecha").value,
                    cupos: $("gestionarCupos").value,
                    descripcion: $("gestionarDescripcion").value
                });
            }
        }, true);

        function enviar(form, url, idError, campos) {
            var boton = form.querySelector('button[type="submit"]');
            limpiarError(idError);
            if (boton) { boton.disabled = true; }

            fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": csrf,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: new URLSearchParams(campos).toString()
            }).then(function (res) {
                var tipo = res.headers.get("content-type") || "";
                if (tipo.indexOf("application/json") === -1) {
                    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
                }
                return res.json();
            }).then(function (datos) {
                if (datos.ok) {
                    aviso(datos.mensaje || "Guardado.");
                    // Se recarga para mostrar lo que quedo guardado en Oracle.
                    setTimeout(function () { window.location.reload(); }, 600);
                    return;
                }
                mostrarError(idError, datos);
                if (boton) { boton.disabled = false; }
            }).catch(function (err) {
                mostrarError(idError, {
                    error: (err && err.message) || "No se pudo conectar con el servidor."
                });
                if (boton) { boton.disabled = false; }
            });
        }

        function mostrarError(idError, datos) {
            var caja = $(idError);
            if (!caja) { return; }
            var mensajes = datos.errores ? Object.keys(datos.errores).map(function (k) {
                return datos.errores[k];
            }) : [datos.error || "No se pudo guardar."];
            caja.textContent = "";
            mensajes.forEach(function (m) {
                var linea = document.createElement("div");
                linea.textContent = m;           // textContent: nunca se interpreta como HTML
                caja.appendChild(linea);
            });
            caja.hidden = false;
        }

        function limpiarError(idError) {
            var caja = $(idError);
            if (caja) { caja.hidden = true; caja.textContent = ""; }
        }

        function aviso(texto) {
            var viejo = document.querySelector(".aviso-toast");
            if (viejo) { viejo.remove(); }
            var t = document.createElement("div");
            t.className = "aviso-toast";
            t.textContent = texto;
            document.body.appendChild(t);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();