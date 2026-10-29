document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // ELEMENTOS PRINCIPALES
    // =====================================================

    const cards = () =>
        Array.from(document.querySelectorAll(".evaluacion-card"));

    const filterButtons =
        document.querySelectorAll(".filter-button");

    const headerSearch =
        document.getElementById("headerSearch");

    const clearHeaderSearch =
        document.getElementById("clearHeaderSearch");

    let currentFilter = "todos";
    let currentPriority = "todas";
    let currentEvaluatorFilter = "todos";
    let selectedCard = null;


    // =====================================================
    // FILTRADO GENERAL
    // =====================================================

    function applyFilters() {

        const searchText =
            headerSearch.value.toLowerCase().trim();

        cards().forEach(card => {

            const status = card.dataset.status;
            const priority = card.dataset.priority;

            const evaluatorElement =
                card.querySelector(".evaluator strong");

            const evaluator =
                evaluatorElement
                    ? evaluatorElement.textContent.trim()
                    : "";

            const isAssigned =
                evaluator.toLowerCase() !== "sin asignar";

            const matchesStatus =
                currentFilter === "todos" ||
                status === currentFilter;

            const matchesPriority =
                currentPriority === "todas" ||
                priority === currentPriority;

            const matchesEvaluator =
                currentEvaluatorFilter === "todos" ||
                (
                    currentEvaluatorFilter === "asignado" &&
                    isAssigned
                ) ||
                (
                    currentEvaluatorFilter === "sin-asignar" &&
                    !isAssigned
                );

            const matchesSearch =
                card.textContent
                    .toLowerCase()
                    .includes(searchText);

            card.style.display =
                matchesStatus &&
                matchesPriority &&
                matchesEvaluator &&
                matchesSearch
                    ? ""
                    : "none";
        });
    }


    // =====================================================
    // FILTROS POR ESTADO
    // =====================================================

    filterButtons.forEach(button => {

        button.addEventListener("click", function () {

            filterButtons.forEach(btn =>
                btn.classList.remove("active")
            );

            this.classList.add("active");

            currentFilter =
                this.dataset.filter;

            applyFilters();
        });
    });


    // =====================================================
    // BUSCADOR SUPERIOR
    // =====================================================

    headerSearch.addEventListener("input", function () {

        clearHeaderSearch.classList.toggle(
            "visible",
            this.value.trim().length > 0
        );

        applyFilters();
    });


    clearHeaderSearch.addEventListener("click", function () {

        headerSearch.value = "";

        clearHeaderSearch.classList.remove("visible");

        applyFilters();

        headerSearch.focus();
    });


    // =====================================================
    // FILTROS AVANZADOS
    // =====================================================

    const filterMainButton =
        document.getElementById("filterMainButton");

    const advancedFilterPanel =
        document.getElementById("advancedFilterPanel");

    const closeAdvancedFilter =
        document.getElementById("closeAdvancedFilter");

    const priorityFilter =
        document.getElementById("priorityFilter");

    const evaluatorFilter =
        document.getElementById("evaluatorFilter");

    const applyAdvancedFilters =
        document.getElementById("applyAdvancedFilters");

    const clearAdvancedFilters =
        document.getElementById("clearAdvancedFilters");


    filterMainButton.addEventListener("click", function (event) {

        event.stopPropagation();

        advancedFilterPanel.classList.toggle("open");

        notificationPanel.classList.remove("open");
    });


    closeAdvancedFilter.addEventListener("click", function () {

        advancedFilterPanel.classList.remove("open");
    });


    applyAdvancedFilters.addEventListener("click", function () {

        currentPriority =
            priorityFilter.value;

        currentEvaluatorFilter =
            evaluatorFilter.value;

        advancedFilterPanel.classList.remove("open");

        applyFilters();

        showToast(
            "Filtros aplicados correctamente.",
            "success"
        );
    });


    clearAdvancedFilters.addEventListener("click", function () {

        priorityFilter.value = "todas";
        evaluatorFilter.value = "todos";

        currentPriority = "todas";
        currentEvaluatorFilter = "todos";

        applyFilters();

        showToast(
            "Filtros restablecidos.",
            "success"
        );
    });


    // =====================================================
    // NOTIFICACIONES
    // =====================================================

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationClose =
        document.getElementById("notificationClose");

    const notificationDot =
        document.getElementById("notificationDot");

    const notificationCounter =
        document.getElementById("notificationCounter");

    const markNotificationsRead =
        document.getElementById("markNotificationsRead");


    notificationButton.addEventListener("click", function (event) {

        event.stopPropagation();

        notificationPanel.classList.toggle("open");

        advancedFilterPanel.classList.remove("open");
    });


    notificationClose.addEventListener("click", function () {

        notificationPanel.classList.remove("open");
    });


    markNotificationsRead.addEventListener("click", function () {

        document
            .querySelectorAll(".notification-item.unread")
            .forEach(item =>
                item.classList.remove("unread")
            );

        notificationDot.classList.add("hidden");

        notificationCounter.textContent =
            "Sin notificaciones nuevas";

        showToast(
            "Notificaciones marcadas como leídas.",
            "success"
        );
    });


    // =====================================================
    // MODAL EVALUAR
    // =====================================================

    const evaluationModal =
        document.getElementById("evaluationModal");

    const evaluationForm =
        document.getElementById("evaluationForm");

    const evaluationModalTitle =
        document.getElementById("evaluationModalTitle");

    const evaluationModalSubtitle =
        document.getElementById("evaluationModalSubtitle");

    const evaluationId =
        document.getElementById("evaluationId");

    const evaluationStudent =
        document.getElementById("evaluationStudent");

    const evaluationScholarship =
        document.getElementById("evaluationScholarship");

    const evaluationEvaluator =
        document.getElementById("evaluationEvaluator");

    const evaluationScore =
        document.getElementById("evaluationScore");

    const evaluationObservations =
        document.getElementById("evaluationObservations");

    const evaluationStatus =
        document.getElementById("evaluationStatus");

    const closeEvaluationModal =
        document.getElementById("closeEvaluationModal");

    const cancelEvaluation =
        document.getElementById("cancelEvaluation");

    const saveEvaluationButton =
        document.getElementById("saveEvaluationButton");


    function openEvaluationModal(card, readOnly = false) {

        selectedCard = card;

        const id =
            card.querySelector(".evaluation-id")
                .textContent.trim();

        const student =
            card.querySelector("h3")
                .textContent.trim();

        const scholarship =
            card.querySelector(".scholarship")
                .textContent.trim();

        const evaluator =
            card.querySelector(".evaluator strong")
                .textContent.trim();

        const scoreElement =
            card.querySelector(".score strong");

        const scoreText =
            scoreElement
                ? scoreElement.textContent.trim()
                : "";

        evaluationId.value = id;
        evaluationStudent.value = student;
        evaluationScholarship.value = scholarship;
        evaluationEvaluator.value = evaluator;

        evaluationScore.value =
            scoreText !== "—"
                ? scoreText
                : "";

        evaluationStatus.value =
            card.dataset.status === "completada"
                ? "completada"
                : "progreso";

        evaluationObservations.value =
            card.dataset.observations || "";

        evaluationScore.readOnly = readOnly;
        evaluationObservations.readOnly = readOnly;
        evaluationStatus.disabled = readOnly;

        if (readOnly) {

            evaluationModalTitle.textContent =
                `Evaluación ${id}`;

            evaluationModalSubtitle.textContent =
                "Consulta de la evaluación completada.";

            saveEvaluationButton.style.display = "none";

            cancelEvaluation.textContent = "Cerrar";

        } else {

            evaluationModalTitle.textContent =
                `Evaluar solicitud ${id}`;

            evaluationModalSubtitle.textContent =
                "Registra el puntaje y las observaciones.";

            saveEvaluationButton.style.display = "";

            cancelEvaluation.textContent = "Cancelar";
        }

        evaluationModal.classList.add("open");

        document.body.style.overflow = "hidden";
    }


    function closeEvaluation() {

        evaluationModal.classList.remove("open");

        document.body.style.overflow = "";

        selectedCard = null;
    }


    closeEvaluationModal.addEventListener(
        "click",
        closeEvaluation
    );

    cancelEvaluation.addEventListener(
        "click",
        closeEvaluation
    );


    evaluationModal.addEventListener("click", function (event) {

        if (event.target === evaluationModal) {
            closeEvaluation();
        }
    });


    // =====================================================
    // GUARDAR EVALUACIÓN
    // =====================================================

    evaluationForm.addEventListener("submit", function (event) {

        event.preventDefault();

        if (!selectedCard) {
            return;
        }

        const evaluator =
            selectedCard
                .querySelector(".evaluator strong")
                .textContent
                .trim();

        if (evaluator.toLowerCase() === "sin asignar") {

            showToast(
                "Primero debes asignar un evaluador.",
                "warning"
            );

            return;
        }

        const score =
            Number(evaluationScore.value);

        if (
            evaluationScore.value === "" ||
            Number.isNaN(score) ||
            score < 0 ||
            score > 100
        ) {

            showToast(
                "El puntaje debe estar entre 0 y 100.",
                "warning"
            );

            return;
        }

        const newStatus =
            evaluationStatus.value;

        selectedCard.dataset.observations =
            evaluationObservations.value.trim();

        updateScore(selectedCard, score);

        updateStatus(
            selectedCard,
            newStatus
        );

        const id =
            selectedCard
                .querySelector(".evaluation-id")
                .textContent
                .trim();

        closeEvaluation();

        applyFilters();

        showToast(
            `${id} guardada correctamente.`,
            "success"
        );
    });


    // =====================================================
    // ACTUALIZAR PUNTAJE
    // =====================================================

    function updateScore(card, score) {

        const scoreBox =
            card.querySelector(".score");

        if (!scoreBox) {
            return;
        }

        scoreBox.classList.remove("empty-score");

        scoreBox.querySelector("strong").textContent =
            score;

        scoreBox.querySelector("span").textContent =
            "puntos";
    }


    // =====================================================
    // ACTUALIZAR ESTADO
    // =====================================================

    function updateStatus(card, status) {

        card.dataset.status = status;

        const statusElement =
            card.querySelector(".status");

        statusElement.className =
            `status ${status}`;

        if (status === "pendiente") {
            statusElement.textContent = "Pendiente";
        }

        if (status === "progreso") {
            statusElement.textContent = "En progreso";
        }

        if (status === "completada") {

            statusElement.textContent = "Completada";

            const score =
                card.querySelector(".score");

            if (score) {
                score.classList.add("completed-score");
            }
        }

        refreshActionButtons(card);
    }


    // =====================================================
    // BOTONES SEGÚN ESTADO
    // =====================================================

    function refreshActionButtons(card) {

        const result =
            card.querySelector(".evaluation-result");

        const score =
            result.querySelector(".score");

        let oldActions =
            result.querySelector(".evaluation-buttons");

        let singleButton =
            result.querySelector(
                ":scope > .evaluate-button"
            );

        if (oldActions) {
            oldActions.remove();
        }

        if (singleButton) {
            singleButton.remove();
        }

        const evaluator =
            card.querySelector(".evaluator strong")
                .textContent.trim();

        if (card.dataset.status === "completada") {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "evaluate-button view-evaluation";
            button.textContent = "Ver";

            result.appendChild(button);

            return;
        }

        if (evaluator.toLowerCase() === "sin asignar") {

            const buttons =
                document.createElement("div");

            buttons.className =
                "evaluation-buttons";

            buttons.innerHTML = `
                <button
                    class="evaluate-button"
                    type="button"
                >
                    Evaluar
                </button>

                <button
                    class="assign-button"
                    type="button"
                >
                    Asignar
                </button>
            `;

            result.appendChild(buttons);

            return;
        }

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "evaluate-button";
        button.textContent = "Evaluar";

        result.appendChild(button);
    }


    // =====================================================
    // MODAL ASIGNAR
    // =====================================================

    const assignModal =
        document.getElementById("assignModal");

    const assignForm =
        document.getElementById("assignForm");

    const assignSolicitud =
        document.getElementById("assignSolicitud");

    const assignStudent =
        document.getElementById("assignStudent");

    const assignEvaluator =
        document.getElementById("assignEvaluator");

    const closeAssignModal =
        document.getElementById("closeAssignModal");

    const cancelAssign =
        document.getElementById("cancelAssign");


    function openAssignModal(card) {

        selectedCard = card;

        assignSolicitud.value =
            card.querySelector(".evaluation-id")
                .textContent.trim();

        assignStudent.value =
            card.querySelector("h3")
                .textContent.trim();

        assignEvaluator.value = "";

        assignModal.classList.add("open");

        document.body.style.overflow = "hidden";
    }


    function closeAssign() {

        assignModal.classList.remove("open");

        document.body.style.overflow = "";

        selectedCard = null;
    }


    closeAssignModal.addEventListener(
        "click",
        closeAssign
    );

    cancelAssign.addEventListener(
        "click",
        closeAssign
    );


    assignModal.addEventListener("click", function (event) {

        if (event.target === assignModal) {
            closeAssign();
        }
    });


    // =====================================================
    // GUARDAR ASIGNACIÓN
    // =====================================================

    assignForm.addEventListener("submit", function (event) {

        event.preventDefault();

        if (!selectedCard) {
            return;
        }

        const evaluator =
            assignEvaluator.value;

        if (!evaluator) {

            showToast(
                "Selecciona un evaluador.",
                "warning"
            );

            return;
        }

        const evaluatorElement =
            selectedCard.querySelector(
                ".evaluator strong"
            );

        evaluatorElement.textContent =
            evaluator;

        evaluatorElement.classList.remove(
            "not-assigned"
        );

        updateStatus(
            selectedCard,
            "progreso"
        );

        const id =
            selectedCard
                .querySelector(".evaluation-id")
                .textContent.trim();

        closeAssign();

        applyFilters();

        showToast(
            `Evaluador asignado a ${id}.`,
            "success"
        );
    });


    // =====================================================
    // EVENT DELEGATION PARA TARJETAS
    // =====================================================

    document
        .querySelector(".evaluaciones-list")
        .addEventListener("click", function (event) {

            const button =
                event.target.closest("button");

            if (!button) {
                return;
            }

            const card =
                button.closest(".evaluacion-card");

            if (!card) {
                return;
            }

            if (
                button.classList.contains(
                    "assign-button"
                )
            ) {

                openAssignModal(card);

                return;
            }

            if (
                button.classList.contains(
                    "view-evaluation"
                )
            ) {

                openEvaluationModal(
                    card,
                    true
                );

                return;
            }

            if (
                button.classList.contains(
                    "evaluate-button"
                )
            ) {

                const evaluator =
                    card
                        .querySelector(".evaluator strong")
                        .textContent
                        .trim();

                if (
                    evaluator.toLowerCase() ===
                    "sin asignar"
                ) {

                    showToast(
                        "Primero debes asignar un evaluador.",
                        "warning"
                    );

                    openAssignModal(card);

                    return;
                }

                openEvaluationModal(
                    card,
                    false
                );
            }
        });


    // =====================================================
    // CERRAR PANELES AL HACER CLICK FUERA
    // =====================================================

    document.addEventListener("click", function (event) {

        const notificationWrapper =
            document.querySelector(
                ".notification-wrapper"
            );

        const filterWrapper =
            document.querySelector(
                ".filter-main-wrapper"
            );

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

        if (
            filterWrapper &&
            !filterWrapper.contains(
                event.target
            )
        ) {

            advancedFilterPanel
                .classList
                .remove("open");
        }
    });


    // =====================================================
    // ESC
    // =====================================================

    document.addEventListener("keydown", function (event) {

        if (event.key !== "Escape") {
            return;
        }

        evaluationModal.classList.remove("open");
        assignModal.classList.remove("open");
        notificationPanel.classList.remove("open");
        advancedFilterPanel.classList.remove("open");

        document.body.style.overflow = "";
    });


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(message, type = "success") {

        const oldToast =
            document.querySelector(".app-toast");

        if (oldToast) {
            oldToast.remove();
        }

        const toast =
            document.createElement("div");

        toast.className =
            `app-toast ${type}`;

        toast.textContent =
            message;

        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add("show");
        });

        setTimeout(function () {

            toast.classList.remove("show");

            setTimeout(function () {
                toast.remove();
            }, 250);

        }, 2500);
    }


    // =====================================================
    // INICIALIZACIÓN
    // =====================================================

    applyFilters();

});
