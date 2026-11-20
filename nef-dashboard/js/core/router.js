function checkAuth() {
  const publicRoutes = ["#login", "#signup"];
  if (!currentUser && !publicRoutes.includes(currentHash)) {
    window.location.hash = "#login";
    return false;
  }
  if (currentUser && publicRoutes.includes(currentHash)) {
    if (currentUser.role === "Admin") {
      window.location.hash = "#admin-dashboard";
    } else {
      window.location.hash = "#teacher-dashboard";
    }
    return false;
  }
  
  // Protect routes based on role
  if (currentUser) {
    if (currentUser.role === "Admin" && currentHash.startsWith("#teacher")) {
      window.location.hash = "#admin-dashboard";
      return false;
    }
    if (currentUser.role === "Teacher" && currentHash.startsWith("#admin")) {
      window.location.hash = "#teacher-dashboard";
      return false;
    }
  }
  return true;
}

function initRouter() {
  window.addEventListener("hashchange", () => {
    currentHash = window.location.hash || "#login";
    if (checkAuth()) {
      renderApp();
    }
  });
  
  // Initial run
  if (checkAuth()) {
    renderApp();
  }
}

async function renderApp() {
  const appContainer = document.getElementById("app");
  if (!appContainer) return;
  
  if (currentHash === "#login") {
    appContainer.innerHTML = getLoginTemplate();
    bindLoginEvents();
  } else if (currentHash === "#signup") {
    appContainer.innerHTML = await getSignupTemplate();
    bindSignupEvents();
  } else {
    // Authenticated layout
    appContainer.innerHTML = `
      <div class="dashboard-container">
        ${getSidebarTemplate()}
        <div class="main-wrapper">
          ${getTopbarTemplate()}
          <div class="content-body" id="content-area"></div>
        </div>
      </div>
      <div id="modal-container"></div>
      <div id="alert-container" style="position: fixed; bottom: 2rem; right: 2rem; z-index: 1100; display: flex; flex-direction: column; gap: 0.5rem;"></div>
    `;
    bindDashboardLayoutEvents();
    try {
      await renderContentArea();
    } catch (err) {
      // e.g. backend unreachable or permission error - show it instead of a blank page.
      const area = document.getElementById("content-area");
      if (area && currentUser) {
        area.innerHTML = `<div class="card" style="padding:2rem; text-align:center;">
          <h3 style="margin-bottom:0.5rem;">Could not load this page</h3>
          <p style="color: var(--text-secondary);">${escapeHtml(describeApiError(err, "Unexpected error."))}</p>
        </div>`;
      }
    }
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
  // Initialize floating scrollbars
  setTimeout(initFloatingScrollbars, 100);
}

async function renderContentArea() {
  const contentArea = document.getElementById("content-area");
  if (!contentArea) return;
  
  switch (currentHash) {
    case "#admin-dashboard":
      contentArea.innerHTML = await getAdminDashboardTemplate();
      renderAdminCharts();
      break;
    case "#admin-students":
    case "#teacher-students":
      contentArea.innerHTML = await getStudentsPageTemplate();
      bindStudentsPageEvents();
      break;
    case "#admin-teachers":
      contentArea.innerHTML = await getTeachersPageTemplate();
      bindTeachersPageEvents();
      break;
    case "#admin-schools":
      contentArea.innerHTML = getSchoolsPageTemplate();
      bindSchoolsPageEvents();
      break;
    case "#admin-enroll":
    case "#teacher-enroll":
      contentArea.innerHTML = await getEnrollStudentTemplate();
      bindEnrollStudentEvents();
      break;
    case "#admin-profile":
    case "#teacher-profile":
      contentArea.innerHTML = await getProfileTemplate();
      bindProfileEvents();
      break;
    case "#teacher-dashboard":
      contentArea.innerHTML = await getTeacherDashboardTemplate();
      break;
    case "#teacher-attendance":
      contentArea.innerHTML = await getAttendanceTemplate();
      bindAttendanceEvents();
      break;
    case "#teacher-promotion":
      contentArea.innerHTML = getPromotionPageTemplate();
      bindPromotionEvents();
      break;
    default:
      contentArea.innerHTML = "<h2>Page Not Found</h2>";
  }
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function getSidebarTemplate() {
  if (!currentUser) return "";
  
  const isAdmin = currentUser.role === "Admin";
  const brand = `<div class="sidebar-brand">
    <div class="sidebar-logo"><i data-lucide="graduation-cap"></i></div>
    <span class="brand-text">NEF Portal</span>
  </div>`;
  
  let menuItems = "";
  if (isAdmin) {
    menuItems = `
      <li class="sidebar-item">
        <a href="#admin-dashboard" class="sidebar-link ${escapeHtml(currentHash === "#admin-dashboard" ? "active" : "")}">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#admin-students" class="sidebar-link ${escapeHtml(currentHash === "#admin-students" ? "active" : "")}">
          <i data-lucide="users"></i> Students
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#admin-teachers" class="sidebar-link ${escapeHtml(currentHash === "#admin-teachers" ? "active" : "")}">
          <i data-lucide="graduation-cap"></i> Teachers
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#admin-schools" class="sidebar-link ${escapeHtml(currentHash === "#admin-schools" ? "active" : "")}">
          <i data-lucide="school"></i> Schools
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#admin-enroll" class="sidebar-link ${escapeHtml(currentHash === "#admin-enroll" ? "active" : "")}">
          <i data-lucide="user-plus"></i> Enroll Student
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#admin-profile" class="sidebar-link ${escapeHtml(currentHash === "#admin-profile" ? "active" : "")}">
          <i data-lucide="user"></i> Profile
        </a>
      </li>
    `;
  } else {
    menuItems = `
      <li class="sidebar-item">
        <a href="#teacher-dashboard" class="sidebar-link ${escapeHtml(currentHash === "#teacher-dashboard" ? "active" : "")}">
          <i data-lucide="layout-dashboard"></i> Dashboard
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#teacher-students" class="sidebar-link ${escapeHtml(currentHash === "#teacher-students" ? "active" : "")}">
          <i data-lucide="users"></i> My Students
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#teacher-attendance" class="sidebar-link ${escapeHtml(currentHash === "#teacher-attendance" ? "active" : "")}">
          <i data-lucide="clipboard-check"></i> Attendance
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#teacher-promotion" class="sidebar-link ${escapeHtml(currentHash === "#teacher-promotion" ? "active" : "")}">
          <i data-lucide="trending-up"></i> Student Promotion
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#teacher-enroll" class="sidebar-link ${escapeHtml(currentHash === "#teacher-enroll" ? "active" : "")}">
          <i data-lucide="user-plus"></i> Enroll Student
        </a>
      </li>
      <li class="sidebar-item">
        <a href="#teacher-profile" class="sidebar-link ${escapeHtml(currentHash === "#teacher-profile" ? "active" : "")}">
          <i data-lucide="user"></i> Profile
        </a>
      </li>
    `;
  }
  
  menuItems += `
    <li class="sidebar-item" style="margin-top: 2rem;">
      <a href="#" id="logout-btn" class="sidebar-link" style="color: var(--danger);">
        <i data-lucide="log-out" style="color: var(--danger);"></i> Logout
      </a>
    </li>
  `;
  
  const initials = currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const userFooter = `
    <div class="sidebar-user">
      <div class="sidebar-avatar">${escapeHtml(initials)}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${escapeHtml(currentUser.name)}</div>
        <div class="sidebar-user-role">${escapeHtml(currentUser.role)}</div>
      </div>
    </div>
  `;
  
  return `
    <aside class="sidebar" id="sidebar">
      ${brand}
      <ul class="sidebar-menu">
        ${menuItems}
      </ul>
      ${userFooter}
    </aside>
  `;
}

function getTopbarTemplate() {
  if (!currentUser) return "";
  
  let pageTitle = "Dashboard";
  if (currentHash.includes("students")) pageTitle = currentUser.role === "Admin" ? "Students Database" : "My Students";
  else if (currentHash.includes("teachers")) pageTitle = "Teachers Database";
  else if (currentHash.includes("schools")) pageTitle = "Schools Database";
  else if (currentHash.includes("enroll")) pageTitle = "Enroll New Student";
  else if (currentHash.includes("profile")) pageTitle = "My Profile";
  else if (currentHash.includes("attendance")) pageTitle = "Mark Student Attendance";
  else if (currentHash.includes("promotion")) pageTitle = "Student Promotion";
  
  return `
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-toggle" id="menu-toggle"><i data-lucide="menu"></i></button>
        <h2 class="page-title">${escapeHtml(pageTitle)}</h2>
      </div>
      <div class="topbar-right">
        <div class="topbar-user" onclick="window.location.hash='${escapeHtml(currentUser.role === 'Admin' ? '#admin-profile' : '#teacher-profile')}'">
          <div class="topbar-user-info">
            <div class="topbar-user-name">${escapeHtml(currentUser.name)}</div>
            <div class="topbar-user-role">${escapeHtml(currentUser.role)} Portal</div>
          </div>
          <div class="sidebar-avatar" style="width: 36px; height: 36px; font-size: 0.9rem;">
            ${escapeHtml(currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase())}
          </div>
        </div>
      </div>
    </header>
  `;
}

function bindDashboardLayoutEvents() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Revokes the token on the server and clears the local session.
      await authService.logout();
      window.location.hash = "#login";
    });
  }
  
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
}

window.renderApp = renderApp;
window.renderContentArea = renderContentArea;
window.initRouter = initRouter;
