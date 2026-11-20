const teacherService = {
  async getTeachers() {
    if (window.CONFIG.USE_MOCK_API) {
      return JSON.parse(localStorage.getItem("nef_teachers")) || [];
    }
    return await window.httpClient.get("/teachers");
  },
  // POST /teachers - the server generates the TCH-xxx id.
  async createTeacher(teacherData) {
    if (window.CONFIG.USE_MOCK_API) {
      const teachers = await this.getTeachers();
      const created = { teacherId: mockNextId(teachers, "teacherId", "TCH"), ...teacherData };
      teachers.push(created);
      localStorage.setItem("nef_teachers", JSON.stringify(teachers));
      return created;
    }
    return await window.httpClient.post("/teachers", teacherData);
  },
  // PUT /teachers/:id (Admin)
  async updateTeacher(teacherId, teacherData) {
    if (window.CONFIG.USE_MOCK_API) {
      const teachers = await this.getTeachers();
      const idx = teachers.findIndex(t => t.teacherId === teacherId);
      if (idx !== -1) {
        teachers[idx] = { ...teachers[idx], ...teacherData };
        localStorage.setItem("nef_teachers", JSON.stringify(teachers));
        return teachers[idx];
      }
      return teacherData;
    }
    return await window.httpClient.put(`/teachers/${encodeURIComponent(teacherId)}`, teacherData);
  },
  // PUT /teachers/me - a Teacher edits their own profile (school and
  // employment status are ignored; only an Admin can change those).
  async updateMyProfile(teacherData) {
    if (window.CONFIG.USE_MOCK_API) {
      const { schoolId, employmentStatus, ...rest } = teacherData;
      return this.updateTeacher(currentUser.teacherId, rest);
    }
    const { schoolId, employmentStatus, ...rest } = teacherData;
    return await window.httpClient.put("/teachers/me", rest);
  },
  async deleteTeacher(teacherId) {
    if (window.CONFIG.USE_MOCK_API) {
      const teachers = await this.getTeachers();
      localStorage.setItem("nef_teachers", JSON.stringify(teachers.filter(t => t.teacherId !== teacherId)));
      return { message: "Teacher record deleted successfully." };
    }
    return await window.httpClient.delete(`/teachers/${encodeURIComponent(teacherId)}`);
  }
};
window.teacherService = teacherService;
