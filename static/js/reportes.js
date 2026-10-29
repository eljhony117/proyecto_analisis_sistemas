document.addEventListener("DOMContentLoaded", () => {
 const search = document.getElementById("reportSearch");
 const rows = [...document.querySelectorAll("#reportTableBody tr")];
 search.addEventListener("input", () => {
   const q = search.value.toLocaleLowerCase("es").trim();
   rows.forEach(row => { row.hidden = !row.textContent.toLocaleLowerCase("es").includes(q); });
 });
 const bell = document.getElementById("notificationButton");
 const panel = document.getElementById("notificationPanel");
 bell.addEventListener("click", e => {e.stopPropagation();panel.hidden = !panel.hidden;});
 document.getElementById("closeNotifications").addEventListener("click", () => panel.hidden = true);
 document.getElementById("markNotificationsRead").addEventListener("click", () => {
   panel.querySelectorAll(".unread").forEach(item => item.classList.remove("unread"));
   document.querySelector(".notification-dot").hidden = true;
   panel.hidden = true;
 });
 document.addEventListener("click", e => { if (!e.target.closest(".notification-wrapper")) panel.hidden = true; });
 document.addEventListener("keydown", e => {if(e.key === "Escape") panel.hidden = true;});
 // El botón abre el diálogo de impresión de Chrome; seleccionar "Guardar como PDF".
 document.getElementById("exportPdfButton").addEventListener("click", () => {
   const summary = [...document.querySelectorAll(".summary-card")].map(card => ({
     label: card.querySelector("p").textContent.trim(), value: card.querySelector("strong").textContent.trim()
   }));
   const months = [...document.querySelectorAll(".month-item")].map(item => [item.querySelector("span").textContent.trim(),item.querySelector("strong").textContent.trim()]);
   const levels = [...document.querySelectorAll(".distribution-item")].map(item => [item.querySelector(".distribution-header span").textContent.trim(),item.querySelector(".distribution-header strong").textContent.trim().replace(/\s+/g," ")]);
   const table = document.querySelector(".table-card table").cloneNode(true);
   table.querySelectorAll("tr[hidden]").forEach(tr => tr.remove());
   const escape = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
   const section = (title, data, headers) => `<h2>${title}</h2><table><thead><tr>${headers.map(x=>`<th>${escape(x)}</th>`).join("")}</tr></thead><tbody>${data.map(row=>`<tr>${row.map(x=>`<td>${escape(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
   const printWindow = window.open("", "_blank");
   if (!printWindow) {alert("Permite las ventanas emergentes de este sitio para exportar el PDF.");return;}
   const report = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte de becas 2026</title><style>body{font:13px Arial;color:#123765;margin:35px}h1{font-size:24px}h2{font-size:17px;margin-top:28px}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #d7e1ee;padding:9px;text-align:left}th{background:#eaf0f8}p{color:#647e9f}@page{size:A4;margin:17mm}</style></head><body><h1>Reportes y Estadísticas</h1><p>Gestión de Becas · Ciclo 2026 · Datos de demostración</p>${section("Indicadores generales",summary.map(x=>[x.label,x.value]),["Indicador","Valor"])}${section("Solicitudes por mes",months,["Mes","Solicitudes"])}${section("Distribución por nivel educativo",levels,["Nivel","Cantidad y porcentaje"])}<h2>Resumen por convocatoria</h2>${table.outerHTML}<p>Generado desde la plataforma de gestión de becas.</p></body></html>`;
   printWindow.document.open();printWindow.document.write(report);printWindow.document.close();
   printWindow.addEventListener("load", () => {printWindow.focus();printWindow.print();},{once:true});
 });
});
