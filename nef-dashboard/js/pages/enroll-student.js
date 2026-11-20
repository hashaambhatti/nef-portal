let enrollCurrentStep = 1;

async function getEnrollStudentTemplate() {
  const schools = await schoolService.getSchools();
  const teachers = await teacherService.getTeachers();
  const isAdmin = currentUser.role === "Admin";
  
  enrollCurrentStep = 1; // reset step
  
  let schoolFieldHTML = "";
  let teacherFieldHTML = "";
  
  if (isAdmin) {
    schoolFieldHTML = `
      <div class="form-group">
        <label class="form-label">School Name</label>
        <select id="enr-school" class="form-control" required>
          ${schools.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
    `;
    teacherFieldHTML = `
      <div class="form-group">
        <label class="form-label">Teacher In-Charge</label>
        <select id="enr-teacher" class="form-control" required>
          ${teachers.map(t => `<option value="${escapeHtml(t.teacherId)}">${escapeHtml(t.name)}</option>`).join("")}
        </select>
      </div>
    `;
  } else {
    const activeTeacher = teachers.find(t => t.teacherId === currentUser.teacherId);
    const teacherSchool = schools.find(s => s.schoolCode === activeTeacher?.schoolId);
    const schoolName = teacherSchool ? teacherSchool.name : "";
    
    schoolFieldHTML = `
      <div class="form-group">
        <label class="form-label">School Name</label>
        <input type="text" class="form-control" value="${escapeHtml(schoolName)}" readonly>
        <select id="enr-school" class="form-control" style="display:none;" required>
          <option value="${escapeHtml(schoolName)}" selected>${escapeHtml(schoolName)}</option>
        </select>
      </div>
    `;
    // Teachers must never manually choose the Teacher ID when enrolling a student.
    // The Teacher field should be hidden for teachers and automatically assigned using the logged-in teacher's account.
    teacherFieldHTML = `
      <input type="hidden" id="enr-teacher" value="${escapeHtml(currentUser.teacherId)}">
    `;
  }
  
  return `
    <div class="section-card form-card">
      <div class="section-header">
        <h3 class="section-title">New Student Enrollment Form</h3>
      </div>
      
      <!-- Multi-step Form Wizard tabs -->
      <div class="form-step-header">
        <div class="step-indicator active" id="step-ind-1" onclick="switchEnrollStep(1)">1. Student Information</div>
        <div class="step-indicator" id="step-ind-2" onclick="switchEnrollStep(2)">2. Guardian Information</div>
      </div>
      
      <form id="enrollment-form">
        <!-- Section 1 - Student Information -->
        <div class="form-step-container" id="enroll-step-1">
          <h4 class="form-section-title">Personal Details</h4>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="enr-name" class="form-control" placeholder="Ali Raza" required>
            </div>
            <div class="form-group">
              <label class="form-label">B-Form Number</label>
              <input type="text" id="enr-bform" class="form-control" placeholder="13 digit unique number" required>
            </div>
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" id="enr-dob" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="enr-gender" class="form-control" required>
                <option value="Male" selected>Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          
          <h4 class="form-section-title">School Placement</h4>
          <div class="form-grid">
            ${schoolFieldHTML}
            <div class="form-group">
              <label class="form-label">Class</label>
              <select id="enr-class" class="form-control" required>
                <option value="Prep" selected>Prep</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
              </select>
            </div>
            ${teacherFieldHTML}
            <div class="form-group">
              <label class="form-label">Admission Date</label>
              <input type="date" id="enr-admdate" class="form-control" value="${escapeHtml(new Date().toISOString().split("T")[0])}" required>
            </div>
          </div>
          
          <h4 class="form-section-title">Demographics & House Context</h4>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Orphan Status</label>
              <select id="enr-orphan" class="form-control">
                <option value="No" selected>No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Disability</label>
              <select id="enr-disability" class="form-control" onchange="toggleDisabilitySelect()">
                <option value="No" selected>No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Disability Type (If any)</label>
              <select id="enr-specify" class="form-control" disabled>
                <option value="None" selected>None</option>
                <option value="Physical">Physical</option>
                <option value="Mental">Mental</option>
                <option value="Hearing">Hearing</option>
                <option value="Visual">Visual</option>
                <option value="Speech">Speech</option>
                <option value="Intellectual">Intellectual</option>
                <option value="Multiple">Multiple</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Refugee</label>
              <select id="enr-refugee" class="form-control">
                <option value="No" selected>No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Child In Labor (Leave empty if none)</label>
              <input type="text" id="enr-labor" class="form-control" placeholder="e.g. workshop assistant">
            </div>
            <div class="form-group">
              <label class="form-label">Mother Tongue</label>
              <select id="enr-tongue" class="form-control">
                <option value="Urdu" selected>Urdu</option>
                <option value="Pashto">Pashto</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Sindhi">Sindhi</option>
                <option value="Balochi">Balochi</option>
                <option value="Saraiki">Saraiki</option>
                <option value="Hindko">Hindko</option>
                <option value="Brahui">Brahui</option>
                <option value="Shina">Shina</option>
                <option value="Kashmiri">Kashmiri</option>
                <option value="English">English</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Can Speak & Understand Urdu</label>
              <select id="enr-urdu" class="form-control">
                <option value="Yes" selected>Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Citizenship</label>
              <select id="enr-citizenship" class="form-control">
                <option value="Pakistani" selected>Pakistani</option>
                <option value="Refugee">Refugee</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Residency Status</label>
              <select id="enr-residency" class="form-control">
                <option value="Permanent" selected>Permanent</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">House Ownership</label>
              <select id="enr-house" class="form-control">
                <option value="Owned" selected>Owned</option>
                <option value="Rented">Rented</option>
              </select>
            </div>
          </div>
          
          <div class="form-actions-footer">
            <div></div>
            <button type="button" class="btn btn-primary" onclick="switchEnrollStep(2)">
              Continue <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>
        
        <!-- Section 2 - Guardian Information -->
        <div class="form-step-container" id="enroll-step-2" style="display: none;">
          <h4 class="form-section-title">Guardian Information</h4>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Guardian Name</label>
              <input type="text" id="enr-grd-name" class="form-control" placeholder="Father or Mother name" required>
            </div>
            <div class="form-group">
              <label class="form-label">CNIC Number</label>
              <input type="text" id="enr-grd-cnic" class="form-control" placeholder="13 digits CNIC" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input type="text" id="enr-grd-contact" class="form-control" placeholder="0300-1234567" required>
            </div>
            <div class="form-group">
              <label class="form-label">Occupation</label>
              <input type="text" id="enr-grd-occupation" class="form-control" placeholder="Shopkeeper, Farmer, etc." required>
            </div>
          </div>
          
          <div class="form-actions-footer">
            <button type="button" class="btn btn-secondary" onclick="switchEnrollStep(1)">
              <i data-lucide="arrow-left"></i> Back
            </button>
            <button type="submit" class="btn btn-primary">
              <i data-lucide="user-check"></i> Enroll Student
            </button>
          </div>
        </div>
      </form>
    </div>
  `;
}

