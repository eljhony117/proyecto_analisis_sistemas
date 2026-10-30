/* Comites: crear y gestionar guardando en Oracle (solo administrador).
   Va despues de comites.js y no lo modifica: intercepta el envio del
   formulario (fase de captura) y agrega la lista de docentes. */
(function () {
    "use strict";

    function $(id) { return document.getElementById(id); }

    function iniciar() {
        if (document.body.dataset.rol !== "ADMINISTRADOR") { return; }
        var form = $("committeeForm");
        if (!form) { return; }

        var meta = document.querySelector('meta[name="csrf-token"]');
        var csrf = meta ? meta.content : "";
        var urlCrear = document.body.dataset.urlCrear;
        var urlEditar = document.body.dataset.urlEditar;     // .../comites/0/editar/
        var docentes = [];
        try { docentes = JSON.parse($("docentes-data").textContent); } catch (e) { /* sin lista */ }
        var idEditando = null;

        var lista = $("comiteDocentes");
        docentes.forEach(function (d) {
            var et = document.createElement("label");
            et.className = "docente-opcion";
            var cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = d.id;
            et.appendChild(cb);
            et.appendChild(document.createTextNode(" " + d.nombre));
            lista.appendChild(et);
        });
        if (!docentes.length) { lista.textContent = "No hay docentes registrados."; }

        function marcar(ids) {
            lista.querySelectorAll("input").forEach(function (cb) {
                cb.checked = ids.indexOf(cb.value) !== -1;
            });
        }
        function limpiarError() { var c = $("comiteError"); c.hidden = true; c.textContent = ""; }

        // "Nuevo comite" (comites.js ya abrio el modal; este listener corre despues)
        $("newCommitteeButton").addEventListener("click", function () {
            idEditando = null; marcar([]); limpiarError();
        });
        // "Gestionar"
        $("committeeGrid").addEventListener("click", function (ev) {
            var boton = ev.target.closest(".manage-button");
            if (!boton) { return; }
            var card = boton.closest(".committee-card");
            idEditando = card.dataset.id;
            limpiarError();
            marcar((card.dataset.docentes || "").split(",").filter(Boolean));
        });

        document.addEventListener("submit", function (ev) {
            if (ev.target !== form) { return; }
            ev.preventDefault();
            ev.stopImmediatePropagation();

            var cuerpo = new URLSearchParams();
            cuerpo.append("nombre", $("committeeName").value);
            lista.querySelectorAll("input:checked").forEach(function (cb) {
                cuerpo.append("docentes", cb.value);
            });
            var url = idEditando ? urlEditar.replace("/0/", "/" + idEditando + "/") : urlCrear;
            var boton = form.querySelector('button[type="submit"]');
            limpiarError();
            boton.disabled = true;

            fetch(url, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": csrf,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: cuerpo.toString()
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
                var caja = $("comiteError");
                caja.textContent = "";
                msgs.forEach(function (m) {
                    var l = document.createElement("div"); l.textContent = m; caja.appendChild(l);
                });
                caja.hidden = false;
                boton.disabled = false;
            }).catch(function (err) {
                var caja = $("comiteError");
                caja.textContent = err.message || "No se pudo conectar con el servidor.";
                caja.hidden = false;
                boton.disabled = false;
            });
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
