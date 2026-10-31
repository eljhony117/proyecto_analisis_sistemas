(function () {
  "use strict";

  // Aplica la URL de login a todos los botones con data-login
  var loginUrl = (window.SITE_CONFIG && window.SITE_CONFIG.LOGIN_URL) || "#";
  document.querySelectorAll("[data-login]").forEach(function (el) {
    el.setAttribute("href", loginUrl);
  });

  // Año actual en el pie de página
  var anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();

  // Cierra el menú móvil al hacer clic en un enlace
  var menu = document.getElementById("menu");
  document.querySelectorAll("#menu .nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      if (menu.classList.contains("show") && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  // Sombra extra de la barra al hacer scroll
  var nav = document.querySelector(".navbar");
  window.addEventListener("scroll", function () {
    nav.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });
})();