function toggleDisabilitySelect() {
  const disability = document.getElementById("enr-disability").value;
  const specSelect = document.getElementById("enr-specify");
  if (!specSelect) return;

  if (disability === "Yes") {
    specSelect.removeAttribute("disabled");
  } else {
    specSelect.value = "None";
    specSelect.setAttribute("disabled", "true");
  }
}
window.toggleDisabilitySelect = toggleDisabilitySelect;

function switchEnrollStep(step) {
  const step1 = document.getElementById("enroll-step-1");
  const step2 = document.getElementById("enroll-step-2");
  const ind1 = document.getElementById("step-ind-1");
  const ind2 = document.getElementById("step-ind-2");

  if (!step1 || !step2) return;

  // Basic validation before going to step 2
  if (step === 2 && enrollCurrentStep === 1) {
    const requiredInputs = step1.querySelectorAll("[required]");
    let valid = true;
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = "var(--danger)";
      } else {
        input.style.borderColor = "var(--border)";
      }
    });

    if (!valid) {
      alert("Please fill in all required fields on this page first.");
      return;
    }
  }

  enrollCurrentStep = step;
  if (step === 1) {
    step1.style.display = "block";
    step2.style.display = "none";
    ind1.classList.add("active");
    ind2.classList.remove("active");
  } else {
    step1.style.display = "none";
    step2.style.display = "block";
    ind1.classList.remove("active");
    ind2.classList.add("active");
    ind1.classList.add("completed");
  }

  if (window.lucide) window.lucide.createIcons();
}
window.switchEnrollStep = switchEnrollStep;

async function bindEnrollStudentEvents() {
  const form = document.getElementById("enrollment-form");
  if (!form) return;
  
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const dob = document.getElementById("enr-dob").value;
    const age = calculateAge(dob);
    
    // Guardian details
    const newGuardian = {
      name: document.getElementById("enr-grd-name").value.trim(),
      cnic: document.getElementById("enr-grd-cnic").value.trim(),
      contactNo: document.getElementById("enr-grd-contact").value.trim(),
      occupation: document.getElementById("enr-grd-occupation").value.trim()
    };
    
    // Student Details
    const newStudent = {
      name: document.getElementById("enr-name").value.trim(),
      bFormNumber: document.getElementById("enr-bform").value.trim(),
      dateOfBirth: dob,
      age: age,
      teacherId: document.getElementById("enr-teacher").value,
      schoolName: document.getElementById("enr-school").value,
      class: document.getElementById("enr-class").value.trim(),
      dateOfAdmission: document.getElementById("enr-admdate").value,
      gender: document.getElementById("enr-gender").value,
      orphan: document.getElementById("enr-orphan").value,
      disability: document.getElementById("enr-disability").value,
      specify: document.getElementById("enr-specify").value,
      passOutDate: "",
      result: "Pass", // Default result
      refugee: document.getElementById("enr-refugee").value,
      childInLabor: document.getElementById("enr-labor").value.trim() || "None",
      motherTongue: document.getElementById("enr-tongue").value,
      canUnderstandUrdu: document.getElementById("enr-urdu").value,
      citizenship: document.getElementById("enr-citizenship").value,
      residencyStatus: document.getElementById("enr-residency").value,
      house: document.getElementById("enr-house").value,
      guardian: newGuardian
    };
    
    // One call: the server creates the guardian and the student, generates
    // their ids and updates the school's student count in one transaction.
    let created;
    try {
      created = await studentService.createStudent(newStudent);
    } catch (err) {
      showAlert(describeApiError(err, "Could not enroll the student."), "danger");
      return;
    }
    
    showAlert(`Student ${created.name} enrolled successfully with ID ${created.studentId}!`);
    
    // Redirect to Students Database Page
    setTimeout(() => {
      if (currentUser.role === "Admin") {
        window.location.hash = "#admin-students";
      } else {
        window.location.hash = "#teacher-students";
      }
    }, 1000);
  });
}

