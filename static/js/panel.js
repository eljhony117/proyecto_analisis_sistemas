document.addEventListener("DOMContentLoaded", function () {



    const notificationButton = document.getElementById("notificationButton");

    const notificationPanel = document.getElementById("notificationPanel");

    const notificationClose = document.getElementById("notificationClose");

    const notificationDot = document.getElementById("notificationDot");

    const notificationCounter = document.getElementById("notificationCounter");

    const markNotificationsRead = document.getElementById("markNotificationsRead");



    // Seguridad: si los elementos no existen, no ejecutar el resto.

    if (!notificationButton || !notificationPanel) {

        return;

    }



    // ABRIR / CERRAR NOTIFICACIONES

    notificationButton.addEventListener("click", function (event) {

        event.stopPropagation();



        const isOpen = notificationPanel.classList.toggle("show");

        notificationButton.setAttribute("aria-expanded", isOpen ? "true" : "false");

    });



    // CERRAR CON LA X

    if (notificationClose) {

        notificationClose.addEventListener("click", function (event) {

            event.stopPropagation();



            notificationPanel.classList.remove("show");

            notificationButton.setAttribute("aria-expanded", "false");

        });

    }



    // EVITAR QUE EL PANEL SE CIERRE AL HACER CLIC DENTRO

    notificationPanel.addEventListener("click", function (event) {

        event.stopPropagation();

    });



    // CERRAR AL HACER CLIC FUERA

    document.addEventListener("click", function () {

        notificationPanel.classList.remove("show");

        notificationButton.setAttribute("aria-expanded", "false");

    });



    // CERRAR CON ESC

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {

            notificationPanel.classList.remove("show");

            notificationButton.setAttribute("aria-expanded", "false");

        }

    });



    // MARCAR TODAS COMO LEÍDAS

    if (markNotificationsRead) {

        markNotificationsRead.addEventListener("click", function () {



            const notifications = document.querySelectorAll(".notification-item");



            notifications.forEach(function (notification) {

                notification.classList.remove("unread");

            });



            // Quitar punto rojo

            if (notificationDot) {

                notificationDot.classList.add("hidden");

            }



            // Actualizar contador

            if (notificationCounter) {

                notificationCounter.textContent = "Sin notificaciones nuevas";

            }



            // Actualizar botón

            markNotificationsRead.textContent = "Todas las notificaciones están leídas";

            markNotificationsRead.disabled = true;

        });

    }



});





/* =========================

   BUSCADOR GLOBAL

\========================= */

