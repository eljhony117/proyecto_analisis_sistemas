/* Solicitudes: aprobar / rechazar guardando en Oracle (solo administrador).
   Va despues de solicitudes.js. Intercepta los botones de aprobar y rechazar
   en la fase de captura, para que no corra el cambio "de mentira" en pantalla. */
(function () {
    "use strict";

    function iniciar() {
        if (document.body.dataset.rol !== "ADMINISTRADOR") { return; }
        var meta = document.querySelector('meta[name="csrf-token"]');
        var csrf = meta ? meta.content : "";
        var base = document.body.dataset.urlEstado;      // .../solicitudes/0/estado/

        document.addEventListener("click", function (ev) {
            var boton = ev.target.closest(".action-approve, .action-reject");
            if (!boton) { return; }
            ev.preventDefault();
            ev.stopImmediatePropagation();

            var fila = boton.closest(".solicitud-row");
            if (!fila || !fila.dataset.id) { return; }
            var aprobar = boton.classList.contains("action-approve");
            var alumno = fila.querySelector(".student").textContent.trim();
            if (!window.confirm((aprobar ? "¿Deseas aprobar" : "¿Deseas rechazar") +
                                " la solicitud de " + alumno + "?")) { return; }

            boton.disabled = true;
            fetch(base.replace("/0/", "/" + fila.dataset.id + "/"), {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "X-CSRFToken": csrf,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: new URLSearchParams({ estado: aprobar ? "aprobada" : "rechazada" }).toString()
            }).then(function (res) {
                if ((res.headers.get("content-type") || "").indexOf("application/json") === -1) {
                    throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
                }
                return res.json();
            }).then(function (datos) {
                if (!datos.ok) { throw new Error(datos.error || "No se pudo guardar."); }
                aviso(datos.mensaje, false);
                setTimeout(function () { window.location.reload(); }, 700);
            }).catch(function (err) {
                boton.disabled = false;
                aviso(err.message || "No se pudo conectar con el servidor.", true);
            });
        }, true);

        function aviso(texto, error) {
            var viejo = document.querySelector(".aviso-toast");
            if (viejo) { viejo.remove(); }
            var t = document.createElement("div");
            t.className = "aviso-toast" + (error ? " error" : "");
            t.textContent = texto;
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 4000);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
