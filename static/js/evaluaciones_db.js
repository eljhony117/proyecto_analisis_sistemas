/* Evaluaciones: asignar evaluador y guardar puntajes en Oracle.
   Va despues de evaluaciones.js y no lo modifica: intercepta el envio de los
   dos formularios (fase de captura) y adapta lo que la base no guarda. */
(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    function iniciar() {
        var rol = document.body.dataset.rol;
        if (rol !== "ADMINISTRADOR" && rol !== "EVALUADOR") { return; }

        var meta = document.querySelector('meta[name="csrf-token"]');
        var csrf = meta ? meta.content : "";
        var urlAsignar = document.body.dataset.urlAsignar;
        var urlEvaluar = document.body.dataset.urlEvaluar;
        var evaluadores = [];
        try { evaluadores = JSON.parse($("evaluadores-data").textContent); } catch (e) { /* sin lista */ }

        // Evaluadores reales en el formulario de asignar
        var sel = $("assignEvaluator");
        sel.innerHTML = '<option value="">Seleccionar evaluador</option>';
        evaluadores.forEach(function (d) {
            var op = document.createElement("option");
            op.value = d.id;
            op.textContent = d.nombre + " — " + d.comite;
            sel.appendChild(op);
        });

        // La base no guarda observaciones: se oculta ese campo.
        var obs = $("evaluationObservations");
        if (obs) { obs.closest(".form-field").hidden = true; }

        // Cajas de error dentro de cada formulario
        ["assignForm", "evaluationForm"].forEach(function (id) {
            var caja = document.createElement("div");
            caja.id = id + "Error";
            caja.className = "form-error";
            caja.hidden = true;
            $(id).querySelector(".modal-body").appendChild(caja);
        });

        // Tarjeta sobre la que se esta trabajando
        var tarjeta = null;
        document.querySelector(".evaluaciones-list").addEventListener("click", function (ev) {
            var b = ev.target.closest(".assign-button, .evaluate-button");
            if (b) { tarjeta = b.closest(".evaluacion-card"); }
        });

        function enviar(form, url, cuerpo, idError) {
            var boton = form.querySelector('button[type="submit"]');
            var caja = $(idError);
            caja.hidden = true; caja.textContent = "";
            boton.disabled = true;
            fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": csrf,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: new URLSearchParams(cuerpo).toString()
            }).then(function (res) {
                if ((res.headers.get("content-type") || "").indexOf("application/json") === -1) {
                    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
                }
                return res.json();
            }).then(function (datos) {
                if (datos.ok) {
                    aviso(datos.mensaje || "Guardado.");
                    setTimeout(function () { window.location.reload(); }, 600);
                    return;
                }
                var msgs = datos.errores ? Object.keys(datos.errores).map(function (k) {
                    return datos.errores[k];
                }) : [datos.error || "No se pudo guardar."];
                msgs.forEach(function (m) {
                    var l = document.createElement("div"); l.textContent = m; caja.appendChild(l);
                });
                caja.hidden = false;
                boton.disabled = false;
            }).catch(function (err) {
                caja.textContent = err.message || "No se pudo conectar con el servidor.";
                caja.hidden = false;
                boton.disabled = false;
            });
        }

        document.addEventListener("submit", function (ev) {
            var form = ev.target;
            if (form.id === "assignForm") {
                ev.preventDefault(); ev.stopImmediatePropagation();
                if (!tarjeta) { return; }
                enviar(form, urlAsignar,
                       { solicitud: tarjeta.dataset.solicitud, docente: sel.value },
                       "assignFormError");
            } else if (form.id === "evaluationForm") {
                ev.preventDefault(); ev.stopImmediatePropagation();
                if (!tarjeta) { return; }
                enviar(form, urlEvaluar,
                       { evaluacion: tarjeta.dataset.eval || "",
                         puntaje: $("evaluationScore").value,
                         estado: $("evaluationStatus").value },
                       "evaluationFormError");
            }
        }, true);

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