document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("globalSearchInput");

    const searchResults = document.getElementById("searchResults");

    const searchResultsList = document.getElementById("searchResultsList");

    const searchClear = document.getElementById("searchClear");

    const globalSearch = document.querySelector(".global-search");

    if (!searchInput || !searchResults || !searchResultsList || !searchClear || !globalSearch) return;



    const searchData = [

        { title: "Solicitud #4821", description: "Aprobada por el Comite de Ciencias", icon: "✓", url: "/solicitudes/", keywords: "4821 solicitud aprobada ciencias" },

        { title: "Maria Lopez Aju", description: "Expediente #3317 - Nuevo documento cargado", icon: "P", url: "/solicitudes/", keywords: "maria lopez aju 3317 expediente estudiante documento" },

        { title: "Solicitud #4799", description: "Documentacion incompleta", icon: "!", url: "/solicitudes/", keywords: "4799 solicitud rechazada documentacion incompleta" },

        { title: "Programa de Becas Tecnicas y Vocacionales", description: "Nivel Medio - 634 solicitudes - Abierta", icon: "B", url: "/convocatorias/", keywords: "programa becas tecnicas vocacionales nivel medio 634 abierta" },

        { title: "Beca Mujer en Ciencia y Tecnologia", description: "Universitario - 57 solicitudes - Proxima", icon: "B", url: "/convocatorias/", keywords: "beca mujer ciencia tecnologia universitario 57 proxima" },

        { title: "Beca Tecnica 2026", description: "Convocatoria publicada", icon: "B", url: "/convocatorias/", keywords: "beca tecnica 2026 convocatoria publicada" },

        { title: "Comite de Ciencias", description: "Comite evaluador", icon: "C", url: "/comites/", keywords: "comite ciencias evaluador" },

        { title: "Area de Humanidades", description: "Comite evaluador asignado", icon: "C", url: "/comites/", keywords: "area humanidades comite evaluador asignado" }

    ];



    function normalizeText(value) { return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

    function closeSearch() { searchResults.classList.remove("show"); }

    function renderResults(query) {

        const q = normalizeText(query.trim());

        searchResultsList.innerHTML = "";

        if (!q) { closeSearch(); searchClear.classList.remove("show"); return; }

        searchClear.classList.add("show");

        const results = searchData.filter(item => normalizeText(item.title + " " + item.description + " " + item.keywords).includes(q));

        searchResults.classList.add("show");

        if (!results.length) {

            searchResultsList.innerHTML = '\<div class="search-empty">\<strong>No se encontraron resultados\</strong>\<p>Prueba con otro nombre, expediente o numero de solicitud.\</p>\</div>';

            return;

        }

        results.forEach(function (item) {

            const link = document.createElement("a");

            link.href = item.url;

            link.className = "search-result-item";

            const icon = document.createElement("span"); icon.className = "search-result-icon"; icon.textContent = item.icon;

            const content = document.createElement("div"); content.className = "search-result-content";

            const strong = document.createElement("strong"); strong.textContent = item.title;

            const p = document.createElement("p"); p.textContent = item.description;

            content.append(strong, p);

            const arrow = document.createElement("span"); arrow.className = "search-result-arrow"; arrow.textContent = "→";

            link.append(icon, content, arrow);

            searchResultsList.appendChild(link);

        });

    }

    searchInput.addEventListener("input", () => renderResults(searchInput.value));

    searchInput.addEventListener("focus", () => { if (searchInput.value.trim()) renderResults(searchInput.value); });

    searchClear.addEventListener("click", function (event) { event.stopPropagation(); searchInput.value = ""; searchResultsList.innerHTML = ""; closeSearch(); searchClear.classList.remove("show"); searchInput.focus(); });

    document.addEventListener("click", event => { if (!globalSearch.contains(event.target)) closeSearch(); });

    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Escape") { closeSearch(); searchInput.blur(); }

        if (event.key === "Enter") { const first = searchResultsList.querySelector(".search-result-item"); if (first) window.location.href = first.href; }

    });

});





/* =========================

   ACTIVIDAD RECIENTE

\========================= */



document.addEventListener("DOMContentLoaded", function () {

    const activityItems = document.querySelectorAll(".activity-clickable");

    const openHistoryButton = document.getElementById("openHistoryModal");

    const historyModal = document.getElementById("historyModal");

    const closeHistoryButton = document.getElementById("closeHistoryModal");



    activityItems.forEach(function (item) {

        function openActivity() {

            const url = item.dataset.url;



            if (url) {

                window.location.href = url;

            }

        }



        item.addEventListener("click", openActivity);



        item.addEventListener("keydown", function (event) {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();

                openActivity();

            }

        });

    });



    function openHistoryModal() {

        if (!historyModal) {

            return;

        }



        historyModal.classList.add("show");

        historyModal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");



        if (closeHistoryButton) {

            closeHistoryButton.focus();

        }

    }



    function closeHistoryModal() {

        if (!historyModal) {

            return;

        }



        historyModal.classList.remove("show");

        historyModal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");



        if (openHistoryButton) {

            openHistoryButton.focus();

        }

    }



    if (openHistoryButton) {

        openHistoryButton.addEventListener("click", openHistoryModal);

    }



    if (closeHistoryButton) {

        closeHistoryButton.addEventListener("click", closeHistoryModal);

    }



    if (historyModal) {

        historyModal.addEventListener("click", function (event) {

            if (event.target === historyModal) {

                closeHistoryModal();

            }

        });

    }



    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && historyModal && historyModal.classList.contains("show")) {

            closeHistoryModal();

        }

    });

});





/* =========================

   HISTORIAL - CORRECCION

\========================= */



