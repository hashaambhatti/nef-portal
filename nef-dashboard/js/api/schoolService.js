const schoolService = {
  async getSchools() {
    if (window.CONFIG.USE_MOCK_API) {
      return JSON.parse(localStorage.getItem("nef_schools")) || [];
    }
    return await window.httpClient.get("/schools");
  },
  // GET /schools/public - code + name only, works before login (signup form).
  async getPublicSchools() {
    if (window.CONFIG.USE_MOCK_API) {
      return (await this.getSchools()).map(s => ({ schoolCode: s.schoolCode, name: s.name }));
    }
    return await window.httpClient.get("/schools/public");
  },
  // POST /schools - schoolData may carry a `building` object; the server
  // creates both and generates SCH-xxx / BLD-xxx ids.
  async createSchool(schoolData) {
    if (window.CONFIG.USE_MOCK_API) {
      const schools = await this.getSchools();
      const buildings = await this.getBuildings();
      const { building, ...school } = schoolData;
      const created = {
        schoolCode: mockNextId(schools, "schoolCode", "SCH"),
        totalStudents: 0,
        totalTeachers: 0,
        ...school
      };
      if (building) {
        created.buildingId = mockNextId(buildings, "buildingId", "BLD");
        buildings.push({ ...building, buildingId: created.buildingId, schoolId: created.schoolCode });
        localStorage.setItem("nef_buildings", JSON.stringify(buildings));
      }
      schools.push(created);
      localStorage.setItem("nef_schools", JSON.stringify(schools));
      return created;
    }
    return await window.httpClient.post("/schools", schoolData);
  },
  // PUT /schools/:code - may carry a `building` object to create/update.
  async updateSchool(schoolCode, schoolData) {
    if (window.CONFIG.USE_MOCK_API) {
      const schools = await this.getSchools();
      const idx = schools.findIndex(s => s.schoolCode === schoolCode);
      if (idx === -1) throw { message: "School not found." };
      const { building, ...school } = schoolData;
      const oldName = schools[idx].name;
      schools[idx] = { ...schools[idx], ...school };
      if (building) {
        const buildings = await this.getBuildings();
        if (!schools[idx].buildingId) schools[idx].buildingId = mockNextId(buildings, "buildingId", "BLD");
        const bIdx = buildings.findIndex(b => b.buildingId === schools[idx].buildingId);
        const row = { ...building, buildingId: schools[idx].buildingId, schoolId: schoolCode };
        if (bIdx === -1) buildings.push(row); else buildings[bIdx] = row;
        localStorage.setItem("nef_buildings", JSON.stringify(buildings));
      }
      if (school.name && school.name !== oldName) {
        const students = JSON.parse(localStorage.getItem("nef_students")) || [];
        students.forEach(s => { if (s.schoolName === oldName) s.schoolName = school.name; });
        localStorage.setItem("nef_students", JSON.stringify(students));
      }
      localStorage.setItem("nef_schools", JSON.stringify(schools));
      return schools[idx];
    }
    return await window.httpClient.put(`/schools/${encodeURIComponent(schoolCode)}`, schoolData);
  },
  async deleteSchool(schoolCode) {
    if (window.CONFIG.USE_MOCK_API) {
      const schools = await this.getSchools();
      const school = schools.find(s => s.schoolCode === schoolCode);
      localStorage.setItem("nef_schools", JSON.stringify(schools.filter(s => s.schoolCode !== schoolCode)));
      const buildings = await this.getBuildings();
      localStorage.setItem("nef_buildings", JSON.stringify(
        buildings.filter(b => b.schoolId !== schoolCode && (!school || b.buildingId !== school.buildingId))
      ));
      const classes = await this.getClasses();
      localStorage.setItem("nef_classes", JSON.stringify(classes.filter(c => c.schoolId !== schoolCode)));
      return { message: "School record deleted successfully." };
    }
    return await window.httpClient.delete(`/schools/${encodeURIComponent(schoolCode)}`);
  },
  async getBuildings() {
    if (window.CONFIG.USE_MOCK_API) {
      return JSON.parse(localStorage.getItem("nef_buildings")) || [];
    }
    return await window.httpClient.get("/buildings");
  },
  async getClasses() {
    if (window.CONFIG.USE_MOCK_API) {
      return JSON.parse(localStorage.getItem("nef_classes")) || [];
    }
    return await window.httpClient.get("/classes");
  },
  async saveClasses(classes) {
    if (window.CONFIG.USE_MOCK_API) {
      localStorage.setItem("nef_classes", JSON.stringify(classes));
      return classes;
    }
    return await window.httpClient.put("/classes", classes);
  }
};
window.schoolService = schoolService;
