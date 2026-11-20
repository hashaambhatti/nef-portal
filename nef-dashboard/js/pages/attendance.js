async function getAttendanceTemplate() {
  if (!currentUser || !currentUser.teacherId) return "<h2>Error: No linked teacher profile</h2>";
  
  const teachers = await teacherService.getTeachers();
  const linkedTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
  const schools = await schoolService.getSchools();
  const mySchool = schools.find(s => s.schoolCode === linkedTeacher?.schoolId);
  
  const todayStr = new Date().toISOString().split("T")[0];
  
  return `
    <div class="attendance-header-selectors">
      <div class="form-group" style="margin-bottom:0; min-width: 250px;">
        <label class="form-label">Active School Location</label>
        <select id="att-school-select" class="form-control" style="pointer-events: none; background-color: var(--bg-app);" readonly>
          ${mySchool ? `<option value="${escapeHtml(mySchool.schoolCode)}">${escapeHtml(mySchool.name)}</option>` : `<option value="">No school assigned</option>`}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0; min-width: 150px;">
        <label class="form-label">Grade</label>
        <select id="att-grade-select" class="form-control">
          <option value="all">All Grades</option>
          <option value="Prep">Prep</option>
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0; min-width: 200px;">
        <label class="form-label">Attendance Date</label>
        <input type="date" id="att-date-select" class="form-control" value="${escapeHtml(todayStr)}">
      </div>
      <button class="btn btn-secondary" onclick="markAllPresent()" style="height:42px;"><i data-lucide="check-square"></i> Mark All Present</button>
    </div>
    
    <div class="attendance-table-card">
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Roll Status</th>
            </tr>
          </thead>
          <tbody id="attendance-students-list">
            <!-- Render list of students dynamically on select -->
          </tbody>
        </table>
      </div>
      <div style="padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--border); background-color: #fafbfd;">
        <button class="btn btn-primary" id="save-attendance-btn"><i data-lucide="save"></i> Save Attendance</button>
      </div>
    </div>
  `;
}

async function renderAttendanceStudents() {
  const tbody = document.getElementById("attendance-students-list");
  if (!tbody) return;
  
  const schCode = document.getElementById("att-school-select").value;
  const school = (await schoolService.getSchools()).find(s => s.schoolCode === schCode);
  const dateStr = document.getElementById("att-date-select").value;
  
  if (!school) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding:2rem;">No school selected.</td></tr>`;
    return;
  }
  
  // Security guard: the teacher can only view/mark attendance for her own school
  const activeTeacher = (await teacherService.getTeachers()).find(t => t.teacherId === currentUser.teacherId);
  if (activeTeacher && activeTeacher.schoolId !== schCode) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--danger); padding:2rem;">Access Denied: You can only view/mark attendance for your own school.</td></tr>`;
    return;
  }
  
  // Filter students that study in this school
  let students = (await studentService.getStudents()).filter(s => s.schoolName === school.name);
  
  const gradeSelect = document.getElementById("att-grade-select");
  const gradeFilter = gradeSelect ? gradeSelect.value : "all";
  
  if (gradeFilter !== "all") {
    students = students.filter(s => s.class === gradeFilter);
  } else {
    // Sort and group by grade in specific order: Prep, Grade 1, Grade 2, Grade 3, Grade 4, Grade 5
    const gradeOrder = {
      "Prep": 0,
      "Grade 1": 1,
      "Grade 2": 2,
      "Grade 3": 3,
      "Grade 4": 4,
      "Grade 5": 5
    };
    students.sort((a, b) => {
      const orderA = gradeOrder[a.class] !== undefined ? gradeOrder[a.class] : 99;
      const orderB = gradeOrder[b.class] !== undefined ? gradeOrder[b.class] : 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  const existingAttendance = (await attendanceService.getAttendance()).filter(a => a.date === dateStr);
  
  let html = "";
  students.forEach(std => {
    const record = existingAttendance.find(a => a.studentId === std.studentId);
    const status = record ? record.status : "Present"; // Default to Present
    
    html += `
      <tr class="attendance-row" data-student-id="${escapeHtml(std.studentId)}">
        <td><strong>${escapeHtml(std.name)}</strong></td>
        <td>${escapeHtml(std.class)}</td>
        <td>
          <div class="attendance-toggle-group">
            <button type="button" class="attendance-toggle-btn present ${escapeHtml(status === "Present" ? "active" : "")}" onclick="toggleAttendanceRow('${escapeHtml(std.studentId)}', 'Present')">Present</button>
            <button type="button" class="attendance-toggle-btn absent ${escapeHtml(status === "Absent" ? "active" : "")}" onclick="toggleAttendanceRow('${escapeHtml(std.studentId)}', 'Absent')">Absent</button>
          </div>
        </td>
      </tr>
    `;
  });
  
  if (students.length === 0) {
    html = `<tr><td colspan="3" style="text-align: center; padding: 2rem;">No students found matching your criteria.</td></tr>`;
  }
  
  tbody.innerHTML = html;
  initFloatingScrollbars();
}

async function bindAttendanceEvents() {
  const schSelect = document.getElementById("att-school-select");
  const dateSelect = document.getElementById("att-date-select");
  const gradeSelect = document.getElementById("att-grade-select");
  
  if (schSelect) schSelect.addEventListener("change", renderAttendanceStudents);
  if (dateSelect) dateSelect.addEventListener("change", renderAttendanceStudents);
  if (gradeSelect) gradeSelect.addEventListener("change", renderAttendanceStudents);
  
  renderAttendanceStudents();
  
  const saveBtn = document.getElementById("save-attendance-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const dateStr = document.getElementById("att-date-select").value;
      if (!dateStr) {
        alert("Please select a date!");
        return;
      }
      
      const rows = document.querySelectorAll(".attendance-row");
      const localAttendance = await attendanceService.getAttendance();
      
      // Filter out existing records for these students on this date
      const studentsToUpdate = [];
      rows.forEach(row => {
        const studentId = row.getAttribute("data-student-id");
        const status = row.querySelector(".present").classList.contains("active") ? "Present" : "Absent";
        studentsToUpdate.push({ studentId, status });
      });
      
      if (studentsToUpdate.length === 0) {
        alert("No student attendance to record!");
        return;
      }
      
      // Clean up previous records in local db array for these students on this date
      let updatedAttendance = localAttendance.filter(a => 
        !(a.date === dateStr && studentsToUpdate.some(s => s.studentId === a.studentId))
      );
      
      // Push new logs
      studentsToUpdate.forEach(item => {
        updatedAttendance.push({
          studentId: item.studentId,
          date: dateStr,
          status: item.status
        });
      });
      
      await attendanceService.saveAttendance(updatedAttendance);
      showAlert(`Attendance for ${dateStr} saved successfully!`);
    });
  }
}

function toggleAttendanceRow(studentId, status) {
  const row = document.querySelector(`.attendance-row[data-student-id="${studentId}"]`);
  if (!row) return;
  
  const pBtn = row.querySelector(".present");
  const aBtn = row.querySelector(".absent");
  
  if (status === "Present") {
    pBtn.classList.add("active");
    aBtn.classList.remove("active");
  } else {
    pBtn.classList.remove("active");
    aBtn.classList.add("active");
  }
}



window.toggleAttendanceRow = toggleAttendanceRow;

function markAllPresent() {
  const rows = document.querySelectorAll(".attendance-row");
  rows.forEach(row => {
    const studentId = row.getAttribute("data-student-id");
    toggleAttendanceRow(studentId, "Present");
  });
  showAlert("Marked all students as present.");
}
window.markAllPresent = markAllPresent;
