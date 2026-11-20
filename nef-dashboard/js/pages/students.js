async function getFilteredStudentsList() {
  const state = tableStates.students;
  let students = await studentService.getStudents();
  const teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  const guardians = await studentService.getGuardians();
  
  // Map virtual fields for easy sorting (guardianContact and teacherName)
  students = students.map(s => {
    const g = guardians.find(grd => grd.guardianId === s.guardianId) || {};
    const t = teachers.find(tch => tch.teacherId === s.teacherId) || {};
    return {
      ...s,
      guardianContact: g.contactNo || "N/A",
      teacherName: t.name || "Unassigned"
    };
  });
  
  // Filter for logged-in teacher's school if teacher panel
  if (currentUser.role === "Teacher") {
    const activeTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
    if (activeTeacher) {
      const school = schools.find(s => s.schoolCode === activeTeacher.schoolId);
      if (school) {
        students = students.filter(s => s.schoolName === school.name);
      } else {
        students = [];
      }
    } else {
      students = [];
    }
  }
  
  // Apply Search Filter (Student ID, Name, B-form, Guardian Details)
  if (state.search) {
    const q = state.search.toLowerCase();
    students = students.filter(s => {
      const g = guardians.find(grd => grd.guardianId === s.guardianId) || {};
      return String(s.studentId || "").toLowerCase().includes(q) || 
             String(s.name || "").toLowerCase().includes(q) || 
             String(s.bFormNumber || "").includes(q) ||
             (g.name && String(g.name || "").toLowerCase().includes(q)) ||
             (g.contactNo && String(g.contactNo || "").includes(q));
    });
  }
  
  // Apply Advanced Filters (Admins only)
  if (currentUser.role === "Admin") {
    const adv = state.advanced;
    
    // 1. School
    if (adv.school !== "all") {
      students = students.filter(s => s.schoolName === adv.school);
    }
    // 2. Teacher
    if (adv.teacherId !== "all") {
      students = students.filter(s => s.teacherId === adv.teacherId);
    }
    // 3. Grade
    if (adv.grade !== "all") {
      students = students.filter(s => s.class === adv.grade);
    }
    // 4. Gender
    if (adv.gender !== "all") {
      students = students.filter(s => s.gender === adv.gender);
    }
    // 5. Disability
    if (adv.disability !== "all") {
      if (adv.disability === "yes") {
        students = students.filter(s => s.disability === "Yes");
      } else {
        students = students.filter(s => s.disability === "No");
      }
    }
    // 6. Result
    if (adv.result !== "all") {
      students = students.filter(s => s.result === adv.result);
    }
    // 7. Enrollment Status
    if (adv.enrollmentStatus !== "all") {
      if (adv.enrollmentStatus === "enrolled") {
        students = students.filter(s => !s.passOutDate);
      } else if (adv.enrollmentStatus === "graduated") {
        students = students.filter(s => s.passOutDate && s.result === "Pass");
      } else if (adv.enrollmentStatus === "dropout") {
        students = students.filter(s => s.result === "Dropout");
      }
    }
    // 8. Admission Year
    if (adv.admissionYear !== "all") {
      students = students.filter(s => s.dateOfAdmission && new Date(s.dateOfAdmission).getFullYear() == adv.admissionYear);
    }
    // 9. Graduation Year
    if (adv.graduationYear !== "all") {
      students = students.filter(s => s.passOutDate && new Date(s.passOutDate).getFullYear() == adv.graduationYear);
    }
    // 10. Age Range
    if (adv.ageRange !== "all") {
      if (adv.ageRange === "4-6") {
        students = students.filter(s => s.age >= 4 && s.age <= 6);
      } else if (adv.ageRange === "7-9") {
        students = students.filter(s => s.age >= 7 && s.age <= 9);
      } else if (adv.ageRange === "10-12") {
        students = students.filter(s => s.age >= 10 && s.age <= 12);
      } else if (adv.ageRange === "13+") {
        students = students.filter(s => s.age >= 13);
      }
    }
    // 11. Orphan
    if (adv.orphan !== "all") {
      students = students.filter(s => s.orphan === adv.orphan);
    }
    // 12. Refugee
    if (adv.refugee !== "all") {
      students = students.filter(s => s.refugee === adv.refugee);
    }
    // 13. Citizenship
    if (adv.citizenship !== "all") {
      students = students.filter(s => s.citizenship === adv.citizenship);
    }
    // 14. Residency
    if (adv.residency !== "all") {
      students = students.filter(s => s.residencyStatus === adv.residency);
    }
    // 15. Mother Tongue
    if (adv.motherTongue !== "all") {
      students = students.filter(s => s.motherTongue === adv.motherTongue);
    }
    // 16. Speak Urdu
    if (adv.speakUrdu !== "all") {
      students = students.filter(s => s.canUnderstandUrdu === adv.speakUrdu);
    }
    // 17. Child Labor
    if (adv.childLabor !== "all") {
      if (adv.childLabor === "yes") {
        students = students.filter(s => s.childInLabor && s.childInLabor !== "None");
      } else {
        students = students.filter(s => !s.childInLabor || s.childInLabor === "None");
      }
    }
    // 18. House Ownership
    if (adv.house !== "all") {
      students = students.filter(s => s.house === adv.house);
    }
  }
  
  // Sort Dataset
  students = sortDataset(students, state.sortBy, state.sortOrder);
  return students;
}

