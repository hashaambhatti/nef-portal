const attendanceService = {
  async getAttendance() {
    if (window.CONFIG.USE_MOCK_API) {
      return JSON.parse(localStorage.getItem("nef_attendance")) || [];
    } else {
      return await window.httpClient.get("/attendance");
    }
  },
  async saveAttendance(attendance) {
    if (window.CONFIG.USE_MOCK_API) {
      localStorage.setItem("nef_attendance", JSON.stringify(attendance));
      return attendance;
    } else {
      return await window.httpClient.put("/attendance", attendance);
    }
  }
};
window.attendanceService = attendanceService;
