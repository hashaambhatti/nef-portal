async function getProfileTemplate() {
  const isAdmin = currentUser.role === "Admin";
  let html = "";
  
  if (isAdmin) {
    html = `
      <div class="profile-card">
        <div class="profile-avatar-large">
          ${escapeHtml(currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase())}
        </div>
        <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(currentUser.name)}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">${escapeHtml(currentUser.role)} Account</p>
        
        <div class="profile-details-list">
          <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
            <span style="color: var(--text-secondary); font-weight: 500;">Email Address</span>
            <strong style="color: var(--text-primary);">${escapeHtml(currentUser.email)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.95rem;">
            <span style="color: var(--text-secondary); font-weight: 500;">User Role</span>
            <strong style="color: var(--text-primary);">${escapeHtml(currentUser.role)}</strong>
          </div>
        </div>
        
        <button class="btn btn-primary" id="edit-profile-btn">
          <i data-lucide="edit"></i> Edit Profile Details
        </button>
      </div>
    `;
  } else {
    const teacher = (await teacherService.getTeachers()).find(t => t.teacherId === currentUser.teacherId) || {};
    const school = (await schoolService.getSchools()).find(s => s.schoolCode === teacher.schoolId) || {};
    
    html = `
      <div class="profile-card" style="max-width: 800px; text-align: left;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div class="profile-avatar-large">
            ${escapeHtml(currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase())}
          </div>
          <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(currentUser.name)}</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Teacher Account (ID: ${escapeHtml(teacher.teacherId || "N/A")})</p>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">Account Security</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Email Address</span><span class="detail-value">${escapeHtml(currentUser.email)}</span></div>
            <div class="detail-item"><span class="detail-label">Portal Access Role</span><span class="detail-value">${escapeHtml(currentUser.role)}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">General Teacher Profile</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">${escapeHtml(teacher.name || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">CNIC Number</span><span class="detail-value">${escapeHtml(teacher.cnic || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">Contact Number</span><span class="detail-value">${escapeHtml(teacher.contactNo || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">School Assignment</span><span class="detail-value">${escapeHtml(school.name || "N/A")} (${escapeHtml(teacher.schoolId || "N/A")})</span></div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">Qualifications & Employment</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Qualification</span><span class="detail-value">${escapeHtml(teacher.qualification || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">Professional Qualification</span><span class="detail-value">${escapeHtml(teacher.professionalQualification || "None")}</span></div>
            <div class="detail-item"><span class="detail-label">Date Joined</span><span class="detail-value">${escapeHtml(teacher.dateOfJoining || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">Employment Status</span><span class="detail-value">${escapeHtml(teacher.employmentStatus || "N/A")}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">Training & Tech Access</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Last Training Taken</span><span class="detail-value">${escapeHtml(teacher.lastTrainingTaken || "No trainings taken")}</span></div>
            <div class="detail-item"><span class="detail-label">No. of Trainings Attended</span><span class="detail-value">${escapeHtml(teacher.noOfTrainingsAttended || 0)}</span></div>
            <div class="detail-item"><span class="detail-label">Android Phone Access</span><span class="detail-value">${escapeHtml(teacher.androidPhone || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">Internet Access</span><span class="detail-value">${escapeHtml(teacher.internetAccess || "N/A")}</span></div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">Bank Information</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">Bank Name</span><span class="detail-value">${escapeHtml(teacher.bankName || "N/A")}</span></div>
            <div class="detail-item"><span class="detail-label">Bank Account No</span><span class="detail-value">${escapeHtml(teacher.bankAccountNo || "N/A")}</span></div>
            <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">IBAN</span><span class="detail-value">${escapeHtml(teacher.iban || "N/A")}</span></div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 2rem;">
          <button class="btn btn-primary" id="edit-profile-btn">
            <i data-lucide="edit"></i> Edit Profile Details
          </button>
        </div>
      </div>
    `;
  }
  
  return html;
}