(function () {

    function iniciarHistorial() {

        const botonAbrir = document.getElementById("openHistoryModal");

        const modal = document.getElementById("historyModal");

        const botonCerrar = document.getElementById("closeHistoryModal");



        if (!botonAbrir || !modal) {

            return;

        }



        function abrirHistorial(event) {

            if (event) {

                event.preventDefault();

                event.stopPropagation();

            }



            modal.classList.add("show");

            modal.setAttribute("aria-hidden", "false");

            document.body.classList.add("modal-open");

        }



        function cerrarHistorial() {

            modal.classList.remove("show");

            modal.setAttribute("aria-hidden", "true");

            document.body.classList.remove("modal-open");

        }



        botonAbrir.onclick = abrirHistorial;



        if (botonCerrar) {

            botonCerrar.onclick = cerrarHistorial;

        }



        modal.addEventListener("click", function (event) {

            if (event.target === modal) {

                cerrarHistorial();

            }

        });



        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && modal.classList.contains("show")) {

                cerrarHistorial();

            }

        });

    }



    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", iniciarHistorial);

    } else {

        iniciarHistorial();

    }

})();

document.addEventListener("DOMContentLoaded", function () {
 const committeeModal=document.getElementById("committeeModal"), reportModal=document.getElementById("reportModal");
 function openModal(m){if(m){m.classList.add("show");m.setAttribute("aria-hidden","false");document.body.classList.add("modal-open")}}
 function closeModal(m){if(m){m.classList.remove("show");m.setAttribute("aria-hidden","true");if(!document.querySelector(".action-modal-overlay.show,.history-modal-overlay.show"))document.body.classList.remove("modal-open")}}
 document.getElementById("openCommitteeModal")?.addEventListener("click",()=>openModal(committeeModal));
 document.getElementById("openReportModal")?.addEventListener("click",()=>openModal(reportModal));
 document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",()=>closeModal(document.getElementById(b.dataset.closeModal))));
 [committeeModal,reportModal].forEach(m=>m?.addEventListener("click",e=>{if(e.target===m)closeModal(m)}));
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal(committeeModal);closeModal(reportModal)}});

 const committeeSelect=document.getElementById("committeeSelect"), committeeMembers=document.getElementById("committeeMembers"), committeeCall=document.getElementById("committeeCall"), committeeFeedback=document.getElementById("committeeFeedback");
 const members={"Comité de Ciencias":["Dra. Ana Morales","Ing. Carlos Méndez","Lic. Sofía López"],"Área de Humanidades":["Lic. Marta Pérez","Dr. Luis Herrera","M.A. Andrea Castillo"],"Comité Técnico Nacional":["Ing. José Ramírez","Lic. Elena García","Dr. Pablo Díaz"]};
 committeeSelect?.addEventListener("change",function(){committeeMembers.innerHTML='<span class="members-label">Integrantes</span>';const list=members[this.value]||[];if(!list.length){committeeMembers.innerHTML+="<p>Selecciona un comité para visualizar sus integrantes.</p>";return}list.forEach(n=>{const s=document.createElement("span");s.className="member-chip";s.textContent=n;committeeMembers.appendChild(s)})});
 document.getElementById("assignCommitteeButton")?.addEventListener("click",function(){committeeFeedback.className="action-feedback show";if(!committeeCall.value||!committeeSelect.value){committeeFeedback.classList.add("error");committeeFeedback.textContent="Selecciona una convocatoria y un comité antes de continuar.";return}committeeFeedback.classList.add("success");committeeFeedback.textContent=committeeSelect.value+" fue asignado correctamente a "+committeeCall.value+"."});

 const rt=document.getElementById("reportType"),rc=document.getElementById("reportCall"),rs=document.getElementById("reportStatus"),rp=document.getElementById("reportPreviewText"),rf=document.getElementById("reportFeedback");
 function preview(){if(rp)rp.textContent=(rt.value||"Tipo no seleccionado")+" · "+rc.value+" · Estado: "+rs.value+" · Formato: "+(document.querySelector('input[name="reportFormat"]:checked')?.value||"PDF")}
 [rt,rc,rs].forEach(e=>e?.addEventListener("change",preview));document.querySelectorAll('input[name="reportFormat"]').forEach(e=>e.addEventListener("change",preview));
 document.getElementById("generateReportButton")?.addEventListener("click",function(){rf.className="action-feedback show";if(!rt.value){rf.classList.add("error");rf.textContent="Selecciona el tipo de reporte que deseas generar.";return}rf.classList.add("success");rf.textContent="Reporte preparado correctamente en formato "+(document.querySelector('input[name="reportFormat"]:checked')?.value||"PDF")+". En la versión con base de datos se generará el archivo real."});preview();
});
