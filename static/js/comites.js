document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("committeeSearch");
    const grid = document.getElementById("committeeGrid");
    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");
    const notificationClose = document.getElementById("notificationClose");
    const notificationDot = document.getElementById("notificationDot");
    const notificationCounter = document.getElementById("notificationCounter");
    const markNotificationsRead = document.getElementById("markNotificationsRead");
    const newCommitteeButton = document.getElementById("newCommitteeButton");

    const membersModal = document.getElementById("membersModal");
    const membersModalTitle = document.getElementById("membersModalTitle");
    const membersModalSubtitle = document.getElementById("membersModalSubtitle");
    const membersList = document.getElementById("membersList");
    const closeMembersModal = document.getElementById("closeMembersModal");
    const closeMembersFooter = document.getElementById("closeMembersFooter");

    const committeeModal = document.getElementById("committeeModal");
    const committeeForm = document.getElementById("committeeForm");
    const committeeModalTitle = document.getElementById("committeeModalTitle");
    const committeeModalSubtitle = document.getElementById("committeeModalSubtitle");
    const committeeName = document.getElementById("committeeName");
    const committeeCoordinator = document.getElementById("committeeCoordinator");
    const committeeStatus = document.getElementById("committeeStatus");
    const committeeMembers = document.getElementById("committeeMembers");
    const closeCommitteeModal = document.getElementById("closeCommitteeModal");
    const cancelCommittee = document.getElementById("cancelCommittee");

    let selectedCard = null;
    let editMode = false;

    function cards() {
        return [...document.querySelectorAll(".committee-card")];
    }

    function applySearch() {
        const text = searchInput.value.toLowerCase().trim();
        cards().forEach(card => {
            card.style.display = card.textContent.toLowerCase().includes(text) ? "" : "none";
        });
    }

    searchInput.addEventListener("input", applySearch);

    notificationButton.addEventListener("click", e => {
        e.stopPropagation();
        notificationPanel.hidden = !notificationPanel.hidden;
    });

    notificationClose.addEventListener("click", () => notificationPanel.hidden = true);

    markNotificationsRead.addEventListener("click", () => {
        document.querySelectorAll(".notification-item.unread").forEach(x => x.classList.remove("unread"));
        notificationDot.hidden = true;
        notificationCounter.textContent = "Sin notificaciones nuevas";
        showToast("Notificaciones marcadas como leídas.");
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".notification-wrapper")) notificationPanel.hidden = true;
    });

    function openMembers(card) {
        const name = card.querySelector(".committee-info h3").textContent.trim();
        const coordinator = card.querySelector(".committee-info strong").textContent.trim();
        const members = (card.dataset.members || "").split("|").filter(Boolean);

        membersModalTitle.textContent = name;
        membersModalSubtitle.textContent = `${members.length} miembros`;
        membersList.innerHTML = "";

        members.forEach((member, index) => {
            const initials = member.replace(/^(Dr\.|Dra\.|Lic\.|Ing\.|MSc\.|Téc\.)\s*/i, "")
                .split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();

            const row = document.createElement("div");
            row.className = "member-row";
            row.innerHTML = `<div class="member-avatar">${initials}</div><div><strong>${escapeHtml(member)}</strong><span>${member === coordinator ? "Coordinador" : `Miembro ${index + 1}`}</span></div>`;
            membersList.appendChild(row);
        });

        membersModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeMembers() {
        membersModal.hidden = true;
        document.body.style.overflow = "";
    }

    closeMembersModal.addEventListener("click", closeMembers);
    closeMembersFooter.addEventListener("click", closeMembers);
    membersModal.addEventListener("click", e => { if (e.target === membersModal) closeMembers(); });

    newCommitteeButton.addEventListener("click", () => {
        editMode = false;
        selectedCard = null;
        committeeForm.reset();
        committeeStatus.value = "Activo";
        committeeModalTitle.textContent = "Nuevo comité";
        committeeModalSubtitle.textContent = "Registra la información del comité evaluador.";
        committeeModal.hidden = false;
        document.body.style.overflow = "hidden";
        committeeName.focus();
    });

    function openManage(card) {
        selectedCard = card;
        editMode = true;
        committeeModalTitle.textContent = "Gestionar comité";
        committeeModalSubtitle.textContent = "Actualiza la información y los integrantes.";
        committeeName.value = card.querySelector(".committee-info h3").textContent.trim();
        committeeCoordinator.value = card.querySelector(".committee-info strong").textContent.trim();
        committeeStatus.value = card.querySelector(".status").textContent.trim();
        committeeMembers.value = (card.dataset.members || "").split("|").join("\n");
        committeeModal.hidden = false;
        document.body.style.overflow = "hidden";
    }

    function closeCommittee() {
        committeeModal.hidden = true;
        document.body.style.overflow = "";
        selectedCard = null;
    }

    closeCommitteeModal.addEventListener("click", closeCommittee);
    cancelCommittee.addEventListener("click", closeCommittee);
    committeeModal.addEventListener("click", e => { if (e.target === committeeModal) closeCommittee(); });

    grid.addEventListener("click", e => {
        const card = e.target.closest(".committee-card");
        if (!card) return;
        if (e.target.closest(".view-members-button")) openMembers(card);
        if (e.target.closest(".manage-button")) openManage(card);
    });

    committeeForm.addEventListener("submit", e => {
        e.preventDefault();

        const name = committeeName.value.trim();
        const coordinator = committeeCoordinator.value.trim();
        const status = committeeStatus.value;
        const members = committeeMembers.value.split("\n").map(x => x.trim()).filter(Boolean);

        if (!name || !coordinator || members.length === 0) {
            showToast("Completa los datos del comité.");
            return;
        }

        if (editMode && selectedCard) {
            selectedCard.querySelector(".committee-info h3").textContent = name;
            selectedCard.querySelector(".committee-info strong").textContent = coordinator;
            selectedCard.dataset.members = members.join("|");
            selectedCard.querySelector(".member-count").textContent = members.length;
            setStatus(selectedCard, status);
            showToast("Comité actualizado correctamente.");
        } else {
            grid.insertAdjacentHTML("beforeend", createCard(name, coordinator, status, members));
            showToast("Comité creado correctamente.");
        }

        committeeModal.hidden = true;
        document.body.style.overflow = "";
        selectedCard = null;
        applySearch();
    });

    function setStatus(card, status) {
        const el = card.querySelector(".status");
        el.textContent = status;
        el.className = `status ${status === "Activo" ? "active" : "inactive"}`;
    }

    function createCard(name, coordinator, status, members) {
        return `<article class="committee-card" data-members="${escapeAttr(members.join("|"))}">
            <div class="committee-top"><div class="committee-icon">♙</div><span class="status ${status === "Activo" ? "active" : "inactive"}">${escapeHtml(status)}</span></div>
            <div class="committee-info"><h3>${escapeHtml(name)}</h3><p>Coordinador: <strong>${escapeHtml(coordinator)}</strong></p></div>
            <hr>
            <div class="committee-stats"><div class="stat-block"><strong class="member-count">${members.length}</strong><span>miembros</span></div><div class="divider"></div><div class="stat-block"><strong>0</strong><span>evaluaciones</span></div></div>
            <div class="committee-actions"><button class="secondary-button view-members-button" type="button">Ver miembros</button><button class="primary-button manage-button" type="button">Gestionar</button></div>
        </article>`;
    }

    function showToast(message) {
        document.querySelector(".app-toast")?.remove();
        const toast = document.createElement("div");
        toast.className = "app-toast";
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2400);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    }

    function escapeAttr(value) {
        return escapeHtml(value);
    }

    document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;
        notificationPanel.hidden = true;
        if (!membersModal.hidden) closeMembers();
        if (!committeeModal.hidden) closeCommittee();
    });
});
