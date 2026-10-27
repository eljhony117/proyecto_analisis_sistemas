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
   FORMULARIOS
========================================= */

/*
   Los dos formularios (ingreso y registro) se envían a Django por POST.
   Django valida contra la tabla USUARIO de Oracle, así que aquí no se
   intercepta ningún envío.
*/

/* Si el registro falló en el servidor, volver a abrir esa pestaña. */
if (document.body.dataset.tab === "registro") {
    tabRegister.click();
}


/* Aviso inmediato si las contraseñas del registro no coinciden. */
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", function (event) {

    const clave = document.getElementById("registerPassword").value;
    const confirmar = document.getElementById("confirmPassword").value;

    if (clave !== confirmar) {
        event.preventDefault();
        alert("Las contraseñas no coinciden.");
    }

});