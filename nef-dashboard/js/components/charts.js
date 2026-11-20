function renderBarListChart(elementId, items) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  // items: array of { name: 'Male', count: 12, fillClass: 'fill-blue' }
  const total = items.reduce((acc, item) => acc + item.count, 0);
  
  let html = `<div class="bar-list">`;
  items.forEach(item => {
    const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;
    html += `
      <div class="bar-item">
        <div class="bar-labels">
          <span class="bar-name">${escapeHtml(item.name)}</span>
          <span class="bar-value-text">${escapeHtml(item.count)} (${escapeHtml(percentage)}%)</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill ${escapeHtml(item.fillClass)}" style="width: ${escapeHtml(percentage)}%"></div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

