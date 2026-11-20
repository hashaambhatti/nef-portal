const promotionStates = {
  search: "",
  filter: "all"
};

function getPromotionPageTemplate() {
  return `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">End-of-Year Student Promotion</h3>
        <span class="badge badge-info">School Year Processing</span>
      </div>
      
      <div class="actions-bar">
        <div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" id="promotion-search" class="search-input" placeholder="Search by student name or ID...">
        </div>
        <select id="promotion-filter-class" class="filter-select">
          <option value="all">All Grades</option>
          <option value="Prep">Prep</option>
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
        </select>
      </div>
      
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Current Grade</th>
              <th>Status/Result</th>
              <th>Promotion Action / Set Result</th>
              <th>Pass-out Date (Grade 5 Only)</th>
            </tr>
          </thead>
          <tbody id="promotion-table-body">
            <!-- Render list dynamically -->
          </tbody>
        </table>
      </div>
      
      <div style="padding: 1.5rem; display: flex; justify-content: flex-end; border-top: 1px solid var(--border); background-color: #fafbfd; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">
          <i data-lucide="info" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>
          Passing students will advance one grade. Grade 5 graduates require a pass-out date.
        </span>
        <button class="btn btn-primary" id="process-promotion-btn">
          <i data-lucide="trending-up"></i> Process & Save Promotions
        </button>
      </div>
    </div>
  `;
}

