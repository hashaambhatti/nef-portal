function getHeaderHTML(tableName, columnKey, displayName) {
  const state = tableStates[tableName];
  let icon = "chevrons-up-down";
  if (state.sortBy === columnKey) {
    icon = state.sortOrder === "asc" ? "chevron-up" : "chevron-down";
  }
  return `
    <th class="sortable" onclick="handleTableSort('${escapeHtml(tableName)}', '${escapeHtml(columnKey)}')" title="Sort by ${escapeHtml(displayName)}">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:0.25rem;">
        <span>${escapeHtml(displayName)}</span>
        <i data-lucide="${escapeHtml(icon)}" style="width:14px; height:14px; ${escapeHtml(state.sortBy === columnKey ? 'color: var(--primary);' : '')}"></i>
      </div>
    </th>
  `;
}

function handleTableSort(tableName, columnKey) {
  const state = tableStates[tableName];
  if (!state) return;
  
  if (state.sortBy === columnKey) {
    state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
  } else {
    state.sortBy = columnKey;
    state.sortOrder = "asc";
  }
  state.page = 1;
  
  if (tableName === "students") {
    renderStudentsTable();
  } else if (tableName === "teachers") {
    renderTeachersTable();
  } else if (tableName === "schools") {
    renderSchoolsTable();
  }
}

function initFloatingScrollbars() {
  // Clear previous scrollbars
  document.querySelectorAll(".floating-scrollbar-wrapper").forEach(el => el.remove());
  window.activeFloatingScrollbars = [];
  
  const containers = document.querySelectorAll(".table-responsive");
  containers.forEach(container => {
    const table = container.querySelector("table");
    if (!table) return;
    
    const wrapper = document.createElement("div");
    wrapper.className = "floating-scrollbar-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "0";
    wrapper.style.height = "12px";
    wrapper.style.overflowX = "auto";
    wrapper.style.overflowY = "hidden";
    wrapper.style.zIndex = "99";
    wrapper.style.display = "none";
    wrapper.style.backgroundColor = "transparent";
    
    const content = document.createElement("div");
    content.style.height = "1px";
    wrapper.appendChild(content);
    
    container.parentNode.insertBefore(wrapper, container.nextSibling);
    
    let isSyncingWrapper = false;
    let isSyncingContainer = false;
    
    wrapper.addEventListener("scroll", () => {
      if (!isSyncingWrapper) {
        isSyncingContainer = true;
        container.scrollLeft = wrapper.scrollLeft;
      }
      isSyncingWrapper = false;
    });
    
    container.addEventListener("scroll", () => {
      if (!isSyncingContainer) {
        isSyncingWrapper = true;
        wrapper.scrollLeft = container.scrollLeft;
      }
      isSyncingContainer = false;
    });
    
    function update() {
      const rect = container.getBoundingClientRect();
      const tableWidth = table.scrollWidth;
      const containerWidth = container.clientWidth;
      
      if (tableWidth <= containerWidth) {
        wrapper.style.display = "none";
        return;
      }
      
      content.style.width = tableWidth + "px";
      wrapper.style.width = containerWidth + "px";
      wrapper.style.left = rect.left + "px";
      
      const viewportHeight = window.innerHeight;
      const isBottomBelowFold = rect.bottom > viewportHeight;
      const isTopVisible = rect.top < viewportHeight;
      
      if (isBottomBelowFold && isTopVisible) {
        wrapper.style.display = "block";
      } else {
        wrapper.style.display = "none";
      }
    }
    
    update();
    window.activeFloatingScrollbars.push(update);
    
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        update();
      });
      ro.observe(container);
      ro.observe(table);
    }
  });
}

window.handleTableSort = handleTableSort;
window.initFloatingScrollbars = initFloatingScrollbars;
