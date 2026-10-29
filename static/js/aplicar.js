/* Convocatorias: estado "Cerrada" y boton "Aplicar" para el estudiante.

   Va despues de convocatorias.js y no lo modifica. Lee la fecha de cierre que
   ya esta escrita en cada tarjeta ("30 dic 2026"), asi que tambien funciona con
   las tarjetas que se creen o editen despues.

   Reglas:
   - Abierta y con fecha de cierre vigente  -> el estudiante puede aplicar.
   - Proxima                                 -> no puede aplicar todavia.
   - Cerrada (fecha vencida o marcada asi)   -> no puede aplicar.

   IMPORTANTE: por ahora "Aplicar" solo actua en pantalla. Cuando exista la
   conexion con Oracle, enviarSolicitud() debe llamar a una vista de Django que
   vuelva a validar el rol y que la convocatoria siga abierta. */
(function () {
    "use strict";

    var MESES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
                  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };

    function iniciar() {
        var lista = document.querySelector(".convocatorias-list");
        if (!lista) { return; }

        var esEstudiante = document.body.dataset.rol === "ESTUDIANTE";
        var hoy = fechaHoy();
        var ocupado = false;

        // ---------- fechas ----------
        function fechaHoy() {
            var iso = document.body.dataset.hoy;           // la manda el servidor
            var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
            var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date();
            d.setHours(0, 0, 0, 0);
            return d;
        }

        function fechaCierre(card) {
            var el = card.querySelector(".closing-date strong");
            var m = el && /(\d{1,2})\s+([a-z]{3})\w*\s+(\d{4})/i.exec(el.textContent);
            if (!m || !(m[2].toLowerCase() in MESES)) { return null; }
            return new Date(+m[3], MESES[m[2].toLowerCase()], +m[1]);
        }

        // ---------- estado de cada tarjeta ----------
        function actualizarTarjeta(card) {
            var cierre = fechaCierre(card);
            if (card.dataset.status !== "cerrada" && cierre && cierre < hoy) {
                card.dataset.status = "cerrada";
            }

            var estado = card.dataset.status;
            var insignia = card.querySelector(".status");
            if (insignia && estado === "cerrada") {
                insignia.className = "status cerrada";
                insignia.textContent = "Cerrada";
            }
            card.classList.toggle("convocatoria-cerrada", estado === "cerrada");

            if (esEstudiante) { botonAplicar(card, estado); }
        }

        function botonAplicar(card, estado) {
            var cont = card.querySelector(".buttons");
            if (!cont) { return; }
            var btn = cont.querySelector(".apply-button");
            if (!btn) {
                btn = document.createElement("button");
                btn.type = "button";
                btn.className = "apply-button";
                cont.appendChild(btn);
            }
            if (btn.dataset.aplicada === "1") { return; }

            if (estado === "abierta") {
                btn.disabled = false;
                btn.textContent = "Aplicar";
                btn.title = "";
            } else if (estado === "cerrada") {
                btn.disabled = true;
                btn.textContent = "Cerrada";
                btn.title = "Esta convocatoria ya cerró";
            } else {
                btn.disabled = true;
                btn.textContent = "Aún no abre";
                btn.title = "Esta convocatoria todavía no está abierta";
            }
        }

        function actualizarTodas() {
            ocupado = true;
            lista.querySelectorAll(".convocatoria-card").forEach(actualizarTarjeta);
            observador.takeRecords();          // ignora los cambios que hicimos nosotros
            ocupado = false;
        }

        // Si convocatorias.js crea o edita una tarjeta, volvemos a revisar.
        var observador = new MutationObserver(function () {
            if (!ocupado) { actualizarTodas(); }
        });
        observador.observe(lista, { childList: true, subtree: true,
                                    characterData: true, attributes: true,
                                    attributeFilter: ["class", "data-status"] });

        // ---------- filtro "Cerrada" ----------
        var barra = document.querySelector(".filters");
        if (barra && !barra.querySelector('[data-filter="cerrada"]')) {
            var fb = document.createElement("button");
            fb.type = "button";
            fb.className = "filter-button";
            fb.dataset.filter = "cerrada";
            fb.textContent = "Cerrada";
            barra.appendChild(fb);
            fb.addEventListener("click", function () {
                barra.querySelectorAll(".filter-button").forEach(function (b) {
                    b.classList.remove("active");
                });
                fb.classList.add("active");
                lista.querySelectorAll(".convocatoria-card").forEach(function (c) {
                    c.style.display = c.dataset.status === "cerrada" ? "block" : "none";
                });
            });
        }

        // "Cerrada" tambien como opcion al gestionar (solo existe para el administrador)
        var sel = document.getElementById("gestionarEstado");
        if (sel && !sel.querySelector('option[value="cerrada"]')) {
            var op = document.createElement("option");
            op.value = "cerrada";
            op.textContent = "Cerrada";
            sel.appendChild(op);
        }

        actualizarTodas();
        if (esEstudiante) { prepararAplicar(); }

        // ---------- aplicar (solo estudiante) ----------
        function prepararAplicar() {
            var fondo = document.createElement("div");
            fondo.className = "modal-overlay";
            fondo.id = "aplicarModal";
            fondo.innerHTML =
                '<div class="modal-card">' +
                  '<div class="modal-header"><div>' +
                    '<h2>Aplicar a la convocatoria</h2>' +
                    '<p id="aplicarNombre"></p></div>' +
                    '<button class="modal-close" id="aplicarX" type="button">×</button>' +
                  '</div>' +
                  '<div class="modal-body">' +
                    '<p id="aplicarTexto" style="line-height:1.5;color:#36577f"></p>' +
                  '</div>' +
                  '<div class="modal-footer">' +
                    '<button class="secondary-button" id="aplicarCancelar" type="button">Cancelar</button>' +
                    '<button class="primary-button" id="aplicarConfirmar" type="button">Confirmar solicitud</button>' +
                  '</div>' +
                '</div>';
            document.body.appendChild(fondo);

            var tarjeta = null;
            var confirmar = document.getElementById("aplicarConfirmar");

            function cerrar() {
                fondo.classList.remove("show");
                document.body.classList.remove("modal-open");
                tarjeta = null;
            }

            lista.addEventListener("click", function (ev) {
                var btn = ev.target.closest(".apply-button");
                if (!btn || btn.disabled) { return; }
                var card = btn.closest(".convocatoria-card");
                // Se vuelve a comprobar al hacer clic: la fecha pudo vencer
                // mientras la pagina estaba abierta.
                actualizarTarjeta(card);
                if (card.dataset.status !== "abierta") { return; }
                tarjeta = card;
                var nombre = card.querySelector("h3").textContent.trim();
                document.getElementById("aplicarNombre").textContent = nombre;
                document.getElementById("aplicarTexto").textContent =
                    "Se registrará tu solicitud para esta convocatoria. " +
                    "Podrás darle seguimiento en la sección Solicitudes.";
                fondo.classList.add("show");
                document.body.classList.add("modal-open");
            });

            confirmar.addEventListener("click", function () {
                if (!tarjeta) { return; }
                var card = tarjeta;
                if (card.dataset.status !== "abierta") { cerrar(); return; }
                confirmar.disabled = true;
                enviarSolicitud(card).then(function () {
                    var btn = card.querySelector(".apply-button");
                    btn.dataset.aplicada = "1";
                    btn.disabled = true;
                    btn.textContent = "Solicitud enviada ✓";
                    cerrar();
                    aviso("Tu solicitud fue registrada.");
                }, function (err) {
                    aviso((err && err.message) || "No se pudo enviar la solicitud.", true);
                }).then(function () { confirmar.disabled = false; });
            });

            document.getElementById("aplicarX").addEventListener("click", cerrar);
            document.getElementById("aplicarCancelar").addEventListener("click", cerrar);
            fondo.addEventListener("click", function (ev) {
                if (ev.target === fondo) { cerrar(); }
            });
            document.addEventListener("keydown", function (ev) {
                if (ev.key === "Escape" && fondo.classList.contains("show")) { cerrar(); }
            });
        }

        // PENDIENTE (Oracle): reemplazar por un fetch POST a una vista de Django
        // que cree la solicitud del estudiante. Hace falta antes enlazar USUARIO
        // con ESTUDIANTE, para saber que estudiante es quien inicio sesion.
        function enviarSolicitud(card) {
            return Promise.resolve();
        }

        function aviso(texto, error) {
            var viejo = document.querySelector(".aviso-toast");
            if (viejo) { viejo.remove(); }
            var t = document.createElement("div");
            t.className = "aviso-toast" + (error ? " error" : "");
            t.textContent = texto;
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 2600);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
