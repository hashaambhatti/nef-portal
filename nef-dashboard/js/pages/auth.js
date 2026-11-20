function getLoginTemplate() {
  return `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="graduation-cap"></i>
          </div>
          <h1 class="auth-title">School Info System</h1>
          <p class="auth-subtitle">Log in to manage your school database</p>
        </div>
        
        <form id="login-form">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Address</label>
            <input type="email" id="login-email" class="form-control" placeholder="admin@nef.gov.pk" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            <i data-lucide="log-in"></i> Log In
          </button>
        </form>
        
        <div class="auth-divider">
          <span>or</span>
        </div>
        
        <div class="auth-footer">
          Don't have an account? <a href="#signup" class="auth-link">Sign Up</a><br>
          <a href="#" id="forgot-password" class="auth-link" style="margin-top: 0.5rem; display: inline-block; font-size: 0.8rem;">Forgot Password?</a>
        </div>
      </div>
    </div>
  `;
}

async function bindLoginEvents() {
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      // POST /auth/login - stores the JWT and the user (incl. teacherId).
      const user = await authService.login(email, password);
      window.location.hash = user.role === "Admin" ? "#admin-dashboard" : "#teacher-dashboard";
    } catch (err) {
      alert(describeApiError(err, "Invalid email or password."));
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  const forgotBtn = document.getElementById("forgot-password");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Please contact your organization's Admin to reset your password.");
    });
  }
}