async function bindProfileEvents() {
  const btn = document.getElementById("edit-profile-btn");
  if (!btn) return;
  
  btn.addEventListener("click", async () => {
    const modalContainer = document.getElementById("modal-container");
    if (!modalContainer) return;
    
    const isAdmin = currentUser.role === "Admin";
    let teacher = null;
    let schools = [];
    
    if (!isAdmin) {
      teacher = (await teacherService.getTeachers()).find(t => t.teacherId === currentUser.teacherId) || {};
      schools = await schoolService.getSchools();
    }
    
    modalContainer.innerHTML = `
      <div class="modal-overlay" id="profile-modal-overlay">
        <div class="modal-drawer" style="max-width: ${escapeHtml(isAdmin ? "500px" : "650px")};">
          <div class="modal-header">
            <div class="modal-title-wrapper">
              <i data-lucide="user"></i>
              <span class="modal-title">Edit Profile & Account Details</span>
            </div>
            <button class="modal-close" onclick="closeProfileModal()">&times;</button>
          </div>
          <form id="edit-profile-form" style="display: flex; flex-direction: column; height: calc(100% - 70px);">
            <div class="modal-body" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
              
              <div class="detail-section">
                <h4 class="detail-section-title">Account Security</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" id="prof-name" class="form-control" value="${escapeHtml(currentUser.name)}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" id="prof-email" class="form-control" value="${escapeHtml(currentUser.email)}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">New Password (leave empty to keep current)</label>
                    <input type="password" id="prof-pass" class="form-control" placeholder="Min 8 chars, letters + digits" autocomplete="new-password">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Current Password (needed to change email or password)</label>
                    <input type="password" id="prof-current-pass" class="form-control" placeholder="••••••••" autocomplete="current-password">
                  </div>
                </div>
              </div>
              
              ${!isAdmin ? `
              <div class="detail-section">
                <h4 class="detail-section-title">General Teacher Profile</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">CNIC Number</label>
                    <input type="text" id="prof-cnic" class="form-control" value="${escapeHtml(teacher.cnic || "")}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Contact Number</label>
                    <input type="text" id="prof-contact" class="form-control" value="${escapeHtml(teacher.contactNo || "")}" required>
                  </div>
                  <div class="form-group" style="grid-column: span 2; margin-bottom: 1rem;">
                    <label class="form-label">School Assignment (only an Admin can change this)</label>
                    <select id="prof-school" class="form-control" disabled>
                      ${schools.map(s => `<option value="${escapeHtml(s.schoolCode)}" ${escapeHtml(teacher.schoolId === s.schoolCode ? "selected" : "")}>${escapeHtml(s.name)}</option>`).join("")}
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h4 class="detail-section-title">Qualifications & Employment</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Academic Qualification</label>
                    <select id="prof-qualification" class="form-control" required>
                      ${[
                        "Matric Science", "Matric Humanities", "Intermediate Science", "Intermediate Humanities", 
                        "14 years graduation", "16 years masters in science", "16 years masters in other subject", "MPhil", "PhD"
                      ].map(q => `<option value="${escapeHtml(q)}" ${escapeHtml(teacher.qualification === q ? "selected" : "")}>${escapeHtml(q)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Professional Qualification</label>
                    <select id="prof-prof-qualification" class="form-control" required>
                      ${["B.Ed", "M.Ed", "Certificate in ECE", "other teaching certification", "None"].map(pq => 
                        `<option value="${escapeHtml(pq)}" ${escapeHtml(teacher.professionalQualification === pq ? "selected" : "")}>${escapeHtml(pq)}</option>`
                      ).join("")}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date of Joining</label>
                    <input type="date" id="prof-joining" class="form-control" value="${escapeHtml(teacher.dateOfJoining || "")}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Employment Status (set by Admin)</label>
                    <select id="prof-status" class="form-control" disabled>
                      <option value="Employed" ${escapeHtml(teacher.employmentStatus === "Employed" ? "selected" : "")}>Employed</option>
                      <option value="Resigned" ${escapeHtml(teacher.employmentStatus === "Resigned" ? "selected" : "")}>Resigned</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h4 class="detail-section-title">Trainings & Tech Access</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Last Training Taken</label>
                    <input type="date" id="prof-training-date" class="form-control" value="${escapeHtml(teacher.lastTrainingTaken || "")}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">No. of Trainings Attended</label>
                    <input type="number" id="prof-training-count" class="form-control" min="0" value="${escapeHtml(teacher.noOfTrainingsAttended || 0)}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Android Phone</label>
                    <select id="prof-android" class="form-control" required>
                      <option value="Yes" ${escapeHtml(teacher.androidPhone === "Yes" ? "selected" : "")}>Yes</option>
                      <option value="No" ${escapeHtml(teacher.androidPhone === "No" ? "selected" : "")}>No</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Internet Access</label>
                    <select id="prof-internet" class="form-control" required>
                      <option value="Yes" ${escapeHtml(teacher.internetAccess === "Yes" ? "selected" : "")}>Yes</option>
                      <option value="No" ${escapeHtml(teacher.internetAccess === "No" ? "selected" : "")}>No</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="detail-section">
                <h4 class="detail-section-title">Bank Details</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Bank Name</label>
                    <input type="text" id="prof-bank" class="form-control" value="${escapeHtml(teacher.bankName || "")}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Bank Account No.</label>
                    <input type="text" id="prof-acc" class="form-control" value="${escapeHtml(teacher.bankAccountNo || "")}" required>
                  </div>
                  <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label">IBAN</label>
                    <input type="text" id="prof-iban" class="form-control" value="${escapeHtml(teacher.iban || "")}" required>
                  </div>
                </div>
              </div>
              ` : ""}
              
            </div>
            <div class="form-actions-footer" style="padding: 1rem 1.5rem; background-color: var(--bg-app); border-top: 1px solid var(--border);">
              <button type="button" class="btn btn-secondary" onclick="closeProfileModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    const overlay = document.getElementById("profile-modal-overlay");
    setTimeout(() => overlay.classList.add("active"), 10);
    if (window.lucide) window.lucide.createIcons();
    
    const form = document.getElementById("edit-profile-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newName = document.getElementById("prof-name").value.trim();
      const newEmail = document.getElementById("prof-email").value.trim();
      const newPass = document.getElementById("prof-pass").value;
      const currentPass = document.getElementById("prof-current-pass").value;
      
      if (newPass && (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass))) {
        showAlert("New password must be at least 8 characters with letters and digits.", "danger");
        return;
      }
      if ((newPass || newEmail.toLowerCase() !== String(currentUser.email).toLowerCase()) && !currentPass) {
        showAlert("Enter your current password to change your email or password.", "danger");
        return;
      }
      
      try {
        // PUT /teachers/me first (teacher profile), then PUT /users/me (account).
        if (!isAdmin) {
          await teacherService.updateMyProfile({
            name: newName,
            cnic: document.getElementById("prof-cnic").value.trim(),
            contactNo: document.getElementById("prof-contact").value.trim(),
            qualification: document.getElementById("prof-qualification").value,
            professionalQualification: document.getElementById("prof-prof-qualification").value,
            dateOfJoining: document.getElementById("prof-joining").value,
            lastTrainingTaken: document.getElementById("prof-training-date").value,
            noOfTrainingsAttended: parseInt(document.getElementById("prof-training-count").value) || 0,
            androidPhone: document.getElementById("prof-android").value,
            internetAccess: document.getElementById("prof-internet").value,
            bankName: document.getElementById("prof-bank").value.trim(),
            bankAccountNo: document.getElementById("prof-acc").value.trim(),
            iban: document.getElementById("prof-iban").value.trim()
          });
        }
        await authService.updateMe({
          name: newName,
          email: newEmail,
          currentPassword: currentPass || undefined,
          newPassword: newPass || undefined
        });
      } catch (err) {
        showAlert(describeApiError(err, "Could not save your profile."), "danger");
        return;
      }
      
      closeProfileModal();
      renderApp(); // Full refresh of layout
      showAlert("Profile settings saved successfully!");
    });
  });
}



window.closeProfileModal = closeProfileModal;
