document.addEventListener("DOMContentLoaded", () => {

    const filterButtons = [
        ...document.querySelectorAll(".filter-button")
    ];

    const list = document.querySelector(".convocatorias-list");

    const cards = () => [
        ...document.querySelectorAll(".convocatoria-card")
    ];


    /* ==========================================
       FILTROS
    ========================================== */

    function filter(filterName) {

        cards().forEach(card => {

            if (
                filterName === "todas" ||
                card.dataset.status === filterName
            ) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }

        });

    }


    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            filter(button.dataset.filter);

        });

    });


    /* ==========================================
       BUSCADOR
    ========================================== */

    const input =
        document.getElementById("convSearchInput");

    const clear =
        document.getElementById("convSearchClear");

    const results =
        document.getElementById("convSearchResults");

    const resultsBody =
        document.getElementById("convSearchResultsBody");


    function closeSearch() {

        if (results) {
            results.classList.remove("show");
        }

    }


    function search() {

        const query =
            input.value.trim().toLowerCase();


        clear.classList.toggle(
            "show",
            query.length > 0
        );


        if (!query) {

            closeSearch();

            resultsBody.innerHTML = "";

            return;

        }


        const found = cards().filter(card => {

            return card.textContent
                .toLowerCase()
                .includes(query);

        });


        if (found.length === 0) {

            resultsBody.innerHTML = `
                <div class="search-empty">
                    No se encontraron convocatorias.
                </div>
            `;

        } else {

            resultsBody.innerHTML = found.map(
                (card, index) => {

                    const title =
                        card.querySelector("h3")
                            .textContent
                            .trim();

                    const level =
                        card.querySelector(".level")
                            .textContent
                            .trim();


                    return `
                        <button
                            class="search-result-item"
                            type="button"
                            data-index="${index}"
                        >

                            <strong>
                                ${title}
                            </strong>

                            <small>
                                ${level}
                            </small>

                        </button>
                    `;

                }
            ).join("");


            resultsBody
                .querySelectorAll(".search-result-item")
                .forEach((button, index) => {

                    button.addEventListener(
                        "click",
                        () => {

                            const card =
                                found[index];


                            filterButtons.forEach(btn => {
                                btn.classList.remove("active");
                            });


                            const todas =
                                document.querySelector(
                                    '[data-filter="todas"]'
                                );


                            if (todas) {
                                todas.classList.add("active");
                            }


                            filter("todas");

                            closeSearch();

                            input.value = "";

                            clear.classList.remove("show");


                            card.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });

                        }
                    );

                });

        }


        results.classList.add("show");

    }


    if (input) {

        input.addEventListener(
            "input",
            search
        );

    }


    if (clear) {

        clear.addEventListener(
            "click",
            () => {

                input.value = "";

                clear.classList.remove("show");

                closeSearch();

                input.focus();

            }
        );

    }


    /* ==========================================
       NOTIFICACIONES
    ========================================== */

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );

    const closeNotifications =
        document.getElementById(
            "closeNotifications"
        );

    const markAllRead =
        document.getElementById(
            "markAllRead"
        );

    const notificationCount =
        document.getElementById(
            "notificationCount"
        );

    const notificationDot =
        document.querySelector(
            ".notification-dot"
        );


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                notificationPanel
                    .classList
                    .toggle("show");

                closeSearch();

            }
        );

    }


    if (closeNotifications) {

        closeNotifications.addEventListener(
            "click",
            () => {

                notificationPanel
                    .classList
                    .remove("show");

            }
        );

    }


    if (markAllRead) {

        markAllRead.addEventListener(
            "click",
            () => {

                notificationPanel
                    .querySelectorAll(
                        ".notification-item"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "unread"
                        );

                    });


                if (notificationCount) {

                    notificationCount.textContent =
                        "0 nuevas";

                }


                if (notificationDot) {

                    notificationDot.style.display =
                        "none";

                }

            }
        );

    }


    /* ==========================================
       NUEVA CONVOCATORIA
    ========================================== */

    const modal =
        document.getElementById(
            "newConvModal"
        );

    const openModal =
        document.getElementById(
            "openNewConvModal"
        );

    const closeModal =
        document.getElementById(
            "closeNewConvModal"
        );

    const cancelModal =
        document.getElementById(
            "cancelNewConv"
        );

    const form =
        document.getElementById(
            "newConvForm"
        );


    function showModal() {

        modal.classList.add("show");

        document.body.classList.add(
            "modal-open"
        );

    }


    function hideModal() {

        modal.classList.remove("show");

        document.body.classList.remove(
            "modal-open"
        );

        form.reset();

    }


    if (openModal) {

        openModal.addEventListener(
            "click",
            showModal
        );

    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            hideModal
        );

    }


    if (cancelModal) {

        cancelModal.addEventListener(
            "click",
            hideModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {
                    hideModal();
                }

            }
        );

    }


    /* ==========================================
       CREAR CONVOCATORIA
    ========================================== */

    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const name =
                    document
                        .getElementById("convName")
                        .value
                        .trim();


                const level =
                    document
                        .getElementById("convLevel")
                        .value;


                const status =
                    document
                        .getElementById("convStatus")
                        .value;


                const date =
                    document
                        .getElementById("convCloseDate")
                        .value;


                const slots =
                    document
                        .getElementById("convSlots")
                        .value;


                const description =
                    document
                        .getElementById("convDescription")
                        .value
                        .trim();


                if (
                    !name ||
                    !level ||
                    !status ||
                    !date ||
                    !slots ||
                    !description
                ) {

                    return;

                }


                const dateObject =
                    new Date(
                        date + "T00:00:00"
                    );


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


                const dateText =

                    String(
                        dateObject.getDate()
                    ).padStart(2, "0")

                    + " "

                    + months[
                        dateObject.getMonth()
                    ]

                    + " "

                    + dateObject.getFullYear();


                const statusLabel =
                    status === "proxima"
                        ? "Próxima"
                        : "Abierta";


                const article =
                    document.createElement(
                        "article"
                    );


                article.className =
                    "convocatoria-card";


                article.dataset.status =
                    status;


                article.innerHTML = `

                    <div class="card-top">

                        <div class="card-information">

                            <div class="meta">

                                <span
                                    class="status ${status}"
                                >
                                    ${statusLabel}
                                </span>

                                <span class="level">
                                    ${level}
                                </span>

                            </div>

                            <h3>
                                ${name}
                            </h3>

                            <p>
                                ${description}
                            </p>

                        </div>


                        <div class="card-actions">

                            <p class="closing-date">

                                Cierre:

                                <strong>
                                    ${dateText}
                                </strong>

                            </p>


                            <div class="buttons">

                                <button
                                    class="detail-button"
                                    type="button"
                                >
                                    Ver detalle
                                </button>

                                <button
                                    class="manage-button"
                                    type="button"
                                >
                                    Gestionar
                                </button>

                            </div>

                        </div>

                    </div>


                    <div class="progress-section">

                        <div class="progress-info">

                            <span>
                                0 solicitudes de
                                ${slots} cupos
                            </span>

                            <strong
                                class="normal-percentage"
                            >
                                0%
                            </strong>

                        </div>


                        <div class="progress-track">

                            <div
                                class="progress-fill normal"
                                style="width:0%"
                            ></div>

                        </div>

                    </div>

                `;


                list.prepend(article);


                filterButtons.forEach(btn => {
                    btn.classList.remove(
                        "active"
                    );
                });


                const todas =
                    document.querySelector(
                        '[data-filter="todas"]'
                    );


                if (todas) {

                    todas.classList.add(
                        "active"
                    );

                }


                filter("todas");


                hideModal();


                article.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }
        );

    }


    /* ==========================================
       CERRAR DESPLEGABLES
    ========================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !event.target.closest(
                    ".global-search"
                )
            ) {

                closeSearch();

            }


            if (
                !event.target.closest(
                    ".notification-wrapper"
                )
            ) {

                if (notificationPanel) {

                    notificationPanel
                        .classList
                        .remove("show");

                }

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeSearch();


                if (notificationPanel) {

                    notificationPanel
                        .classList
                        .remove("show");

                }


                if (
                    modal &&
                    modal.classList.contains(
                        "show"
                    )
                ) {

                    hideModal();

                }

            }

        }
    );

        /* ==========================================
       VER DETALLE Y GESTIONAR
    ========================================== */

    let tarjetaSeleccionada = null;


    // Crear modal de detalle
    const modalDetalle = document.createElement("div");

    modalDetalle.className = "modal-overlay";
    modalDetalle.id = "modalDetalleConvocatoria";

    modalDetalle.innerHTML = `
        <div class="modal-card">

            <div class="modal-header">

                <div>
                    <h2 id="detalleTitulo">
                        Detalle de convocatoria
                    </h2>

                    <p>
                        Información general del llamado a beca.
                    </p>
                </div>

                <button
                    id="cerrarDetalle"
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <div class="modal-body">

                <div class="form-grid">

                    <div class="form-field">
                        <label>Estado</label>
                        <input
                            id="detalleEstado"
                            type="text"
                            readonly
                        >
                    </div>

                    <div class="form-field">
                        <label>Nivel</label>
                        <input
                            id="detalleNivel"
                            type="text"
                            readonly
                        >
                    </div>

                    <div class="form-field">
                        <label>Fecha de cierre</label>
                        <input
                            id="detalleFecha"
                            type="text"
                            readonly
                        >
                    </div>

                    <div class="form-field">
                        <label>Solicitudes / cupos</label>
                        <input
                            id="detalleSolicitudes"
                            type="text"
                            readonly
                        >
                    </div>

                </div>


                <div class="form-field">

                    <label>Descripción</label>

                    <textarea
                        id="detalleDescripcion"
                        rows="4"
                        readonly
                    ></textarea>

                </div>

            </div>


            <div class="modal-footer">

                <button
                    id="cerrarDetalleInferior"
                    class="primary-button"
                    type="button"
                >
                    Cerrar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modalDetalle);



    // Crear modal de gestionar
    const modalGestionar = document.createElement("div");

    modalGestionar.className = "modal-overlay";
    modalGestionar.id = "modalGestionarConvocatoria";

    modalGestionar.innerHTML = `
        <div class="modal-card">

            <div class="modal-header">

                <div>
                    <h2>
                        Gestionar convocatoria
                    </h2>

                    <p>
                        Modificá la información de la convocatoria.
                    </p>
                </div>

                <button
                    id="cerrarGestionar"
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>

            </div>


            <form id="formGestionarConvocatoria">

                <div class="modal-body">

                    <div class="form-field">

                        <label>Nombre</label>

                        <input
                            id="gestionarNombre"
                            type="text"
                            required
                        >

                    </div>


                    <div class="form-grid">

                        <div class="form-field">

                            <label>Nivel</label>

                            <select
                                id="gestionarNivel"
                                required
                            >

                                <option value="NIVEL MEDIO">
                                    NIVEL MEDIO
                                </option>

                                <option value="UNIVERSITARIO">
                                    UNIVERSITARIO
                                </option>

                                <option value="POSGRADO">
                                    POSGRADO
                                </option>

                            </select>

                        </div>


                        <div class="form-field">

                            <label>Estado</label>

                            <select
                                id="gestionarEstado"
                                required
                            >

                                <option value="abierta">
                                    Abierta
                                </option>

                                <option value="proxima">
                                    Próxima
                                </option>

                            </select>

                        </div>


                        <div class="form-field">

                            <label>Fecha de cierre</label>

                            <input
                                id="gestionarFecha"
                                type="date"
                                required
                            >

                        </div>


                        <div class="form-field">

                            <label>Cupos</label>

                            <input
                                id="gestionarCupos"
                                type="number"
                                min="1"
                                required
                            >

                        </div>

                    </div>


                    <div class="form-field">

                        <label>Descripción</label>

                        <textarea
                            id="gestionarDescripcion"
                            rows="4"
                            required
                        ></textarea>

                    </div>

                </div>


                <div class="modal-footer">

                    <button
                        id="cancelarGestionar"
                        class="secondary-button"
                        type="button"
                    >
                        Cancelar
                    </button>

                    <button
                        class="primary-button"
                        type="submit"
                    >
                        Guardar cambios
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modalGestionar);



    /* ==========================================
       FUNCIONES AUXILIARES
    ========================================== */

    function obtenerDatosTarjeta(card) {

        const progreso =
            card.querySelector(".progress-info span")
                .textContent
                .replace(/\s+/g, " ")
                .trim();


        const numeros =
            progreso.match(
                /(\d+)\s+solicitudes\s+de\s+(\d+)\s+cupos/i
            );


        return {

            nombre:
                card.querySelector("h3")
                    .textContent
                    .trim(),

            descripcion:
                card.querySelector(
                    ".card-information > p"
                )
                    .textContent
                    .replace(/\s+/g, " ")
                    .trim(),

            nivel:
                card.querySelector(".level")
                    .textContent
                    .trim(),

            estado:
                card.dataset.status,

            estadoTexto:
                card.querySelector(".status")
                    .textContent
                    .trim(),

            fecha:
                card.querySelector(
                    ".closing-date strong"
                )
                    .textContent
                    .trim(),

            solicitudes:
                numeros
                    ? numeros[1]
                    : "0",

            cupos:
                numeros
                    ? numeros[2]
                    : "0",

            porcentaje:
                card.querySelector(
                    ".progress-info strong"
                )
                    .textContent
                    .trim()

        };

    }


    function convertirFechaAInput(fechaTexto) {

        const meses = {
            ene: "01",
            feb: "02",
            mar: "03",
            abr: "04",
            may: "05",
            jun: "06",
            jul: "07",
            ago: "08",
            sep: "09",
            oct: "10",
            nov: "11",
            dic: "12"
        };


        const partes =
            fechaTexto
                .toLowerCase()
                .split(" ");


        if (partes.length !== 3) {
            return "";
        }


        const dia =
            partes[0].padStart(2, "0");

        const mes =
            meses[partes[1]];

        const anio =
            partes[2];


        if (!mes) {
            return "";
        }


        return `${anio}-${mes}-${dia}`;

    }


    function convertirFechaATexto(fecha) {

        const fechaObjeto =
            new Date(
                fecha + "T00:00:00"
            );


        const meses = [
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


        const dia =
            String(
                fechaObjeto.getDate()
            ).padStart(2, "0");


        const mes =
            meses[
                fechaObjeto.getMonth()
            ];


        const anio =
            fechaObjeto.getFullYear();


        return `${dia} ${mes} ${anio}`;

    }



    /* ==========================================
       VER DETALLE
    ========================================== */

    function abrirDetalle(card) {

        const datos =
            obtenerDatosTarjeta(card);


        document.getElementById(
            "detalleTitulo"
        ).textContent =
            datos.nombre;


        document.getElementById(
            "detalleEstado"
        ).value =
            datos.estadoTexto;


        document.getElementById(
            "detalleNivel"
        ).value =
            datos.nivel;


        document.getElementById(
            "detalleFecha"
        ).value =
            datos.fecha;


        document.getElementById(
            "detalleSolicitudes"
        ).value =
            `${datos.solicitudes} solicitudes de ${datos.cupos} cupos - ${datos.porcentaje}`;


        document.getElementById(
            "detalleDescripcion"
        ).value =
            datos.descripcion;


        modalDetalle.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function cerrarDetalle() {

        modalDetalle.classList.remove(
            "show"
        );


        document.body.classList.remove(
            "modal-open"
        );

    }


    document.getElementById(
        "cerrarDetalle"
    ).addEventListener(
        "click",
        cerrarDetalle
    );


    document.getElementById(
        "cerrarDetalleInferior"
    ).addEventListener(
        "click",
        cerrarDetalle
    );


    modalDetalle.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalDetalle
            ) {

                cerrarDetalle();

            }

        }
    );



    /* ==========================================
       GESTIONAR
    ========================================== */

    function abrirGestionar(card) {

        tarjetaSeleccionada =
            card;


        const datos =
            obtenerDatosTarjeta(card);


        document.getElementById(
            "gestionarNombre"
        ).value =
            datos.nombre;


        document.getElementById(
            "gestionarNivel"
        ).value =
            datos.nivel;


        document.getElementById(
            "gestionarEstado"
        ).value =
            datos.estado;


        document.getElementById(
            "gestionarFecha"
        ).value =
            convertirFechaAInput(
                datos.fecha
            );


        document.getElementById(
            "gestionarCupos"
        ).value =
            datos.cupos;


        document.getElementById(
            "gestionarDescripcion"
        ).value =
            datos.descripcion;


        modalGestionar.classList.add(
            "show"
        );


        document.body.classList.add(
            "modal-open"
        );

    }


    function cerrarGestionar() {

        modalGestionar.classList.remove(
            "show"
        );


        document.body.classList.remove(
            "modal-open"
        );


        tarjetaSeleccionada =
            null;

    }


    document.getElementById(
        "cerrarGestionar"
    ).addEventListener(
        "click",
        cerrarGestionar
    );


    document.getElementById(
        "cancelarGestionar"
    ).addEventListener(
        "click",
        cerrarGestionar
    );


    modalGestionar.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modalGestionar
            ) {

                cerrarGestionar();

            }

        }
    );



    /* ==========================================
       GUARDAR CAMBIOS
    ========================================== */

    document.getElementById(
        "formGestionarConvocatoria"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            if (!tarjetaSeleccionada) {
                return;
            }


            const datosAnteriores =
                obtenerDatosTarjeta(
                    tarjetaSeleccionada
                );


            const nombre =
                document.getElementById(
                    "gestionarNombre"
                ).value.trim();


            const nivel =
                document.getElementById(
                    "gestionarNivel"
                ).value;


            const estado =
                document.getElementById(
                    "gestionarEstado"
                ).value;


            const fecha =
                document.getElementById(
                    "gestionarFecha"
                ).value;


            const cupos =
                document.getElementById(
                    "gestionarCupos"
                ).value;


            const descripcion =
                document.getElementById(
                    "gestionarDescripcion"
                ).value.trim();


            tarjetaSeleccionada.dataset.status =
                estado;


            const etiquetaEstado =
                tarjetaSeleccionada.querySelector(
                    ".status"
                );


            etiquetaEstado.className =
                `status ${estado}`;


            etiquetaEstado.textContent =
                estado === "proxima"
                    ? "Próxima"
                    : "Abierta";


            tarjetaSeleccionada.querySelector(
                ".level"
            ).textContent =
                nivel;


            tarjetaSeleccionada.querySelector(
                "h3"
            ).textContent =
                nombre;


            tarjetaSeleccionada.querySelector(
                ".card-information > p"
            ).textContent =
                descripcion;


            tarjetaSeleccionada.querySelector(
                ".closing-date strong"
            ).textContent =
                convertirFechaATexto(
                    fecha
                );


            tarjetaSeleccionada.querySelector(
                ".progress-info span"
            ).textContent =
                `${datosAnteriores.solicitudes} solicitudes de ${cupos} cupos`;


            const porcentaje =
                Math.min(
                    100,
                    Math.round(
                        (
                            Number(
                                datosAnteriores.solicitudes
                            )
                            /
                            Number(cupos)
                        )
                        * 100
                    )
                ) || 0;


            const textoPorcentaje =
                tarjetaSeleccionada.querySelector(
                    ".progress-info strong"
                );


            const barra =
                tarjetaSeleccionada.querySelector(
                    ".progress-fill"
                );


            textoPorcentaje.textContent =
                `${porcentaje}%`;


            barra.style.width =
                `${porcentaje}%`;


            if (porcentaje >= 100) {

                textoPorcentaje.classList.remove(
                    "normal-percentage"
                );


                barra.classList.remove(
                    "normal"
                );


                barra.classList.add(
                    "full"
                );

            } else {

                textoPorcentaje.classList.add(
                    "normal-percentage"
                );


                barra.classList.remove(
                    "full"
                );


                barra.classList.add(
                    "normal"
                );

            }


            cerrarGestionar();

        }
    );



    /* ==========================================
       DETECTAR BOTONES DE CUALQUIER TARJETA
    ========================================== */

    list.addEventListener(
        "click",
        event => {

            const botonDetalle =
                event.target.closest(
                    ".detail-button"
                );


            const botonGestionar =
                event.target.closest(
                    ".manage-button"
                );


            if (
                !botonDetalle &&
                !botonGestionar
            ) {

                return;

            }


            const card =
                event.target.closest(
                    ".convocatoria-card"
                );


            if (!card) {
                return;
            }


            if (botonDetalle) {

                abrirDetalle(card);

            }


            if (botonGestionar) {

                abrirGestionar(card);

            }

        }
    );

});