async function renderPromotionTable() {
  const body = document.getElementById("promotion-table-body");
  if (!body) return;
  
  let students = await studentService.getStudents();
  const teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  
  // Restrict to teacher's own school
  const activeTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
  if (!activeTeacher) {
    body.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">Teacher record not found.</td></tr>`;
    return;
  }
  const teacherSchool = schools.find(s => s.schoolCode === activeTeacher.schoolId);
  if (!teacherSchool) {
    body.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">School assignment not found.</td></tr>`;
    return;
  }
  
  // Filter by school name and exclude Graduated students
  students = students.filter(s => s.schoolName === teacherSchool.name && s.class !== "Graduated");
  
  // Apply Search
  if (promotionStates.search) {
    const q = promotionStates.search.toLowerCase();
    students = students.filter(s => String(s.name || "").toLowerCase().includes(q) || String(s.studentId || "").toLowerCase().includes(q));
  }
  
  // Apply Grade Filter
  if (promotionStates.filter !== "all") {
    students = students.filter(s => s.class === promotionStates.filter);
  }
  
  let html = "";
  students.forEach(student => {
    const isGrade5 = student.class === "Grade 5";
    
    html += `
      <tr class="promotion-row" data-student-id="${escapeHtml(student.studentId)}" data-current-class="${escapeHtml(student.class)}">
        <td><strong>${escapeHtml(student.studentId)}</strong></td>
        <td>${escapeHtml(student.name)}</td>
        <td><span class="badge badge-info">${escapeHtml(student.class)}</span></td>
        <td>
          <span class="badge ${escapeHtml(student.result === 'Pass' ? 'badge-success' : (student.result === 'Fail' ? 'badge-danger' : 'badge-warning'))}">
            ${escapeHtml(student.result || "Not Processed")}
          </span>
        </td>
        <td>
          <select class="form-control promotion-result-select" style="width: 150px;" onchange="handlePromotionResultChange('${escapeHtml(student.studentId)}')">
            <option value="Pass" ${escapeHtml(student.result === 'Pass' ? 'selected' : '')}>Pass (Promote)</option>
            <option value="Fail" ${escapeHtml(student.result === 'Fail' ? 'selected' : '')}>Fail (Retain)</option>
            <option value="Dropout" ${escapeHtml(student.result === 'Dropout' ? 'selected' : '')}>Dropout</option>
          </select>
        </td>
        <td>
          <input type="date" class="form-control promotion-passout-date" 
                 id="passout-date-${escapeHtml(student.studentId)}" 
                 style="width: 160px; display: ${escapeHtml(isGrade5 ? 'block' : 'none')};" 
                 value="${escapeHtml(student.passOutDate || '')}"
                 ${escapeHtml(isGrade5 ? 'required' : 'disabled')}>
        </td>
      </tr>
    `;
  });
  
  if (students.length === 0) {
    html = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No active students found.</td></tr>`;
  }
  
  body.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
  initFloatingScrollbars();
}

async function bindPromotionEvents() {
  const searchInput = document.getElementById("promotion-search");
  const classFilter = document.getElementById("promotion-filter-class");
  const processBtn = document.getElementById("process-promotion-btn");
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      promotionStates.search = e.target.value;
      renderPromotionTable();
    });
  }
  
  if (classFilter) {
    classFilter.addEventListener("change", (e) => {
      promotionStates.filter = e.target.value;
      renderPromotionTable();
    });
  }
  
  if (processBtn) {
    processBtn.addEventListener("click", async () => {
      const rows = document.querySelectorAll(".promotion-row");
      if (rows.length === 0) {
        alert("No students to promote.");
        return;
      }
      
      // Validate first
      let isValid = true;
      const promotionsToProcess = [];
      
      rows.forEach(row => {
        const studentId = row.getAttribute("data-student-id");
        const currentClass = row.getAttribute("data-current-class");
        const resultSelect = row.querySelector(".promotion-result-select");
        const dateInput = document.getElementById(`passout-date-${studentId}`);
        
        if (resultSelect) {
          const result = resultSelect.value;
          let passOutDate = "";
          
          if (currentClass === "Grade 5" && result === "Pass") {
            if (!dateInput || !dateInput.value) {
              isValid = false;
              if (dateInput) dateInput.style.borderColor = "var(--danger)";
            } else {
              if (dateInput) dateInput.style.borderColor = "var(--border)";
              passOutDate = dateInput.value;
            }
          }
          
          promotionsToProcess.push({ studentId, currentClass, result, passOutDate });
        }
      });
      
      if (!isValid) {
        alert("Please enter a Pass-out Date for all passing Grade 5 students.");
        return;
      }
      
      if (!confirm("Are you sure you want to process student promotions? This will modify grades and results for selected students.")) {
        return;
      }
      
      // Process database updates
      const students = await studentService.getStudents();
      const GRADE_PROGRESSION = {
        "Prep": "Grade 1",
        "Grade 1": "Grade 2",
        "Grade 2": "Grade 3",
        "Grade 3": "Grade 4",
        "Grade 4": "Grade 5",
        "Grade 5": "Graduated"
      };
      
      promotionsToProcess.forEach(item => {
        const studentIdx = students.findIndex(s => s.studentId === item.studentId);
        if (studentIdx !== -1) {
          const student = students[studentIdx];
          student.result = item.result;
          
          if (item.result === "Pass") {
            const nextClass = GRADE_PROGRESSION[item.currentClass];
            if (nextClass) {
              student.class = nextClass;
              if (nextClass === "Graduated") {
                student.passOutDate = item.passOutDate;
              }
            }
          } else if (item.result === "Fail") {
            // Keep current grade
          } else if (item.result === "Dropout") {
            // Keep current grade, mark as dropout
          }
        }
      });
      
      await studentService.saveStudents(students);
      showAlert("Student promotions processed successfully!");
      renderPromotionTable();
    });
  }
  
  renderPromotionTable();
}

function handlePromotionResultChange(studentId) {
  const row = document.querySelector(`.promotion-row[data-student-id="${studentId}"]`);
  if (!row) return;
  
  const currentClass = row.getAttribute("data-current-class");
  if (currentClass !== "Grade 5") return; // Only Grade 5 has pass-out date
  
  const resultSelect = row.querySelector(".promotion-result-select");
  const dateInput = document.getElementById(`passout-date-${studentId}`);
  if (!resultSelect || !dateInput) return;
  
  if (resultSelect.value === "Pass") {
    dateInput.style.display = "block";
    dateInput.removeAttribute("disabled");
    dateInput.setAttribute("required", "true");
  } else {
    dateInput.style.display = "none";
    dateInput.setAttribute("disabled", "true");
    dateInput.removeAttribute("required");
  }
}



window.handlePromotionResultChange = handlePromotionResultChange;
