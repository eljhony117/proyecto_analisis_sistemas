document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTOS PRINCIPALES
    // =====================================================

    const solicitudesBody = document.getElementById("solicitudesBody");

    const solicitudSearch = document.getElementById("solicitudSearch");

    const filterButtons =
        document.querySelectorAll(".filter-button");


    // =====================================================
    // FILTROS
    // =====================================================

    let currentFilter = "todos";


    function filterSolicitudes() {

        const text =
            solicitudSearch.value
                .toLowerCase()
                .trim();


        // IMPORTANTE:
        // Se consultan nuevamente las filas para incluir
        // solicitudes creadas dinámicamente.

        const rows =
            document.querySelectorAll(".solicitud-row");


        rows.forEach(row => {

            const status =
                row.dataset.status;

            const rowText =
                row.textContent.toLowerCase();


            const matchesFilter =
                currentFilter === "todos" ||
                status === currentFilter;


            const matchesSearch =
                rowText.includes(text);


            row.style.display =
                matchesFilter && matchesSearch
                    ? ""
                    : "none";

        });

    }


    filterButtons.forEach(button => {

        button.addEventListener("click", function () {

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });


            this.classList.add("active");

            currentFilter =
                this.dataset.filter;


            filterSolicitudes();

        });

    });


    solicitudSearch.addEventListener(
        "input",
        filterSolicitudes
    );


    // =====================================================
    // ESTADOS
    // =====================================================

    const statusInfo = {

        aprobada: {
            text: "Aprobada",
            className: "aprobada"
        },

        revision: {
            text: "En revisión",
            className: "revision"
        },

        pendiente: {
            text: "Pendiente",
            className: "pendiente"
        },

        rechazada: {
            text: "Rechazada",
            className: "rechazada"
        }

    };


    // =====================================================
    // MODAL NUEVA SOLICITUD
    // =====================================================

    const openNewSolicitudModal =
        document.getElementById("openNewSolicitudModal");

    const newSolicitudModal =
        document.getElementById("newSolicitudModal");

    const closeNewSolicitudModal =
        document.getElementById("closeNewSolicitudModal");

    const cancelNewSolicitud =
        document.getElementById("cancelNewSolicitud");

    const newSolicitudForm =
        document.getElementById("newSolicitudForm");


    function openNewModal() {

        newSolicitudModal.classList.add("open");

        document.body.style.overflow = "hidden";

        setTimeout(() => {

            document
                .getElementById("newStudent")
                .focus();

        }, 100);

    }


    function closeNewModal() {

        newSolicitudModal.classList.remove("open");

        document.body.style.overflow = "";

    }


    openNewSolicitudModal.addEventListener(
        "click",
        openNewModal
    );


    closeNewSolicitudModal.addEventListener(
        "click",
        closeNewModal
    );


    cancelNewSolicitud.addEventListener(
        "click",
        closeNewModal
    );


    newSolicitudModal.addEventListener(
        "click",
        function (event) {

            if (event.target === newSolicitudModal) {
                closeNewModal();
            }

        }
    );


    // =====================================================
    // GENERAR SIGUIENTE ID
    // =====================================================

    function getNextSolicitudId() {

        const rows =
            document.querySelectorAll(".solicitud-row");


        let highestId = 0;


        rows.forEach(row => {

            const idCell =
                row.querySelector(".id");


            if (!idCell) {
                return;
            }


            const number =
                parseInt(
                    idCell.textContent.replace("#", "").trim()
                );


            if (!isNaN(number) && number > highestId) {

                highestId = number;

            }

        });


        return highestId + 1;

    }


    // =====================================================
    // FORMATO FECHA
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "";
        }


        const parts =
            dateValue.split("-");


        if (parts.length !== 3) {
            return dateValue;
        }


        const year =
            parts[0];

        const month =
            parseInt(parts[1]);

        const day =
            parts[2];


        const months = [
            "ene",
            "feb",
            "mar",
            "abr",
            "may",
            "jun",
            "jul",
            "ago",
            "sep",
            "oct",
            "nov",
            "dic"
        ];


        return `${day} ${months[month - 1]} ${year}`;

    }


    // =====================================================
    // CREAR BOTONES DE ACCIÓN
    // =====================================================

    function getActionsHTML(status) {

        let html = `

            <button
                class="action-eye"
                type="button"
                title="Ver solicitud"
            >
                ◉
            </button>

        `;


        if (status === "pendiente") {

            html += `

                <button
                    class="action-approve"
                    type="button"
                    title="Aprobar"
                >
                    ✓
                </button>


                <button
                    class="action-reject"
                    type="button"
                    title="Rechazar"
                >
                    ×
                </button>

            `;

        }


        return html;

    }


    // =====================================================
    // CREAR NUEVA SOLICITUD
    // =====================================================

    newSolicitudForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const student =
                document
                    .getElementById("newStudent")
                    .value
                    .trim();


            const level =
                document
                    .getElementById("newLevel")
                    .value;


            const status =
                document
                    .getElementById("newStatus")
                    .value;


            const convocatoria =
                document
                    .getElementById("newConvocatoria")
                    .value;


            const date =
                document
                    .getElementById("newDate")
                    .value;


            if (
                !student ||
                !level ||
                !status ||
                !convocatoria ||
                !date
            ) {

                alert(
                    "Por favor completa todos los campos."
                );

                return;

            }


            const newId =
                getNextSolicitudId();


            const info =
                statusInfo[status];


            const row =
                document.createElement("tr");


            row.className =
                "solicitud-row";


            row.dataset.status =
                status;


            row.innerHTML = `

                <td class="id">
                    #${newId}
                </td>


                <td class="student">
                    ${escapeHTML(student)}
                </td>


                <td>
                    ${escapeHTML(level)}
                </td>


                <td>
                    ${escapeHTML(convocatoria)}
                </td>


                <td>
                    ${formatDate(date)}
                </td>


                <td>

                    <span
                        class="status ${info.className}"
                    >
                        ${info.text}
                    </span>

                </td>


                <td class="actions-cell">

                    ${getActionsHTML(status)}

                </td>

            `;


            solicitudesBody.prepend(row);


            newSolicitudForm.reset();


            // Estado predeterminado
            document
                .getElementById("newStatus")
                .value = "pendiente";


            closeNewModal();


            // Volvemos al filtro "Todos"
            currentFilter = "todos";


            filterButtons.forEach(btn => {

                btn.classList.toggle(
                    "active",
                    btn.dataset.filter === "todos"
                );

            });


            solicitudSearch.value = "";


            filterSolicitudes();


            showToast(
                `Solicitud #${newId} creada correctamente.`,
                "success"
            );

        }
    );


    // =====================================================
    // DETALLE DE SOLICITUD
    // =====================================================

    const detailSolicitudModal =
        document.getElementById("detailSolicitudModal");

    const closeDetailSolicitud =
        document.getElementById("closeDetailSolicitud");

    const closeDetailSolicitudBottom =
        document.getElementById(
            "closeDetailSolicitudBottom"
        );


    function openDetailModal(row) {

        const cells =
            row.querySelectorAll("td");


        const id =
            cells[0].textContent.trim();

        const student =
            cells[1].textContent.trim();

        const level =
            cells[2].textContent.trim();

        const convocatoria =
            cells[3].textContent.trim();

        const date =
            cells[4].textContent.trim();

        const status =
            cells[5].textContent.trim();


        document
            .getElementById("detailSolicitudTitle")
            .textContent =
            `Detalle de solicitud ${id}`;


        document
            .getElementById("detailId")
            .value = id;


        document
            .getElementById("detailStudent")
            .value = student;


        document
            .getElementById("detailLevel")
            .value = level;


        document
            .getElementById("detailConvocatoria")
            .value = convocatoria;


        document
            .getElementById("detailDate")
            .value = date;


        document
            .getElementById("detailStatus")
            .value = status;


        detailSolicitudModal
            .classList
            .add("open");


        document.body.style.overflow =
            "hidden";

    }


    function closeDetailModal() {

        detailSolicitudModal
            .classList
            .remove("open");


        document.body.style.overflow =
            "";

    }


    closeDetailSolicitud.addEventListener(
        "click",
        closeDetailModal
    );


    closeDetailSolicitudBottom.addEventListener(
        "click",
        closeDetailModal
    );


    detailSolicitudModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                detailSolicitudModal
            ) {

                closeDetailModal();

            }

        }
    );


    // =====================================================
    // APROBAR / RECHAZAR
    // =====================================================

    function changeSolicitudStatus(
        row,
        newStatus
    ) {

        const info =
            statusInfo[newStatus];


        if (!info) {
            return;
        }


        row.dataset.status =
            newStatus;


        const statusElement =
            row.querySelector(".status");


        statusElement.className =
            `status ${info.className}`;


        statusElement.textContent =
            info.text;


        const actionsCell =
            row.querySelector(".actions-cell");


        actionsCell.innerHTML =
            getActionsHTML(newStatus);


        const id =
            row.querySelector(".id")
                .textContent
                .trim();


        if (newStatus === "aprobada") {

            showToast(
                `${id} fue aprobada correctamente.`,
                "success"
            );

        }


        if (newStatus === "rechazada") {

            showToast(
                `${id} fue rechazada.`,
                "danger"
            );

        }


        filterSolicitudes();

    }


    // =====================================================
    // EVENT DELEGATION TABLA
    // =====================================================

    solicitudesBody.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest("button");


            if (!button) {
                return;
            }


            const row =
                button.closest(".solicitud-row");


            if (!row) {
                return;
            }


            // VER DETALLE
            if (
                button.classList.contains(
                    "action-eye"
                )
            ) {

                openDetailModal(row);

                return;

            }


            // APROBAR
            if (
                button.classList.contains(
                    "action-approve"
                )
            ) {

                const student =
                    row.querySelector(".student")
                        .textContent
                        .trim();


                const confirmed =
                    confirm(
                        `¿Deseas aprobar la solicitud de ${student}?`
                    );


                if (confirmed) {

                    changeSolicitudStatus(
                        row,
                        "aprobada"
                    );

                }


                return;

            }


            // RECHAZAR
            if (
                button.classList.contains(
                    "action-reject"
                )
            ) {

                const student =
                    row.querySelector(".student")
                        .textContent
                        .trim();


                const confirmed =
                    confirm(
                        `¿Deseas rechazar la solicitud de ${student}?`
                    );


                if (confirmed) {

                    changeSolicitudStatus(
                        row,
                        "rechazada"
                    );

                }

            }

        }
    );


    // =====================================================
    // BUSCADOR GLOBAL
    // =====================================================

    const globalSearchInput =
        document.getElementById(
            "globalSearchInput"
        );

    const globalSearchResults =
        document.getElementById(
            "globalSearchResults"
        );

    const clearGlobalSearch =
        document.getElementById(
            "clearGlobalSearch"
        );


    function closeGlobalSearch() {

        globalSearchResults
            .classList
            .remove("open");

    }


    function performGlobalSearch() {

        const text =
            globalSearchInput
                .value
                .toLowerCase()
                .trim();


        globalSearchResults.innerHTML =
            "";


        clearGlobalSearch
            .classList
            .toggle(
                "visible",
                text.length > 0
            );


        if (text.length === 0) {

            closeGlobalSearch();

            return;

        }


        const rows =
            Array.from(
                document.querySelectorAll(
                    ".solicitud-row"
                )
            );


        const matches =
            rows.filter(row => {

                return row
                    .textContent
                    .toLowerCase()
                    .includes(text);

            });


        if (matches.length === 0) {

            globalSearchResults.innerHTML = `

                <div class="search-empty">
                    No se encontraron solicitudes.
                </div>

            `;


            globalSearchResults
                .classList
                .add("open");


            return;

        }


        matches
            .slice(0, 6)
            .forEach(row => {

                const id =
                    row.querySelector(".id")
                        .textContent
                        .trim();


                const student =
                    row.querySelector(".student")
                        .textContent
                        .trim();


                const cells =
                    row.querySelectorAll("td");


                const convocatoria =
                    cells[3]
                        .textContent
                        .trim();


                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.className =
                    "search-result-item";


                button.innerHTML = `

                    <strong>
                        ${escapeHTML(id)} ·
                        ${escapeHTML(student)}
                    </strong>

                    <span>
                        ${escapeHTML(convocatoria)}
                    </span>

                `;


                button.addEventListener(
                    "click",
                    function () {

                        closeGlobalSearch();

                        globalSearchInput.value =
                            "";


                        clearGlobalSearch
                            .classList
                            .remove("visible");


                        openDetailModal(row);

                    }
                );


                globalSearchResults
                    .appendChild(button);

            });


        globalSearchResults
            .classList
            .add("open");

    }


    globalSearchInput.addEventListener(
        "input",
        performGlobalSearch
    );


    clearGlobalSearch.addEventListener(
        "click",
        function () {

            globalSearchInput.value =
                "";


            clearGlobalSearch
                .classList
                .remove("visible");


            closeGlobalSearch();


            globalSearchInput.focus();

        }
    );


    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );

    const notificationClose =
        document.getElementById(
            "notificationClose"
        );

    const notificationDot =
        document.getElementById(
            "notificationDot"
        );

    const notificationCounter =
        document.getElementById(
            "notificationCounter"
        );

    const markNotificationsRead =
        document.getElementById(
            "markNotificationsRead"
        );


    notificationButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            notificationPanel
                .classList
                .toggle("open");


            closeGlobalSearch();

        }
    );


    notificationClose.addEventListener(
        "click",
        function () {

            notificationPanel
                .classList
                .remove("open");

        }
    );


    markNotificationsRead.addEventListener(
        "click",
        function () {

            const unreadNotifications =
                document.querySelectorAll(
                    ".notification-item.unread"
                );


            unreadNotifications.forEach(
                item => {

                    item.classList
                        .remove("unread");

                }
            );


            notificationDot
                .classList
                .add("hidden");


            notificationCounter.textContent =
                "Sin notificaciones nuevas";


            showToast(
                "Notificaciones marcadas como leídas.",
                "success"
            );

        }
    );


    // =====================================================
    // CERRAR MENÚS AL HACER CLICK FUERA
    // =====================================================

    document.addEventListener(
        "click",
        function (event) {

            const globalSearch =
                document.querySelector(
                    ".global-search"
                );


            const notificationWrapper =
                document.querySelector(
                    ".notification-wrapper"
                );


            if (
                globalSearch &&
                !globalSearch.contains(
                    event.target
                )
            ) {

                closeGlobalSearch();

            }


            if (
                notificationWrapper &&
                !notificationWrapper.contains(
                    event.target
                )
            ) {

                notificationPanel
                    .classList
                    .remove("open");

            }

        }
    );


    // =====================================================
    // TECLA ESC
    // =====================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }


            closeNewModal();

            closeDetailModal();

            closeGlobalSearch();


            notificationPanel
                .classList
                .remove("open");

        }
    );


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        message,
        type = "success"
    ) {

        const oldToast =
            document.querySelector(
                ".app-toast"
            );


        if (oldToast) {

            oldToast.remove();

        }


        const toast =
            document.createElement("div");


        toast.className =
            `app-toast ${type}`;


        toast.textContent =
            message;


        document.body
            .appendChild(toast);


        requestAnimationFrame(() => {

            toast.classList
                .add("show");

        });


        setTimeout(() => {

            toast.classList
                .remove("show");


            setTimeout(() => {

                toast.remove();

            }, 250);

        }, 2500);

    }


    // =====================================================
    // ESCAPAR HTML
    // =====================================================

    function escapeHTML(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }

}); 