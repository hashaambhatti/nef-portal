function getLimitSelectorHTML(tableName) {
  const state = tableStates[tableName];
  return `
    <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; color: var(--text-secondary);">
      <span>Show</span>
      <select class="filter-select" id="${escapeHtml(tableName)}-limit-select" style="padding: 0.25rem 2rem 0.25rem 0.75rem; width: auto; height: 34px; line-height: 1.2;" onchange="handleTableLimitChange('${escapeHtml(tableName)}', this.value)">
        <option value="25" ${escapeHtml(state.limit == 25 ? "selected" : "")}>25</option>
        <option value="50" ${escapeHtml(state.limit == 50 ? "selected" : "")}>50</option>
        <option value="100" ${escapeHtml(state.limit == 100 ? "selected" : "")}>100</option>
        <option value="all" ${escapeHtml(state.limit === "all" ? "selected" : "")}>All</option>
      </select>
      <span>records</span>
    </div>
  `;
}

function renderPaginationHTML(tableName, startIndex, endIndex, total, totalPages, state) {
  if (state.limit === "all" || total <= (parseInt(state.limit) || 100)) {
    return `
      <div style="display:flex; justify-content:space-between; width:100%; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>Showing <strong>${escapeHtml(total)}</strong> of <strong>${escapeHtml(total)}</strong> records</div>
        <div class="pagination-buttons" style="display: none;"></div>
      </div>
    `;
  }
  
  return `
    <div>Showing <strong>${escapeHtml(total > 0 ? startIndex + 1 : 0)}</strong> to <strong>${escapeHtml(endIndex)}</strong> of <strong>${escapeHtml(total)}</strong> records</div>
    <div class="pagination-buttons">
      <button class="pagination-btn" id="${escapeHtml(tableName)}-prev-btn" ${escapeHtml(state.page === 1 ? "disabled" : "")}>Previous</button>
      <button class="pagination-btn" id="${escapeHtml(tableName)}-next-btn" ${escapeHtml(state.page === totalPages ? "disabled" : "")}>Next</button>
    </div>
  `;
}

function handleTableLimitChange(tableName, limit) {
  const state = tableStates[tableName];
  if (!state) return;
  state.limit = limit;
  state.page = 1;
  
  if (tableName === "students") {
    renderStudentsTable();
  } else if (tableName === "teachers") {
    renderTeachersTable();
  } else if (tableName === "schools") {
    renderSchoolsTable();
  }
}

window.handleTableLimitChange = handleTableLimitChange;
