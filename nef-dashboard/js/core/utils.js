// Escapes a value for safe use inside HTML text or a quoted attribute (S4).
// Every piece of stored data (names, addresses, ...) that goes into an
// innerHTML template must pass through this, so a value such as
// <img src=x onerror=...> is shown as text instead of being executed.
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;");
}
window.escapeHtml = escapeHtml;

function sortDataset(data, sortBy, sortOrder) {
  if (!sortBy) return data;
  return [...data].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    
    if (valA === undefined || valA === null) valA = "";
    if (valB === undefined || valB === null) valB = "";
    
    // Check if numeric or string
    const isNumA = !isNaN(valA) && !isNaN(parseFloat(valA)) && String(valA).trim() !== "";
    const isNumB = !isNaN(valB) && !isNaN(parseFloat(valB)) && String(valB).trim() !== "";
    
    if (isNumA && isNumB) {
      return sortOrder === "asc" ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA);
    }
    
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    
    return sortOrder === "asc" 
      ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
      : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
  });
}

function getPageData(dataset, state) {
  const total = dataset.length;
  const limit = state.limit === "all" ? total : (parseInt(state.limit) || 100);
  const totalPages = Math.ceil(total / limit) || 1;
  if (state.page > totalPages) state.page = totalPages;
  const startIndex = (state.page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);
  const pageData = dataset.slice(startIndex, endIndex);
  return { pageData, startIndex, endIndex, total, totalPages };
}

function showAlert(message, type = "success") {
  const alertContainer = document.getElementById("alert-container");
  if (!alertContainer) return;
  
  const alertEl = document.createElement("div");
  alertEl.className = `badge badge-${type}`;
  alertEl.style.padding = "0.75rem 1.25rem";
  alertEl.style.fontSize = "0.9rem";
  alertEl.style.borderRadius = "var(--radius-sm)";
  alertEl.style.display = "flex";
  alertEl.style.alignItems = "center";
  alertEl.style.gap = "0.5rem";
  alertEl.style.boxShadow = "var(--shadow-md)";
  alertEl.style.border = "1px solid var(--border)";
  
  let icon = "check-circle";
  if (type === "danger") icon = "alert-triangle";
  if (type === "warning") icon = "info";
  
  // The message is set as text, never parsed as HTML (S4).
  alertEl.innerHTML = `<i data-lucide="${icon}"></i>`;
  const msgEl = document.createElement("span");
  msgEl.textContent = message;
  alertEl.appendChild(msgEl);
  
  alertContainer.appendChild(alertEl);
  if (window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    alertEl.style.opacity = "0";
    alertEl.style.transition = "opacity 0.5s ease";
    setTimeout(() => alertEl.remove(), 500);
  }, 3000);
}