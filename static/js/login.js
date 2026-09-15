const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");

const cardTitle = document.getElementById("cardTitle");
const cardSubtitle = document.getElementById("cardSubtitle");


tabLogin.addEventListener("click", function () {

    loginSection.classList.remove("hidden");
    registerSection.classList.add("hidden");

    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");

    cardTitle.textContent = "Iniciar sesión";

    cardSubtitle.textContent =
        "Ingresá tus credenciales para acceder al sistema.";
});


tabRegister.addEventListener("click", function () {

    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");

    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");

    cardTitle.textContent = "Crear cuenta";

    cardSubtitle.textContent =
        "Registrá una nueva cuenta de acceso a la plataforma.";
});


/* Mostrar / ocultar contraseñas */

const eyeButtons = document.querySelectorAll(".eye-button");

eyeButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const inputId = button.getAttribute("data-password");

        const passwordInput =
            document.getElementById(inputId);

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }

    });

});

/* =========================================
   IR AL PANEL PRINCIPAL
========================================= */

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");


loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    window.location.href = "/panel/";

});


registerForm.addEventListener("submit", function(event) {

    event.preventDefault();

    window.location.href = "/panel/";

});