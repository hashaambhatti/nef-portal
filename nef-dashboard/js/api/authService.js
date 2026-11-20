// Mock-mode helper: next "PREFIX-001" style id from a list.
function mockNextId(list, key, prefix) {
  const max = list.reduce((m, item) => {
    const n = parseInt(String(item[key] || "").replace(`${prefix}-`, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
window.mockNextId = mockNextId;

function storeSession(user, token) {
  if (token) localStorage.setItem("nef_auth_token", token);
  localStorage.setItem("nef_current_user", JSON.stringify(user));
  currentUser = user;
}

const authService = {
  // POST /auth/login. Stores the JWT and the user (incl. teacherId).
  async login(email, password) {
    if (window.CONFIG.USE_MOCK_API) {
      const users = JSON.parse(localStorage.getItem("nef_users")) || [];
      const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);
      if (!user) throw { message: "Invalid email or password." };
      const { password: _omit, ...safeUser } = user;
      storeSession(safeUser, null);
      return safeUser;
    }
    const response = await window.httpClient.post("/auth/login", { email, password });
    storeSession(response.user, response.token);
    return response.user;
  },

  // POST /auth/signup. Always creates a Teacher account (one transaction on the server).
  async signup({ name, email, password, teacherProfile }) {
    if (window.CONFIG.USE_MOCK_API) {
      const users = JSON.parse(localStorage.getItem("nef_users")) || [];
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw { message: "An account with this email already exists." };
      }
      const teacher = await window.teacherService.createTeacher({ name, employmentStatus: "Employed", ...teacherProfile });
      const schools = JSON.parse(localStorage.getItem("nef_schools")) || [];
      const s = schools.find(x => x.schoolCode === teacherProfile.schoolId);
      if (s) { s.totalTeachers = (s.totalTeachers || 0) + 1; localStorage.setItem("nef_schools", JSON.stringify(schools)); }
      users.push({ name, email, password, role: "Teacher", teacherId: teacher.teacherId });
      localStorage.setItem("nef_users", JSON.stringify(users));
      return { message: "Account created successfully." };
    }
    return await window.httpClient.post("/auth/signup", { name, email, password, teacherProfile });
  },

  async logout() {
    if (!window.CONFIG.USE_MOCK_API) {
      try { await window.httpClient.post("/auth/logout"); } catch (e) { /* already logged out */ }
    }
    localStorage.removeItem("nef_current_user");
    localStorage.removeItem("nef_auth_token");
    currentUser = null;
  },

  // PUT /users/me - own name / email / password. Email and password changes
  // need the current password.
  async updateMe({ name, email, currentPassword, newPassword }) {
    if (window.CONFIG.USE_MOCK_API) {
      const users = JSON.parse(localStorage.getItem("nef_users")) || [];
      const idx = users.findIndex(u => u.email === currentUser.email);
      if (idx === -1) throw { message: "User not found." };
      if ((email !== users[idx].email || newPassword) && users[idx].password !== currentPassword) {
        throw { message: "Your current password is required to change your email or password." };
      }
      users[idx] = { ...users[idx], name, email, ...(newPassword ? { password: newPassword } : {}) };
      localStorage.setItem("nef_users", JSON.stringify(users));
      const { password: _omit, ...safeUser } = users[idx];
      storeSession(safeUser, null);
      return safeUser;
    }
    const body = { name, email };
    if (currentPassword) body.currentPassword = currentPassword;
    if (newPassword) body.newPassword = newPassword;
    const res = await window.httpClient.put("/users/me", body);
    storeSession(res.user, res.token || null);
    return res.user;
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem("nef_current_user"));
  }
};
window.authService = authService;