async function getStudentsPageTemplate() {
  const state = tableStates.students;
  const schools = await schoolService.getSchools();
  const teachers = await teacherService.getTeachers();
  const students = await studentService.getStudents();
  const isAdmin = currentUser.role === "Admin";
  
  const pageTitle = isAdmin ? "Students Database" : "Students Registry";
  const enrollHash = isAdmin ? "#admin-enroll" : "#teacher-enroll";
  
  const exportDropdownHTML = `
    <div class="dropdown" style="position: relative; display: inline-block;">
      <button class="btn btn-secondary" id="btn-export-students" style="display: flex; align-items: center; gap: 0.5rem; height: 38px;">
        <i data-lucide="download"></i> Export <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
      </button>
      <div class="dropdown-menu" id="export-dropdown-menu" style="position: absolute; right: 0; top: 100%; margin-top: 5px; background: white; border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 100; display: none; min-width: 150px;">
        <a href="#" class="dropdown-item" onclick="exportFilteredStudents('csv'); return false;" style="display: block; padding: 0.5rem 1rem; color: var(--text-primary); text-decoration: none; font-size: 0.85rem;">Export as CSV</a>
        <a href="#" class="dropdown-item" onclick="exportFilteredStudents('xls'); return false;" style="display: block; padding: 0.5rem 1rem; color: var(--text-primary); text-decoration: none; font-size: 0.85rem; border-top: 1px solid #f1f5f9;">Export as Excel</a>
      </div>
    </div>
  `;
  
  if (!isAdmin) {
    // Teacher view: simple search bar, no advanced filter panel
    return `
      <div class="section-card">
        <div class="section-header">
          <h3 class="section-title">${escapeHtml(pageTitle)}</h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${exportDropdownHTML}
            <button class="btn btn-primary" onclick="window.location.hash='${escapeHtml(enrollHash)}'" style="height: 38px;">
              <i data-lucide="user-plus"></i> Enroll Student
            </button>
          </div>
        </div>
        
        <!-- Actions bar -->
        <div class="actions-bar" style="justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div class="search-input-wrapper" style="max-width: 350px; flex: 1;">
            <i data-lucide="search"></i>
            <input type="text" id="students-search" class="search-input" placeholder="Search ID, Name, B-Form..." value="${escapeHtml(state.search)}">
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span class="filter-summary-info" id="students-filter-summary">Showing 0 of 0 students</span>
            ${getLimitSelectorHTML("students")}
          </div>
        </div>
        
        <div class="table-responsive">
          <table class="table-custom" id="students-table">
            <thead>
              <tr>
                ${getHeaderHTML("students", "studentId", "Student ID")}
                ${getHeaderHTML("students", "name", "Name")}
                ${getHeaderHTML("students", "schoolName", "School")}
                ${getHeaderHTML("students", "class", "Class")}
                ${getHeaderHTML("students", "teacherName", "Teacher")}
                ${getHeaderHTML("students", "gender", "Gender")}
                ${getHeaderHTML("students", "disability", "Disability")}
                ${getHeaderHTML("students", "guardianContact", "Guardian Contact")}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="students-table-body">
              <!-- Dynamic students content -->
            </tbody>
          </table>
        </div>
        <div id="students-pagination" class="table-pagination"></div>
      </div>
    `;
  }
  
  // Admin view: advanced filter panel
  const uniqueMotherTongues = [...new Set(students.map(s => s.motherTongue).filter(Boolean))].sort();
  const uniqueAdmissionYears = [...new Set(students.map(s => s.dateOfAdmission ? new Date(s.dateOfAdmission).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);
  const uniqueGraduationYears = [...new Set(students.map(s => s.passOutDate ? new Date(s.passOutDate).getFullYear() : null).filter(Boolean))].sort((a, b) => b - a);
  
  const isPanelActive = state.showFiltersPanel ? "active" : "";
  const panelDisplayStyle = state.showFiltersPanel ? "grid" : "none";
  
  // Count active filters
  let activeFiltersCount = 0;
  Object.keys(state.advanced).forEach(k => {
    if (state.advanced[k] !== "all") activeFiltersCount++;
  });
  
  const filterBtnLabel = activeFiltersCount > 0 ? "Filters (" + activeFiltersCount + ")" : "Advanced Filters";
  
  return `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">${escapeHtml(pageTitle)}</h3>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          ${exportDropdownHTML}
          <button class="btn btn-primary" onclick="window.location.hash='${escapeHtml(enrollHash)}'" style="height: 38px;">
            <i data-lucide="user-plus"></i> Enroll Student
          </button>
        </div>
      </div>
      
      <!-- Search, Toggle Panel and limit selector -->
      <div class="actions-bar" style="gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div class="search-input-wrapper" style="flex: 1; min-width: 250px;">
          <i data-lucide="search"></i>
          <input type="text" id="students-search" class="search-input" placeholder="Search Student Name, ID, B-Form, Guardian Details..." value="${escapeHtml(state.search)}">
        </div>
        
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <button type="button" class="btn-filter-toggle ${escapeHtml(isPanelActive)}" id="btn-toggle-filters">
            <i data-lucide="sliders"></i> ${escapeHtml(filterBtnLabel)}
          </button>
          
          <span class="filter-summary-info" id="students-filter-summary">Showing 0 of 0 students</span>
          
          ${getLimitSelectorHTML("students")}
        </div>
      </div>
      
      <!-- Collapsible Advanced Filters Grid -->
      <div class="advanced-filters-panel" id="students-filters-panel" style="display: ${escapeHtml(panelDisplayStyle)};">
        
        <div class="form-group">
          <label class="form-label">School</label>
          <select id="flt-school" class="form-control-sm">
            <option value="all">All Schools</option>
            ${schools.map(s => `<option value="${escapeHtml(s.name)}" ${escapeHtml(state.advanced.school === s.name ? "selected" : "")}>${escapeHtml(s.name)}</option>`).join("")}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Assigned Teacher</label>
          <select id="flt-teacher" class="form-control-sm">
            <option value="all">All Teachers</option>
            ${teachers.map(t => `<option value="${escapeHtml(t.teacherId)}" ${escapeHtml(state.advanced.teacherId === t.teacherId ? "selected" : "")}>${escapeHtml(t.name)}</option>`).join("")}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Grade/Class</label>
          <select id="flt-grade" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.grade === "all" ? "selected" : "")}>All Grades</option>
            <option value="Prep" ${escapeHtml(state.advanced.grade === "Prep" ? "selected" : "")}>Prep</option>
            <option value="Grade 1" ${escapeHtml(state.advanced.grade === "Grade 1" ? "selected" : "")}>Grade 1</option>
            <option value="Grade 2" ${escapeHtml(state.advanced.grade === "Grade 2" ? "selected" : "")}>Grade 2</option>
            <option value="Grade 3" ${escapeHtml(state.advanced.grade === "Grade 3" ? "selected" : "")}>Grade 3</option>
            <option value="Grade 4" ${escapeHtml(state.advanced.grade === "Grade 4" ? "selected" : "")}>Grade 4</option>
            <option value="Grade 5" ${escapeHtml(state.advanced.grade === "Grade 5" ? "selected" : "")}>Grade 5</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select id="flt-gender" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.gender === "all" ? "selected" : "")}>All</option>
            <option value="Male" ${escapeHtml(state.advanced.gender === "Male" ? "selected" : "")}>Male</option>
            <option value="Female" ${escapeHtml(state.advanced.gender === "Female" ? "selected" : "")}>Female</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Disability Status</label>
          <select id="flt-disability" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.disability === "all" ? "selected" : "")}>All Students</option>
            <option value="yes" ${escapeHtml(state.advanced.disability === "yes" ? "selected" : "")}>Has Disability</option>
            <option value="no" ${escapeHtml(state.advanced.disability === "no" ? "selected" : "")}>No Disability</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Result</label>
          <select id="flt-result" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.result === "all" ? "selected" : "")}>All</option>
            <option value="Pass" ${escapeHtml(state.advanced.result === "Pass" ? "selected" : "")}>Pass</option>
            <option value="Fail" ${escapeHtml(state.advanced.result === "Fail" ? "selected" : "")}>Fail</option>
            <option value="Dropout" ${escapeHtml(state.advanced.result === "Dropout" ? "selected" : "")}>Dropout</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Enrollment Status</label>
          <select id="flt-enroll-status" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.enrollmentStatus === "all" ? "selected" : "")}>All</option>
            <option value="enrolled" ${escapeHtml(state.advanced.enrollmentStatus === "enrolled" ? "selected" : "")}>Currently Enrolled</option>
            <option value="graduated" ${escapeHtml(state.advanced.enrollmentStatus === "graduated" ? "selected" : "")}>Graduated</option>
            <option value="dropout" ${escapeHtml(state.advanced.enrollmentStatus === "dropout" ? "selected" : "")}>Dropped Out</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Admission Year</label>
          <select id="flt-admission-year" class="form-control-sm">
            <option value="all">All Years</option>
            ${uniqueAdmissionYears.map(yr => `<option value="${escapeHtml(yr)}" ${escapeHtml(state.advanced.admissionYear == yr ? "selected" : "")}>${escapeHtml(yr)}</option>`).join("")}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Graduation Year</label>
          <select id="flt-graduation-year" class="form-control-sm">
            <option value="all">All Years</option>
            ${uniqueGraduationYears.map(yr => `<option value="${escapeHtml(yr)}" ${escapeHtml(state.advanced.graduationYear == yr ? "selected" : "")}>	ext{${escapeHtml(yr)}}</option>`).join("")}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Age Range</label>
          <select id="flt-age-range" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.ageRange === "all" ? "selected" : "")}>All</option>
            <option value="4-6" ${escapeHtml(state.advanced.ageRange === "4-6" ? "selected" : "")}>4–6 Years</option>
            <option value="7-9" ${escapeHtml(state.advanced.ageRange === "7-9" ? "selected" : "")}>7–9 Years</option>
            <option value="10-12" ${escapeHtml(state.advanced.ageRange === "10-12" ? "selected" : "")}>10–12 Years</option>
            <option value="13+" ${escapeHtml(state.advanced.ageRange === "13+" ? "selected" : "")}>13+ Years</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Orphan Status</label>
          <select id="flt-orphan" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.orphan === "all" ? "selected" : "")}>All</option>
            <option value="Yes" ${escapeHtml(state.advanced.orphan === "Yes" ? "selected" : "")}>Orphan</option>
            <option value="No" ${escapeHtml(state.advanced.orphan === "No" ? "selected" : "")}>Not Orphan</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Refugee Status</label>
          <select id="flt-refugee" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.refugee === "all" ? "selected" : "")}>All</option>
            <option value="Yes" ${escapeHtml(state.advanced.refugee === "Yes" ? "selected" : "")}>Refugee</option>
            <option value="No" ${escapeHtml(state.advanced.refugee === "No" ? "selected" : "")}>Not Refugee</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Citizenship</label>
          <select id="flt-citizenship" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.citizenship === "all" ? "selected" : "")}>All</option>
            <option value="Pakistani" ${escapeHtml(state.advanced.citizenship === "Pakistani" ? "selected" : "")}>Pakistani</option>
            <option value="Refugee" ${escapeHtml(state.advanced.citizenship === "Refugee" ? "selected" : "")}>Refugee</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Residency Status</label>
          <select id="flt-residency" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.residency === "all" ? "selected" : "")}>All</option>
            <option value="Permanent" ${escapeHtml(state.advanced.residency === "Permanent" ? "selected" : "")}>Permanent</option>
            <option value="Temporary" ${escapeHtml(state.advanced.residency === "Temporary" ? "selected" : "")}>Temporary</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Mother Tongue</label>
          <select id="flt-tongue" class="form-control-sm">
            <option value="all">All</option>
            ${uniqueMotherTongues.map(mt => `<option value="${escapeHtml(mt)}" ${escapeHtml(state.advanced.motherTongue === mt ? "selected" : "")}>	ext{\ ${escapeHtml(mt)}}</option>`).join("")}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Can Speak Urdu</label>
          <select id="flt-speak-urdu" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.speakUrdu === "all" ? "selected" : "")}>All</option>
            <option value="Yes" ${escapeHtml(state.advanced.speakUrdu === "Yes" ? "selected" : "")}>Yes</option>
            <option value="No" ${escapeHtml(state.advanced.speakUrdu === "No" ? "selected" : "")}>No</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Child in Labor</label>
          <select id="flt-child-labor" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.childLabor === "all" ? "selected" : "")}>All</option>
            <option value="Yes" ${escapeHtml(state.advanced.childLabor === "Yes" ? "selected" : "")}>Yes</option>
            <option value="No" ${escapeHtml(state.advanced.childLabor === "No" ? "selected" : "")}>No</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">House Ownership</label>
          <select id="flt-house" class="form-control-sm">
            <option value="all" ${escapeHtml(state.advanced.house === "all" ? "selected" : "")}>All</option>
            <option value="Owned" ${escapeHtml(state.advanced.house === "Owned" ? "selected" : "")}>Owned</option>
            <option value="Rented" ${escapeHtml(state.advanced.house === "Rented" ? "selected" : "")}>Rented</option>
          </select>
        </div>
        
      </div>
      
      <!-- Filter Chips Bar -->
      <div id="students-chips-bar" class="filter-chips-bar" style="display: none;"></div>
      
      <div class="table-responsive">
        <table class="table-custom" id="students-table">
          <thead>
            <tr>
              ${getHeaderHTML("students", "studentId", "Student ID")}
              ${getHeaderHTML("students", "name", "Name")}
              ${getHeaderHTML("students", "schoolName", "School")}
              ${getHeaderHTML("students", "class", "Class")}
              ${getHeaderHTML("students", "teacherName", "Teacher")}
              ${getHeaderHTML("students", "gender", "Gender")}
              ${getHeaderHTML("students", "disability", "Disability")}
              ${getHeaderHTML("students", "guardianContact", "Guardian Contact")}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="students-table-body">
            <!-- Dynamic students content -->
          </tbody>
        </table>
      </div>
      <div id="students-pagination" class="table-pagination"></div>
    </div>
  `;
}

async function exportFilteredStudents(format) {
  const filteredList = await getFilteredStudentsList();
  if (filteredList.length === 0) {
    alert("No student records found matching the current filters to export.");
    return;
  }
  
  const headers = ["Student ID", "Name", "School Name", "Class", "Teacher Name", "Gender", "Age", "Disability Status", "Specify Disability", "Guardian Contact", "Date of Admission", "Pass-out Date", "Result", "Citizenship", "Residency Status", "Mother Tongue", "Orphan", "Refugee"];
  
  if (format === "csv") {
    let csvContent = "\uFEFF"; // UTF-8 BOM for proper Excel encoding
    csvContent += headers.map(h => '"' + h.replace(/"/g, '""') + '"').join(",") + "\r\n";
    
    filteredList.forEach(item => {
      const row = [
        item.studentId || "",
        item.name || "",
        item.schoolName || "",
        item.class || "",
        item.teacherName || "",
        item.gender || "",
        item.age || "",
        item.disability || "No",
        item.specify || "",
        item.guardianContact || "",
        item.dateOfAdmission || "",
        item.passOutDate || "",
        item.result || "",
        item.citizenship || "",
        item.residencyStatus || "",
        item.motherTongue || "",
        item.orphan || "No",
        item.refugee || "No"
      ];
      csvContent += row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",") + "\r\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "students_export_" + Date.now() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (format === "xls") {
    let htmlText = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>";
    htmlText += "<head><meta charset='UTF-8'><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Filtered Students</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>";
    htmlText += "<body><table border='1px'><tr style='background-color: #f1f5f9; font-weight: bold;'>";
    
    headers.forEach(h => {
      htmlText += "<th>" + h + "</th>";
    });
    htmlText += "</tr>";
    
    filteredList.forEach(item => {
      htmlText += "<tr>";
      htmlText += "<td>" + (item.studentId || "") + "</td>";
      htmlText += "<td>" + (item.name || "") + "</td>";
      htmlText += "<td>" + (item.schoolName || "") + "</td>";
      htmlText += "<td>" + (item.class || "") + "</td>";
      htmlText += "<td>" + (item.teacherName || "") + "</td>";
      htmlText += "<td>" + (item.gender || "") + "</td>";
      htmlText += "<td>" + (item.age || "") + "</td>";
      htmlText += "<td>" + (item.disability || "No") + "</td>";
      htmlText += "<td>" + (item.specify || "") + "</td>";
      htmlText += "<td>" + (item.guardianContact || "") + "</td>";
      htmlText += "<td>" + (item.dateOfAdmission || "") + "</td>";
      htmlText += "<td>" + (item.passOutDate || "") + "</td>";
      htmlText += "<td>" + (item.result || "") + "</td>";
      htmlText += "<td>" + (item.citizenship || "") + "</td>";
      htmlText += "<td>" + (item.residencyStatus || "") + "</td>";
      htmlText += "<td>" + (item.motherTongue || "") + "</td>";
      htmlText += "<td>" + (item.orphan || "No") + "</td>";
      htmlText += "<td>" + (item.refugee || "No") + "</td>";
      htmlText += "</tr>";
    });
    
    htmlText += "</table></body></html>";
    
    const blob = new Blob([htmlText], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "students_export_" + Date.now() + ".xls");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function renderStudentsTable() {
  const body = document.getElementById("students-table-body");
  const pagination = document.getElementById("students-pagination");
  if (!body || !pagination) return;
  
  // Save scroll positions
  const tableContainer = body.closest(".table-responsive");
  const tableScrollTop = tableContainer ? tableContainer.scrollTop : 0;
  const tableScrollLeft = tableContainer ? tableContainer.scrollLeft : 0;
  const pageScrollTop = window.scrollY || document.documentElement.scrollTop;
  
  const state = tableStates.students;
  const filteredStudents = await getFilteredStudentsList();
  
  // To get the total list count before filters are applied, but after teacher isolation
  let rawStudents = await studentService.getStudents();
  const teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  
  if (currentUser.role === "Teacher") {
    const activeTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
    if (activeTeacher) {
      const school = schools.find(s => s.schoolCode === activeTeacher.schoolId);
      if (school) {
        rawStudents = rawStudents.filter(s => s.schoolName === school.name);
      } else {
        rawStudents = [];
      }
    } else {
      rawStudents = [];
    }
  }
  const totalBeforeFilters = rawStudents.length;
  
  const { pageData, startIndex, endIndex, total, totalPages } = getPageData(filteredStudents, state);
  
  // Render Summary Text
  const summaryEl = document.getElementById("students-filter-summary");
  if (summaryEl) {
    summaryEl.textContent = "Showing " + total + " of " + totalBeforeFilters + " students";
  }
  
  // Render Chips
  const chipsBar = document.getElementById("students-chips-bar");
  if (chipsBar && currentUser.role === "Admin") {
    let chipsHTML = "";
    
    const filterLabels = {
      school: "School",
      teacherId: "Teacher",
      grade: "Grade",
      gender: "Gender",
      disability: "Disability",
      result: "Result",
      enrollmentStatus: "Enrollment",
      admissionYear: "Adm. Year",
      graduationYear: "Grad. Year",
      ageRange: "Age",
      orphan: "Orphan",
      refugee: "Refugee",
      citizenship: "Citizenship",
      residency: "Residency",
      motherTongue: "Tongue",
      speakUrdu: "Urdu",
      childLabor: "Labor",
      house: "House"
    };
    
    let activeChips = [];
    
    Object.keys(state.advanced).forEach(k => {
      const val = state.advanced[k];
      if (val !== "all") {
        let displayVal = val;
        if (k === "teacherId") {
          const teacher = teachers.find(t => t.teacherId === val);
          if (teacher) displayVal = teacher.name;
        } else if (k === "disability") {
          displayVal = val === "yes" ? "Has Disability" : "No Disability";
        } else if (k === "childLabor") {
          displayVal = val === "yes" ? "Yes" : "No";
        }
        
        activeChips.push(`
          <div class="filter-chip">
            <span>${escapeHtml(filterLabels[k] || k)}: ${escapeHtml(displayVal)}</span>
            <button type="button" class="filter-chip-remove" onclick="removeStudentFilter('${escapeHtml(k)}')">&times;</button>
          </div>
        `);
      }
    });
    
    if (activeChips.length > 0) {
      chipsHTML = `
        <div class="filter-chip-list">
          ${activeChips.join("")}
          <button type="button" class="btn btn-secondary btn-sm" onclick="clearAllStudentFilters()" style="padding: 0.2rem 0.65rem; font-size: 0.8rem; border-radius: 20px; font-weight: 500; height: 26px; display: inline-flex; align-items: center;">Clear Filters</button>
        </div>
      `;
      chipsBar.style.display = "flex";
    } else {
      chipsBar.style.display = "none";
      chipsBar.innerHTML = "";
    }
    
    if (chipsHTML) {
      chipsBar.innerHTML = chipsHTML;
    }
  }
  
  let html = "";
  pageData.forEach(student => {
    let actionButtons = "";
    if (currentUser.role === "Admin") {
      actionButtons = `
        <button class="btn-icon" onclick="viewStudentDetails('${escapeHtml(student.studentId)}')" title="View details"><i data-lucide="eye"></i></button>
        <button class="btn-icon" onclick="editStudentDetails('${escapeHtml(student.studentId)}')" title="Edit record"><i data-lucide="edit"></i></button>
        <button class="btn-icon btn-icon-danger" onclick="deleteStudentConfirm('${escapeHtml(student.studentId)}')" title="Delete record"><i data-lucide="trash-2"></i></button>
      `;
    } else {
      actionButtons = `
        <button class="btn-icon" onclick="viewStudentDetails('${escapeHtml(student.studentId)}')" title="View details"><i data-lucide="eye"></i></button>
        <button class="btn-icon" onclick="editStudentDetails('${escapeHtml(student.studentId)}')" title="Edit record"><i data-lucide="edit"></i></button>
      `;
    }
    
    html += `
      <tr>
        <td><strong>${escapeHtml(student.studentId)}</strong></td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.schoolName)}</td>
        <td>${escapeHtml(student.class)}</td>
        <td>${escapeHtml(student.teacherName)}</td>
        <td>${escapeHtml(student.gender)}</td>
        <td>${student.disability === "Yes" ? `<span class="badge badge-warning">${escapeHtml(student.specify)}</span>` : `<span class="badge badge-success">No</span>`}</td>
        <td>${escapeHtml(student.guardianContact)}</td>
        <td>
          <div class="table-actions">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  });
  
  if (total === 0) {
    html = `<tr><td colspan="9" style="text-align: center; padding: 2rem;">No students found matching your criteria.</td></tr>`;
  }
  body.innerHTML = html;
  
  pagination.innerHTML = renderPaginationHTML("students", startIndex, endIndex, total, totalPages, state);
  
  // Restore scroll positions
  if (tableContainer) {
    tableContainer.scrollTop = tableScrollTop;
    tableContainer.scrollLeft = tableScrollLeft;
  }
  window.scrollTo(0, pageScrollTop);
  
  // Bind pagination clicks
  const prevBtn = document.getElementById("students-prev-btn");
  const nextBtn = document.getElementById("students-next-btn");
  if (prevBtn) prevBtn.addEventListener("click", async () => { state.page--; await renderStudentsTable(); if (window.lucide) window.lucide.createIcons(); });
  if (nextBtn) nextBtn.addEventListener("click", async () => { state.page++; await renderStudentsTable(); if (window.lucide) window.lucide.createIcons(); });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
  initFloatingScrollbars();
}


window.removeStudentFilter = function(key) {
  tableStates.students.advanced[key] = "all";
  tableStates.students.page = 1;
  const idMap = {
    school: "flt-school",
    teacherId: "flt-teacher",
    grade: "flt-grade",
    gender: "flt-gender",
    disability: "flt-disability",
    result: "flt-result",
    enrollmentStatus: "flt-enroll-status",
    admissionYear: "flt-admission-year",
    graduationYear: "flt-graduation-year",
    ageRange: "flt-age-range",
    orphan: "flt-orphan",
    refugee: "flt-refugee",
    citizenship: "flt-citizenship",
    residency: "flt-residency",
    motherTongue: "flt-tongue",
    speakUrdu: "flt-speak-urdu",
    childLabor: "flt-child-labor",
    house: "flt-house"
  };
  const el = document.getElementById(idMap[key]);
  if (el) el.value = "all";
  updateFiltersBadge();
  renderStudentsTable();
};

window.clearAllStudentFilters = function() {
  const state = tableStates.students;
  Object.keys(state.advanced).forEach(k => {
    state.advanced[k] = "all";
  });
  state.search = "";
  state.page = 1;
  
  const selects = document.querySelectorAll(".advanced-filters-panel select");
  selects.forEach(sel => sel.value = "all");
  
  const searchInput = document.getElementById("students-search");
  if (searchInput) searchInput.value = "";
  
  updateFiltersBadge();
  renderStudentsTable();
};

window.updateFiltersBadge = function() {
  const state = tableStates.students;
  let activeFiltersCount = 0;
  Object.keys(state.advanced).forEach(k => {
    if (state.advanced[k] !== "all") activeFiltersCount++;
  });
  
  const toggleBtn = document.getElementById("btn-toggle-filters");
  if (toggleBtn) {
    toggleBtn.innerHTML = '<i data-lucide="sliders"></i> ' + (activeFiltersCount > 0 ? 'Filters (' + activeFiltersCount + ')' : 'Advanced Filters');
    if (window.lucide) window.lucide.createIcons();
  }
};


function bindStudentsPageEvents() {
  const searchInput = document.getElementById("students-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      tableStates.students.search = e.target.value;
      tableStates.students.page = 1;
      renderStudentsTable();
    });
  }
  
  const toggleBtn = document.getElementById("btn-toggle-filters");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const state = tableStates.students;
      state.showFiltersPanel = !state.showFiltersPanel;
      
      const panel = document.getElementById("students-filters-panel");
      if (panel) {
        panel.style.display = state.showFiltersPanel ? "grid" : "none";
      }
      
      toggleBtn.classList.toggle("active", state.showFiltersPanel);
      
      const activeFiltersCount = Object.keys(state.advanced).filter(k => state.advanced[k] !== "all").length;
      toggleBtn.innerHTML = '<i data-lucide="sliders"></i> ' + (activeFiltersCount > 0 ? 'Filters (' + activeFiltersCount + ')' : 'Advanced Filters');
      if (window.lucide) window.lucide.createIcons();
      
      setTimeout(initFloatingScrollbars, 20);
    });
  }
  
  // Bind export dropdown actions
  const exportBtn = document.getElementById("btn-export-students");
  const exportMenu = document.getElementById("export-dropdown-menu");
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = exportMenu.style.display === "none" || !exportMenu.style.display;
      exportMenu.style.display = isHidden ? "block" : "none";
    });
    
    document.addEventListener("click", () => {
      exportMenu.style.display = "none";
    });
  }
  
  // Bind change events to all 18 selects (if elements exist in DOM)
  const filterSelectIds = [
    { id: "flt-school", key: "school" },
    { id: "flt-teacher", key: "teacherId" },
    { id: "flt-grade", key: "grade" },
    { id: "flt-gender", key: "gender" },
    { id: "flt-disability", key: "disability" },
    { id: "flt-result", key: "result" },
    { id: "flt-enroll-status", key: "enrollmentStatus" },
    { id: "flt-admission-year", key: "admissionYear" },
    { id: "flt-graduation-year", key: "graduationYear" },
    { id: "flt-age-range", key: "ageRange" },
    { id: "flt-orphan", key: "orphan" },
    { id: "flt-refugee", key: "refugee" },
    { id: "flt-citizenship", key: "citizenship" },
    { id: "flt-residency", key: "residency" },
    { id: "flt-tongue", key: "motherTongue" },
    { id: "flt-speak-urdu", key: "speakUrdu" },
    { id: "flt-child-labor", key: "childLabor" },
    { id: "flt-house", key: "house" }
  ];
  
  filterSelectIds.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener("change", (e) => {
        tableStates.students.advanced[item.key] = e.target.value;
        tableStates.students.page = 1;
        updateFiltersBadge();
        renderStudentsTable();
      });
    }
  });
  
  window.exportFilteredStudents = exportFilteredStudents;
  
  renderStudentsTable();
}

async function viewStudentDetails(studentId) {
  const student = (await studentService.getStudents()).find(s => s.studentId === studentId);
  if (!student) return;
  const guardian = (await studentService.getGuardians()).find(g => g.guardianId === student.guardianId) || {};
  const teacher = (await teacherService.getTeachers()).find(t => t.teacherId === student.teacherId) || {};
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="details-modal-overlay">
      <div class="modal-drawer">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="user"></i>
            <span class="modal-title">Student Profile Detail</span>
          </div>
          <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <!-- General Info Section -->
          <div class="detail-section">
            <h4 class="detail-section-title">General Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Student ID</span><span class="detail-value">${escapeHtml(student.studentId)}</span></div>
              <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(student.name)}</span></div>
              <div class="detail-item"><span class="detail-label">B-Form Number</span><span class="detail-value">${escapeHtml(student.bFormNumber)}</span></div>
              <div class="detail-item"><span class="detail-label">Date of Birth</span><span class="detail-value">${escapeHtml(student.dateOfBirth)}</span></div>
              <div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">${escapeHtml(student.age)} years</span></div>
              <div class="detail-item"><span class="detail-label">Gender</span><span class="detail-value">${escapeHtml(student.gender)}</span></div>
            </div>
          </div>
          
          <!-- Academic Info Section -->
          <div class="detail-section">
            <h4 class="detail-section-title">Academic Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">School</span><span class="detail-value">${escapeHtml(student.schoolName)}</span></div>
              <div class="detail-item"><span class="detail-label">Class</span><span class="detail-value">${escapeHtml(student.class)}</span></div>
              <div class="detail-item"><span class="detail-label">Assigned Teacher</span><span class="detail-value">${escapeHtml(teacher.name || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Admission Date</span><span class="detail-value">${escapeHtml(student.dateOfAdmission)}</span></div>
              <div class="detail-item"><span class="detail-label">Pass-out Date</span><span class="detail-value">${escapeHtml(student.passOutDate || "Currently Enrolled")}</span></div>
              <div class="detail-item"><span class="detail-label">Result</span><span class="detail-value"><span class="badge ${escapeHtml(student.result.toLowerCase() === 'pass' ? 'badge-success' : (student.result.toLowerCase() === 'fail' ? 'badge-danger' : 'badge-warning'))}">${escapeHtml(student.result)}</span></span></div>
            </div>
          </div>
          
          <!-- Personal Info Section -->
          <div class="detail-section">
            <h4 class="detail-section-title">Personal Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Orphan</span><span class="detail-value">${escapeHtml(student.orphan)}</span></div>
              <div class="detail-item"><span class="detail-label">Disability</span><span class="detail-value">${escapeHtml(student.disability)}</span></div>
              <div class="detail-item"><span class="detail-label">Disability Type</span><span class="detail-value">${escapeHtml(student.specify || "None")}</span></div>
              <div class="detail-item"><span class="detail-label">Refugee</span><span class="detail-value">${escapeHtml(student.refugee)}</span></div>
              <div class="detail-item"><span class="detail-label">Child In Labor</span><span class="detail-value">${escapeHtml(student.childInLabor || "None")}</span></div>
              <div class="detail-item"><span class="detail-label">Mother Tongue</span><span class="detail-value">${escapeHtml(student.motherTongue)}</span></div>
              <div class="detail-item"><span class="detail-label">Can Speak Urdu</span><span class="detail-value">${escapeHtml(student.canUnderstandUrdu)}</span></div>
              <div class="detail-item"><span class="detail-label">Citizenship</span><span class="detail-value">${escapeHtml(student.citizenship)}</span></div>
              <div class="detail-item"><span class="detail-label">Residency Status</span><span class="detail-value">${escapeHtml(student.residencyStatus)}</span></div>
              <div class="detail-item"><span class="detail-label">House Ownership</span><span class="detail-value">${escapeHtml(student.house)}</span></div>
            </div>
          </div>
          
          <!-- Guardian Info Section -->
          <div class="detail-section">
            <h4 class="detail-section-title">Guardian Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Guardian Name</span><span class="detail-value">${escapeHtml(guardian.name || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Guardian CNIC</span><span class="detail-value">${escapeHtml(guardian.cnic || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Guardian Contact</span><span class="detail-value">${escapeHtml(guardian.contactNo || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Guardian Occupation</span><span class="detail-value">${escapeHtml(guardian.occupation || "N/A")}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("details-modal-overlay");
  setTimeout(() => {
    overlay.classList.add("active");
  }, 10);
  
  if (window.lucide) window.lucide.createIcons();
}

async function editStudentDetails(studentId) {
  const student = (await studentService.getStudents()).find(s => s.studentId === studentId);
  if (!student) return;
  
  // Security guard for teacher role
  if (currentUser.role === "Teacher") {
    const activeTeacher = (await teacherService.getTeachers()).find(t => t.teacherId === currentUser.teacherId);
    const teacherSchool = (await schoolService.getSchools()).find(s => s.schoolCode === activeTeacher?.schoolId);
    if (!teacherSchool || student.schoolName !== teacherSchool.name) {
      alert("Access Denied: You can only edit students belonging to your own school.");
      return;
    }
  }

  const guardian = (await studentService.getGuardians()).find(g => g.guardianId === student.guardianId) || {};
  const teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  const isAdmin = currentUser.role === "Admin";
  
  let schoolFieldHTML = "";
  let teacherFieldHTML = "";
  
  if (isAdmin) {
    schoolFieldHTML = `
      <div class="form-group">
        <label class="form-label">School Name</label>
        <select id="edit-std-school" class="form-control" required>
          ${schools.map(s => `<option value="${escapeHtml(s.name)}" ${escapeHtml(student.schoolName === s.name ? "selected" : "")}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
    `;
    teacherFieldHTML = `
      <div class="form-group">
        <label class="form-label">Teacher</label>
        <select id="edit-std-teacher" class="form-control" required>
          ${teachers.map(t => `<option value="${escapeHtml(t.teacherId)}" ${escapeHtml(student.teacherId === t.teacherId ? "selected" : "")}>${escapeHtml(t.name)}</option>`).join("")}
        </select>
      </div>
    `;
  } else {
    schoolFieldHTML = `
      <div class="form-group">
        <label class="form-label">School Name</label>
        <input type="text" class="form-control" value="${escapeHtml(student.schoolName)}" readonly>
        <select id="edit-std-school" class="form-control" style="display:none;" required>
          <option value="${escapeHtml(student.schoolName)}" selected>${escapeHtml(student.schoolName)}</option>
        </select>
      </div>
    `;
    teacherFieldHTML = `
      <input type="hidden" id="edit-std-teacher" value="${escapeHtml(student.teacherId)}">
    `;
  }
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="edit-modal-overlay">
      <div class="modal-drawer" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="edit"></i>
            <span class="modal-title">Edit Student Details</span>
          </div>
          <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <form id="edit-student-form" style="display: flex; flex-direction: column; height: calc(100% - 70px);">
          <div class="modal-body" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
            
            <div class="detail-section">
              <h4 class="detail-section-title">Student Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" id="edit-std-name" class="form-control" value="${escapeHtml(student.name)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">B-Form Number</label>
                  <input type="text" id="edit-std-bform" class="form-control" value="${escapeHtml(student.bFormNumber)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" id="edit-std-dob" class="form-control" value="${escapeHtml(student.dateOfBirth)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select id="edit-std-gender" class="form-control" required>
                    <option value="Male" ${escapeHtml(student.gender === "Male" ? "selected" : "")}>Male</option>
                    <option value="Female" ${escapeHtml(student.gender === "Female" ? "selected" : "")}>Female</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">School Placement</h4>
              <div class="form-grid">
                ${schoolFieldHTML}
                <div class="form-group">
                  <label class="form-label">Class</label>
                  <select id="edit-std-class" class="form-control" required>
                    <option value="Prep" ${escapeHtml(student.class === "Prep" ? "selected" : "")}>Prep</option>
                    <option value="Grade 1" ${escapeHtml(student.class === "Grade 1" ? "selected" : "")}>Grade 1</option>
                    <option value="Grade 2" ${escapeHtml(student.class === "Grade 2" ? "selected" : "")}>Grade 2</option>
                    <option value="Grade 3" ${escapeHtml(student.class === "Grade 3" ? "selected" : "")}>Grade 3</option>
                    <option value="Grade 4" ${escapeHtml(student.class === "Grade 4" ? "selected" : "")}>Grade 4</option>
                    <option value="Grade 5" ${escapeHtml(student.class === "Grade 5" ? "selected" : "")}>Grade 5</option>
                    <option value="Graduated" ${escapeHtml(student.class === "Graduated" ? "selected" : "")}>Graduated</option>
                  </select>
                </div>
                ${teacherFieldHTML}
                <div class="form-group">
                  <label class="form-label">Admission Date</label>
                  <input type="date" id="edit-std-admdate" class="form-control" value="${escapeHtml(student.dateOfAdmission)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Pass-out Date</label>
                  <input type="date" id="edit-std-passdate" class="form-control" value="${escapeHtml(student.passOutDate || "")}">
                </div>
                <div class="form-group">
                  <label class="form-label">Academic Result</label>
                  <select id="edit-std-result" class="form-control" required>
                    <option value="Pass" ${escapeHtml(student.result === "Pass" ? "selected" : "")}>Pass</option>
                    <option value="Fail" ${escapeHtml(student.result === "Fail" ? "selected" : "")}>Fail</option>
                    <option value="Dropout" ${escapeHtml(student.result === "Dropout" ? "selected" : "")}>Dropout</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Personal Characteristics</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Orphan</label>
                  <select id="edit-std-orphan" class="form-control">
                    <option value="Yes" ${escapeHtml(student.orphan === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(student.orphan === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Disability</label>
                  <select id="edit-std-disability" class="form-control">
                    <option value="Yes" ${escapeHtml(student.disability === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(student.disability === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Disability Specify</label>
                  <select id="edit-std-specify" class="form-control">
                    <option value="None" ${escapeHtml(student.specify === "None" ? "selected" : "")}>None</option>
                    <option value="Physical" ${escapeHtml(student.specify === "Physical" ? "selected" : "")}>Physical</option>
                    <option value="Mental" ${escapeHtml(student.specify === "Mental" ? "selected" : "")}>Mental</option>
                    <option value="Hearing" ${escapeHtml(student.specify === "Hearing" ? "selected" : "")}>Hearing</option>
                    <option value="Visual" ${escapeHtml(student.specify === "Visual" ? "selected" : "")}>Visual</option>
                    <option value="Speech" ${escapeHtml(student.specify === "Speech" ? "selected" : "")}>Speech</option>
                    <option value="Intellectual" ${escapeHtml(student.specify === "Intellectual" ? "selected" : "")}>Intellectual</option>
                    <option value="Multiple" ${escapeHtml(student.specify === "Multiple" ? "selected" : "")}>Multiple</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Refugee</label>
                  <select id="edit-std-refugee" class="form-control">
                    <option value="Yes" ${escapeHtml(student.refugee === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(student.refugee === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Child In Labor</label>
                  <input type="text" id="edit-std-labor" class="form-control" value="${escapeHtml(student.childInLabor || "None")}">
                </div>
                <div class="form-group">
                  <label class="form-label">Mother Tongue</label>
                  <select id="edit-std-tongue" class="form-control">
                    <option value="Urdu" ${escapeHtml(student.motherTongue === "Urdu" ? "selected" : "")}>Urdu</option>
                    <option value="Pashto" ${escapeHtml(student.motherTongue === "Pashto" ? "selected" : "")}>Pashto</option>
                    <option value="Punjabi" ${escapeHtml(student.motherTongue === "Punjabi" ? "selected" : "")}>Punjabi</option>
                    <option value="Sindhi" ${escapeHtml(student.motherTongue === "Sindhi" ? "selected" : "")}>Sindhi</option>
                    <option value="Balochi" ${escapeHtml(student.motherTongue === "Balochi" ? "selected" : "")}>Balochi</option>
                    <option value="Saraiki" ${escapeHtml(student.motherTongue === "Saraiki" ? "selected" : "")}>Saraiki</option>
                    <option value="Hindko" ${escapeHtml(student.motherTongue === "Hindko" ? "selected" : "")}>Hindko</option>
                    <option value="Brahui" ${escapeHtml(student.motherTongue === "Brahui" ? "selected" : "")}>Brahui</option>
                    <option value="Shina" ${escapeHtml(student.motherTongue === "Shina" ? "selected" : "")}>Shina</option>
                    <option value="Kashmiri" ${escapeHtml(student.motherTongue === "Kashmiri" ? "selected" : "")}>Kashmiri</option>
                    <option value="English" ${escapeHtml(student.motherTongue === "English" ? "selected" : "")}>English</option>
                    <option value="Other" ${escapeHtml(student.motherTongue === "Other" ? "selected" : "")}>Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Can understand Urdu</label>
                  <select id="edit-std-urdu" class="form-control">
                    <option value="Yes" ${escapeHtml(student.canUnderstandUrdu === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(student.canUnderstandUrdu === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Citizenship</label>
                  <select id="edit-std-citizenship" class="form-control">
                    <option value="Pakistani" ${escapeHtml(student.citizenship === "Pakistani" ? "selected" : "")}>Pakistani</option>
                    <option value="Refugee" ${escapeHtml(student.citizenship === "Refugee" ? "selected" : "")}>Refugee</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Residency Status</label>
                  <select id="edit-std-residency" class="form-control">
                    <option value="Permanent" ${escapeHtml(student.residencyStatus === "Permanent" ? "selected" : "")}>Permanent</option>
                    <option value="Temporary" ${escapeHtml(student.residencyStatus === "Temporary" ? "selected" : "")}>Temporary</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">House Ownership</label>
                  <select id="edit-std-house" class="form-control">
                    <option value="Owned" ${escapeHtml(student.house === "Owned" ? "selected" : "")}>Owned</option>
                    <option value="Rented" ${escapeHtml(student.house === "Rented" ? "selected" : "")}>Rented</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Guardian Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Guardian Name</label>
                  <input type="text" id="edit-grd-name" class="form-control" value="${escapeHtml(guardian.name || "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Guardian CNIC</label>
                  <input type="text" id="edit-grd-cnic" class="form-control" value="${escapeHtml(guardian.cnic || "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Guardian Contact</label>
                  <input type="text" id="edit-grd-contact" class="form-control" value="${escapeHtml(guardian.contactNo || "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Guardian Occupation</label>
                  <input type="text" id="edit-grd-occ" class="form-control" value="${escapeHtml(guardian.occupation || "")}" required>
                </div>
              </div>
            </div>
            
          </div>
          <div class="form-actions-footer" style="padding: 1rem 1.5rem; background-color: var(--bg-app); border-top: 1px solid var(--border);">
            <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("edit-modal-overlay");
  setTimeout(() => {
    overlay.classList.add("active");
  }, 10);
  
  if (window.lucide) window.lucide.createIcons();
  
  // Submit action
  const form = document.getElementById("edit-student-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Only the edited fields are sent - PUT /students/:id and PUT /guardians/:id.
    const updatedStudent = {
      name: document.getElementById("edit-std-name").value.trim(),
      bFormNumber: document.getElementById("edit-std-bform").value.trim(),
      dateOfBirth: document.getElementById("edit-std-dob").value,
      age: calculateAge(document.getElementById("edit-std-dob").value),
      gender: document.getElementById("edit-std-gender").value,
      schoolName: document.getElementById("edit-std-school").value,
      class: document.getElementById("edit-std-class").value,
      teacherId: document.getElementById("edit-std-teacher").value,
      dateOfAdmission: document.getElementById("edit-std-admdate").value,
      passOutDate: document.getElementById("edit-std-passdate").value,
      result: document.getElementById("edit-std-result").value,
      orphan: document.getElementById("edit-std-orphan").value,
      disability: document.getElementById("edit-std-disability").value,
      specify: document.getElementById("edit-std-specify").value,
      refugee: document.getElementById("edit-std-refugee").value,
      childInLabor: document.getElementById("edit-std-labor").value.trim(),
      motherTongue: document.getElementById("edit-std-tongue").value,
      canUnderstandUrdu: document.getElementById("edit-std-urdu").value,
      citizenship: document.getElementById("edit-std-citizenship").value,
      residencyStatus: document.getElementById("edit-std-residency").value,
      house: document.getElementById("edit-std-house").value
    };
    
    try {
      await studentService.updateStudent(studentId, updatedStudent);
      if (student.guardianId) {
        await studentService.updateGuardian(student.guardianId, {
          name: document.getElementById("edit-grd-name").value.trim(),
          cnic: document.getElementById("edit-grd-cnic").value.trim(),
          contactNo: document.getElementById("edit-grd-contact").value.trim(),
          occupation: document.getElementById("edit-grd-occ").value.trim()
        });
      }
    } catch (err) {
      showAlert(describeApiError(err, "Could not update the student."), "danger");
      return;
    }
    
    closeEditModal();
    renderStudentsTable();
    showAlert("Student record updated successfully!");
  });
}

function calculateAge(dobString) {
  if (!dobString) return 0;
  const birth = new Date(dobString);
  const diff = Date.now() - birth.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

async function deleteStudentConfirm(studentId) {
  const student = (await studentService.getStudents()).find(s => s.studentId === studentId);
  if (!student) return;
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay-center" id="delete-modal-overlay">
      <div class="modal-center">
        <div class="modal-header" style="background-color: var(--danger-light); color: var(--danger);">
          <div class="modal-title-wrapper">
            <i data-lucide="alert-triangle"></i>
            <span class="modal-title">Delete Student Record</span>
          </div>
          <button class="modal-close" onclick="closeDeleteModal()" style="color: var(--danger);">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
            Are you sure you want to delete the record for <strong>${escapeHtml(student.name)}</strong> (${escapeHtml(student.studentId)})? 
            This action cannot be undone and will also delete their attendance and guardian records.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
            <button class="btn btn-danger" onclick="executeDeleteStudent('${escapeHtml(student.studentId)}')">Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("delete-modal-overlay");
  setTimeout(() => {
    overlay.classList.add("active");
  }, 10);
  
  if (window.lucide) window.lucide.createIcons();
}

async function executeDeleteStudent(studentId) {
  try {
    await studentService.deleteStudent(studentId);
  } catch (err) {
    showAlert(describeApiError(err, "Could not delete the student."), "danger");
    return;
  }
  closeDeleteModal();
  renderStudentsTable();
  showAlert("Student record deleted.", "danger");
}

window.viewStudentDetails = viewStudentDetails;
window.editStudentDetails = editStudentDetails;
window.deleteStudentConfirm = deleteStudentConfirm;
window.executeDeleteStudent = executeDeleteStudent;
window.exportFilteredStudents = exportFilteredStudents;
