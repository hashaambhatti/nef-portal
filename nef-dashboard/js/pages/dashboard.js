async function getAdminDashboardTemplate() {
  const students = await studentService.getStudents();
  const teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalSchools = schools.length;
  const functionalSchools = schools.filter(s => String(s.schoolStatus || "").toLowerCase() === "functional").length;
  const nonFunctionalSchools = totalSchools - functionalSchools;
  
  // Get recent admissions (past 5 admissions based on admission date desc)
  const recentAdmissions = [...students]
    .sort((a, b) => new Date(b.dateOfAdmission) - new Date(a.dateOfAdmission))
    .slice(0, 5);
    
  return `
    <!-- Summary Cards -->
    <div class="widgets-grid">
      <!-- 1. Total Schools -->
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Total Schools</span>
          <span class="widget-value">${escapeHtml(totalSchools)}</span>
        </div>
        <div class="widget-icon widget-icon-blue"><i data-lucide="school"></i></div>
      </div>
      <!-- 2. Total Teachers -->
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Total Teachers</span>
          <span class="widget-value">${escapeHtml(totalTeachers)}</span>
        </div>
        <div class="widget-icon widget-icon-blue"><i data-lucide="graduation-cap"></i></div>
      </div>
      <!-- 3. Total Students -->
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Total Students</span>
          <span class="widget-value">${escapeHtml(totalStudents)}</span>
        </div>
        <div class="widget-icon widget-icon-blue"><i data-lucide="users"></i></div>
      </div>
      <!-- 4. Functional Schools -->
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Functional Schools</span>
          <span class="widget-value" style="color: var(--success);">${escapeHtml(functionalSchools)}</span>
        </div>
        <div class="widget-icon widget-icon-emerald"><i data-lucide="check-circle"></i></div>
      </div>
      <!-- 5. Non-Functional Schools -->
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Non-Functional Schools</span>
          <span class="widget-value" style="color: var(--danger);">${escapeHtml(nonFunctionalSchools)}</span>
        </div>
        <div class="widget-icon widget-icon-rose"><i data-lucide="alert-triangle"></i></div>
      </div>
    </div>
    
    <!-- Distribution Charts Section (Minimal) -->
    <h3 style="margin-bottom: 1rem; color: var(--primary); font-size: 1.1rem; font-weight: 600;">Analytical Distributions</h3>
    <div class="charts-grid">
      <!-- 1. Gender Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="pie-chart"></i> Student Gender Distribution</div>
        <div class="chart-body" id="chart-gender"></div>
      </div>
      
      <!-- 2. Disability Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> Disability Distribution</div>
        <div class="chart-body" id="chart-disability"></div>
      </div>
      
      <!-- 3. Orphan Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> Orphan Distribution</div>
        <div class="chart-body" id="chart-orphan"></div>
      </div>
      
      <!-- 4. Refugee Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> Refugee Distribution</div>
        <div class="chart-body" id="chart-refugee"></div>
      </div>
      
      <!-- 5. Citizenship Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="pie-chart"></i> Citizenship Distribution</div>
        <div class="chart-body" id="chart-citizenship"></div>
      </div>
      
      <!-- 6. Residency Status Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> Residency Status Distribution</div>
        <div class="chart-body" id="chart-residency"></div>
      </div>
      
      <!-- 7. School Level Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> School Level Distribution</div>
        <div class="chart-body" id="chart-school-level"></div>
      </div>
      
      <!-- 8. School Gender Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="pie-chart"></i> School Gender Distribution</div>
        <div class="chart-body" id="chart-school-gender"></div>
      </div>
      
      <!-- 9. School Type Distribution -->
      <div class="chart-card">
        <div class="chart-title"><i data-lucide="bar-chart-2"></i> School Type Distribution</div>
        <div class="chart-body" id="chart-school-type"></div>
      </div>
    </div>
    
    <!-- Recent admissions table -->
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">Recent Student Admissions</h3>
        <button class="btn btn-secondary" onclick="window.location.hash='#admin-students'">
          <i data-lucide="eye"></i> View All Students
        </button>
      </div>
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>School</th>
              <th>Teacher</th>
              <th>Admission Date</th>
            </tr>
          </thead>
          <tbody>
            ${recentAdmissions.map(student => {
              const teacher = teachers.find(t => t.teacherId === student.teacherId);
              return `
                <tr>
                  <td><strong>${escapeHtml(student.studentId)}</strong></td>
                  <td>${escapeHtml(student.name)}</td>
                  <td>${escapeHtml(student.schoolName)}</td>
                  <td>${escapeHtml(teacher ? teacher.name : "Unassigned")}</td>
                  <td>${escapeHtml(student.dateOfAdmission)}</td>
                </tr>
              `;
            }).join("")}
            ${recentAdmissions.length === 0 ? "<tr><td colspan='5' style='text-align:center;'>No admissions recorded.</td></tr>" : ""}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function getTeacherDashboardTemplate() {
  if (!currentUser || !currentUser.teacherId) return "<h2>Error: No linked teacher profile</h2>";
  
  const students = (await studentService.getStudents()).filter(s => s.teacherId === currentUser.teacherId);
  const totalStudents = students.length;
  
  // Attendance metrics for today (using ISO date format)
  const todayStr = new Date().toISOString().split("T")[0];
  const attendanceRecords = (await attendanceService.getAttendance()).filter(a => a.date === todayStr);
  
  let presentToday = 0;
  let absentToday = 0;
  students.forEach(s => {
    const record = attendanceRecords.find(a => a.studentId === s.studentId);
    if (record) {
      if (record.status.toLowerCase() === "present") presentToday++;
      else absentToday++;
    }
  });
  
  // Recent attendance list (past 8 records of attendance for teacher's students)
  const recentAttendances = [...await attendanceService.getAttendance()]
    .filter(a => students.some(s => s.studentId === a.studentId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
    
  return `
    <div class="widgets-grid">
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">My Students</span>
          <span class="widget-value">${escapeHtml(totalStudents)}</span>
        </div>
        <div class="widget-icon widget-icon-blue"><i data-lucide="users"></i></div>
      </div>
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Present Today (${escapeHtml(todayStr)})</span>
          <span class="widget-value" style="color: var(--success);">${escapeHtml(presentToday)}</span>
        </div>
        <div class="widget-icon widget-icon-emerald"><i data-lucide="check-circle"></i></div>
      </div>
      <div class="widget-card">
        <div class="widget-info">
          <span class="widget-label">Absent Today (${escapeHtml(todayStr)})</span>
          <span class="widget-value" style="color: var(--danger);">${escapeHtml(absentToday)}</span>
        </div>
        <div class="widget-icon widget-icon-rose"><i data-lucide="x-circle"></i></div>
      </div>
    </div>
    
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">Recent Student Attendance Log</h3>
        <button class="btn btn-primary" onclick="window.location.hash='#teacher-attendance'">
          <i data-lucide="clipboard-check"></i> Manage Attendance
        </button>
      </div>
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${recentAttendances.map(a => {
              const std = students.find(s => s.studentId === a.studentId);
              if (!std) return "";
              const badge = String(a.status || "").toLowerCase() === "present" ? "badge-success" : "badge-danger";
              return `
                <tr>
                  <td><strong>${escapeHtml(a.date)}</strong></td>
                  <td>${escapeHtml(a.studentId)}</td>
                  <td>${escapeHtml(std.name)}</td>
                  <td>${escapeHtml(std.class)}</td>
                  <td><span class="badge ${badge}">${escapeHtml(a.status)}</span></td>
                </tr>
              `;
            }).join("")}
            ${recentAttendances.length === 0 ? "<tr><td colspan='5' style='text-align:center; padding:2rem;'>No attendance logs stored yet.</td></tr>" : ""}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function renderAdminCharts() {
  const students = await studentService.getStudents();
  const schools = await schoolService.getSchools();
  
  // 1. Gender Distribution
  const maleStudents = students.filter(s => String(s.gender || "").toLowerCase() === "male").length;
  const femaleStudents = students.filter(s => String(s.gender || "").toLowerCase() === "female").length;
  renderBarListChart("chart-gender", [
    { name: "Male", count: maleStudents, fillClass: "fill-blue" },
    { name: "Female", count: femaleStudents, fillClass: "fill-rose" }
  ]);
  
  // 2. Disability Distribution
  const withDisability = students.filter(s => String(s.disability || "").toLowerCase() === "yes").length;
  const withoutDisability = students.length - withDisability;
  renderBarListChart("chart-disability", [
    { name: "Students without Disability", count: withoutDisability, fillClass: "fill-blue" },
    { name: "Students with Disability", count: withDisability, fillClass: "fill-rose" }
  ]);
  
  // 3. Orphan Distribution
  const orphans = students.filter(s => String(s.orphan || "").toLowerCase() === "yes").length;
  const nonOrphans = students.length - orphans;
  renderBarListChart("chart-orphan", [
    { name: "Non-Orphan", count: nonOrphans, fillClass: "fill-blue" },
    { name: "Orphan Students", count: orphans, fillClass: "fill-amber" }
  ]);
  
  // 4. Refugee Distribution
  const refugees = students.filter(s => String(s.refugee || "").toLowerCase() === "yes").length;
  const nonRefugees = students.length - refugees;
  renderBarListChart("chart-refugee", [
    { name: "Non-Refugee", count: nonRefugees, fillClass: "fill-blue" },
    { name: "Refugee Students", count: refugees, fillClass: "fill-purple" }
  ]);
  
  // 5. Citizenship Distribution
  const citizens = students.filter(s => String(s.citizenship || "").toLowerCase() === "pakistani").length;
  const refugeeCitizens = students.filter(s => String(s.citizenship || "").toLowerCase() === "refugee").length;
  renderBarListChart("chart-citizenship", [
    { name: "Pakistani", count: citizens, fillClass: "fill-emerald" },
    { name: "Refugee", count: refugeeCitizens, fillClass: "fill-purple" }
  ]);
  
  // 6. Residency Status Distribution
  const permanent = students.filter(s => String(s.residencyStatus || "").toLowerCase() === "permanent").length;
  const temporary = students.filter(s => String(s.residencyStatus || "").toLowerCase() === "temporary").length;
  renderBarListChart("chart-residency", [
    { name: "Permanent", count: permanent, fillClass: "fill-blue" },
    { name: "Temporary", count: temporary, fillClass: "fill-amber" }
  ]);
  
  // 7. School Level Distribution
  const primaryLvl = schools.filter(s => String(s.schoolLevel || "").toLowerCase() === "primary").length;
  const middleLvl = schools.filter(s => String(s.schoolLevel || "").toLowerCase() === "middle").length;
  const secondaryLvl = schools.filter(s => String(s.schoolLevel || "").toLowerCase() === "secondary").length;
  renderBarListChart("chart-school-level", [
    { name: "Primary", count: primaryLvl, fillClass: "fill-blue" },
    { name: "Middle", count: middleLvl, fillClass: "fill-indigo" },
    { name: "Secondary", count: secondaryLvl, fillClass: "fill-emerald" }
  ]);
  
  // 8. School Gender Distribution
  const coEd = schools.filter(s => String(s.schoolGender || "").toLowerCase() === "co-education").length;
  const maleSch = schools.filter(s => String(s.schoolGender || "").toLowerCase() === "male").length;
  const femaleSch = schools.filter(s => String(s.schoolGender || "").toLowerCase() === "female").length;
  renderBarListChart("chart-school-gender", [
    { name: "Co-Education", count: coEd, fillClass: "fill-blue" },
    { name: "Female Only", count: femaleSch, fillClass: "fill-rose" },
    { name: "Male Only", count: maleSch, fillClass: "fill-indigo" }
  ]);
  
  // 9. School Type Distribution
  const types = {};
  schools.forEach(s => {
    types[s.schoolType] = (types[s.schoolType] || 0) + 1;
  });
  const typeItems = Object.keys(types).map((type, index) => {
    const classes = ["fill-blue", "fill-emerald", "fill-purple", "fill-amber", "fill-rose"];
    return { name: type, count: types[type], fillClass: classes[index % classes.length] };
  });
  renderBarListChart("chart-school-type", typeItems);
}