async function getSignupTemplate() {
  let schools = [];
  try {
    schools = await schoolService.getPublicSchools();
  } catch (err) {
    schools = [];
  }
  return `
    <div class="auth-wrapper">
      <div class="auth-card" id="signup-card" style="transition: max-width 0.3s ease;">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="graduation-cap"></i>
          </div>
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Teacher registration for the National Education Foundation portal</p>
        </div>
        
        <form id="signup-form">
          <h4 class="form-section-title" style="font-size: 0.95rem; margin-bottom: 0.75rem; border-left-width: 3px;">Account Information</h4>
          <div class="form-grid">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" for="signup-name">Full Name</label>
              <input type="text" id="signup-name" class="form-control" placeholder="Zahid Mahmood" required>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" for="signup-email">Email Address</label>
              <input type="email" id="signup-email" class="form-control" placeholder="zahid@nef.gov.pk" required>
            </div>
          </div>
          
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">
            Self-registration is for teachers. Admin accounts are created by an existing Admin.
          </p>

          <!-- Teacher Enrollment Fields (Visible when Role is Teacher) -->
          <div id="teacher-enroll-fields" style="display: block;">
            <h4 class="form-section-title" style="font-size: 0.95rem; margin-bottom: 0.75rem; margin-top: 1rem; border-left-width: 3px;">Teacher Profile Enrollment</h4>
            
            <div class="form-grid">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-cnic">CNIC (13 digits)</label>
                <input type="text" id="signup-cnic" class="form-control" placeholder="3740512345678" maxlength="13">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-contact">Contact Number</label>
                <input type="text" id="signup-contact" class="form-control" placeholder="+92 333 1234567">
              </div>
              <div class="form-group" style="grid-column: span 2; margin-bottom: 1rem;">
                <label class="form-label" for="signup-school">School Assignment</label>
                <select id="signup-school" class="form-control" required>
                  ${schools.length ? "" : `<option value="">No schools available - contact your Admin</option>`}
                  ${schools.map(s => `<option value="${escapeHtml(s.schoolCode)}">${escapeHtml(s.name)}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-qualification">Qualification</label>
                <select id="signup-qualification" class="form-control">
                  <option value="Matric Science">Matric Science</option>
                  <option value="Matric Humanities">Matric Humanities</option>
                  <option value="Intermediate Science">Intermediate Science</option>
                  <option value="Intermediate Humanities">Intermediate Humanities</option>
                  <option value="14 years graduation">14 years graduation</option>
                  <option value="16 years masters in science" selected>16 years masters in science</option>
                  <option value="16 years masters in other subject">16 years masters in other subject</option>
                  <option value="MPhil">MPhil</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-prof-qualification">Professional Qualification</label>
                <select id="signup-prof-qualification" class="form-control">
                  <option value="B.Ed" selected>B.Ed</option>
                  <option value="M.Ed">M.Ed</option>
                  <option value="Certificate in ECE">Certificate in ECE</option>
                  <option value="other teaching certification">other teaching certification</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div class="form-grid form-grid-3">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-joining">Date of Joining</label>
                <input type="date" id="signup-joining" class="form-control">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-training-date">Last Training Taken</label>
                <input type="date" id="signup-training-date" class="form-control">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-training-count">Trainings Attended</label>
                <input type="number" id="signup-training-count" class="form-control" min="0" value="0">
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-android">Android Phone</label>
                <select id="signup-android" class="form-control">
                  <option value="Yes" selected>Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-internet">Internet Access</label>
                <select id="signup-internet" class="form-control">
                  <option value="Yes" selected>Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <h4 class="form-section-title" style="font-size: 0.95rem; margin-bottom: 0.75rem; margin-top: 1rem; border-left-width: 3px;">Bank & Account Details</h4>
            <div class="form-grid form-grid-3">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-bank">Bank Name</label>
                <input type="text" id="signup-bank" class="form-control" placeholder="Habib Bank Ltd">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-acc">Account Number</label>
                <input type="text" id="signup-acc" class="form-control" placeholder="1234567890123">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" for="signup-iban">IBAN</label>
                <input type="text" id="signup-iban" class="form-control" placeholder="PK73HABB001234567890123">
              </div>
            </div>
          </div>
          
          <div class="form-row" style="margin-top: 1rem;">
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" for="signup-password">Password</label>
              <input type="password" id="signup-password" class="form-control" placeholder="Min 8 characters, letters + digits" minlength="8" required>
            </div>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" for="signup-confirm">Confirm Password</label>
              <input type="password" id="signup-confirm" class="form-control" placeholder="••••••••" required>
            </div>
          </div>
          
          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">
            <i data-lucide="user-plus"></i> Sign Up
          </button>
        </form>
        
        <div class="auth-divider">
          <span>or</span>
        </div>
        
        <div class="auth-footer">
          Already have an account? <a href="#login" class="auth-link">Log In</a>
        </div>
      </div>
    </div>
  `;
}

async function bindSignupEvents() {
  const form = document.getElementById("signup-form");
  const card = document.getElementById("signup-card");
  if (card) card.style.maxWidth = "750px";

  // Teacher profile fields that must be filled in.
  ["signup-cnic", "signup-contact", "signup-bank", "signup-acc", "signup-iban", "signup-joining"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("required", "true");
  });

  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      alert("Password must be at least 8 characters and contain letters and digits.");
      return;
    }

    const teacherProfile = {
      cnic: document.getElementById("signup-cnic").value.trim(),
      contactNo: document.getElementById("signup-contact").value.trim(),
      schoolId: document.getElementById("signup-school").value,
      qualification: document.getElementById("signup-qualification").value,
      professionalQualification: document.getElementById("signup-prof-qualification").value,
      dateOfJoining: document.getElementById("signup-joining").value || new Date().toISOString().split("T")[0],
      lastTrainingTaken: document.getElementById("signup-training-date").value,
      noOfTrainingsAttended: parseInt(document.getElementById("signup-training-count").value) || 0,
      androidPhone: document.getElementById("signup-android").value,
      internetAccess: document.getElementById("signup-internet").value,
      bankAccountNo: document.getElementById("signup-acc").value.trim(),
      bankName: document.getElementById("signup-bank").value.trim(),
      iban: document.getElementById("signup-iban").value.trim()
    };

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      // One call: the server creates the teacher profile, the account and
      // updates the school's teacher count in a single transaction.
      await authService.signup({ name, email, password, teacherProfile });
      const user = await authService.login(email, password);
      window.location.hash = user.role === "Admin" ? "#admin-dashboard" : "#teacher-dashboard";
    } catch (err) {
      alert(describeApiError(err, "Registration failed."));
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
