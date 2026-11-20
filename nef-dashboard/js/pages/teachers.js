

async function getTeachersPageTemplate() {
  const state = tableStates.teachers;
  const schools = await schoolService.getSchools();
  
  return `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">Teachers Registry</h3>
        <button class="btn btn-primary" onclick="addTeacherDialog()">
          <i data-lucide="plus-circle"></i> Add Teacher Profile
        </button>
      </div>
      
      <div class="actions-bar">
        <div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" id="teachers-search" class="search-input" placeholder="Search by Teacher ID, Name, CNIC..." value="${escapeHtml(state.search)}">
        </div>
        <select id="teachers-filter-school" class="filter-select">
          <option value="all">All Schools</option>
          ${schools.map(s => `<option value="${escapeHtml(s.schoolCode)}" ${escapeHtml(state.filter === s.schoolCode ? "selected" : "")}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
      
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>Teacher ID</th>
              <th>Name</th>
              <th>School</th>
              <th>Qualification</th>
              <th>Employment Status</th>
              <th>Contact Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="teachers-table-body">
            <!-- Dynamic content -->
          </tbody>
        </table>
      </div>
      
      <div class="pagination" id="teachers-pagination"></div>
    </div>
  `;
}



async function renderTeachersTable() {
  const body = document.getElementById("teachers-table-body");
  const pagination = document.getElementById("teachers-pagination");
  if (!body || !pagination) return;
  
  const state = tableStates.teachers;
  let teachers = await teacherService.getTeachers();
  const schools = await schoolService.getSchools();
  
  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    teachers = teachers.filter(t => 
      String(t.teacherId || "").toLowerCase().includes(q) || 
      String(t.name || "").toLowerCase().includes(q) || 
      String(t.cnic || "").includes(q)
    );
  }
  
  // Filter by school
  if (state.filter !== "all") {
    teachers = teachers.filter(t => t.schoolId === state.filter);
  }
  
  const total = teachers.length;
  const totalPages = Math.ceil(total / state.limit) || 1;
  if (state.page > totalPages) state.page = totalPages;
  
  const startIndex = (state.page - 1) * state.limit;
  const endIndex = Math.min(startIndex + state.limit, total);
  const pageData = teachers.slice(startIndex, endIndex);
  
  let html = "";
  pageData.forEach(teacher => {
    const school = schools.find(s => s.schoolCode === teacher.schoolId);
    const statusBadge = String(teacher.employmentStatus || "").toLowerCase() === "employed" ? "badge-success" : "badge-danger";
    
    html += `
      <tr>
        <td><strong>${escapeHtml(teacher.teacherId)}</strong></td>
        <td>${escapeHtml(teacher.name)}</td>
        <td>${escapeHtml(school ? school.name : "Unassigned")}</td>
        <td>${escapeHtml(teacher.qualification)}</td>
        <td><span class="badge ${statusBadge}">${escapeHtml(teacher.employmentStatus)}</span></td>
        <td>${escapeHtml(teacher.contactNo)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="viewTeacherDetails('${escapeHtml(teacher.teacherId)}')" title="View Details"><i data-lucide="eye"></i></button>
            <button class="btn-icon" onclick="editTeacherDetails('${escapeHtml(teacher.teacherId)}')" title="Edit Teacher"><i data-lucide="edit"></i></button>
            <button class="btn-icon btn-icon-danger" onclick="deleteTeacherConfirm('${escapeHtml(teacher.teacherId)}')" title="Delete Profile"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
  
  if (total === 0) {
    html = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No teachers registered.</td></tr>`;
  }
  body.innerHTML = html;
  
  pagination.innerHTML = `
    <div>Showing <strong>${escapeHtml(total > 0 ? startIndex + 1 : 0)}</strong> to <strong>${escapeHtml(endIndex)}</strong> of <strong>${escapeHtml(total)}</strong> records</div>
    <div class="pagination-buttons">
      <button class="pagination-btn" id="teachers-prev-btn" ${escapeHtml(state.page === 1 ? "disabled" : "")}>Previous</button>
      <button class="pagination-btn" id="teachers-next-btn" ${escapeHtml(state.page === totalPages ? "disabled" : "")}>Next</button>
    </div>
  `;
  
  const prevBtn = document.getElementById("teachers-prev-btn");
  const nextBtn = document.getElementById("teachers-next-btn");
  if (prevBtn) prevBtn.addEventListener("click", async () => { state.page--; await renderTeachersTable(); if (window.lucide) window.lucide.createIcons(); });
  if (nextBtn) nextBtn.addEventListener("click", async () => { state.page++; await renderTeachersTable(); if (window.lucide) window.lucide.createIcons(); });
  
  if (window.lucide) window.lucide.createIcons();
}

function bindTeachersPageEvents() {
  const searchInput = document.getElementById("teachers-search");
  const schoolFilter = document.getElementById("teachers-filter-school");
  
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      tableStates.teachers.search = e.target.value;
      tableStates.teachers.page = 1;
      renderTeachersTable();
    });
  }
  
  if (schoolFilter) {
    schoolFilter.addEventListener("change", (e) => {
      tableStates.teachers.filter = e.target.value;
      tableStates.teachers.page = 1;
      renderTeachersTable();
    });
  }
  
  renderTeachersTable();
}

async function viewTeacherDetails(teacherId) {
  const teacher = (await teacherService.getTeachers()).find(t => t.teacherId === teacherId);
  if (!teacher) return;
  const school = (await schoolService.getSchools()).find(s => s.schoolCode === teacher.schoolId) || {};
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="details-modal-overlay">
      <div class="modal-drawer">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="graduation-cap"></i>
            <span class="modal-title">Teacher Profile Detail</span>
          </div>
          <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4 class="detail-section-title">General</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Teacher ID</span><span class="detail-value">${escapeHtml(teacher.teacherId)}</span></div>
              <div class="detail-item"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(teacher.name)}</span></div>
              <div class="detail-item"><span class="detail-label">CNIC</span><span class="detail-value">${escapeHtml(teacher.cnic)}</span></div>
              <div class="detail-item"><span class="detail-label">Contact Number</span><span class="detail-value">${escapeHtml(teacher.contactNo)}</span></div>
              <div class="detail-item"><span class="detail-label">School ID</span><span class="detail-value">${escapeHtml(teacher.schoolId)}</span></div>
              <div class="detail-item"><span class="detail-label">School Name</span><span class="detail-value">${escapeHtml(school.name || "N/A")}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Qualifications</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Qualification</span><span class="detail-value">${escapeHtml(teacher.qualification)}</span></div>
              <div class="detail-item"><span class="detail-label">Professional Qualification</span><span class="detail-value">${escapeHtml(teacher.professionalQualification || "None")}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Employment</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Date Joined</span><span class="detail-value">${escapeHtml(teacher.dateOfJoining)}</span></div>
              <div class="detail-item"><span class="detail-label">Employment Status</span><span class="detail-value">${escapeHtml(teacher.employmentStatus)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Training</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Last Training Taken</span><span class="detail-value">${escapeHtml(teacher.lastTrainingTaken || "No trainings taken")}</span></div>
              <div class="detail-item"><span class="detail-label">Number of Trainings</span><span class="detail-value">${escapeHtml(teacher.noOfTrainingsAttended)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Technology</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Android Phone</span><span class="detail-value">${escapeHtml(teacher.androidPhone)}</span></div>
              <div class="detail-item"><span class="detail-label">Internet Access</span><span class="detail-value">${escapeHtml(teacher.internetAccess)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Bank Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Bank Name</span><span class="detail-value">${escapeHtml(teacher.bankName)}</span></div>
              <div class="detail-item"><span class="detail-label">Bank Account Number</span><span class="detail-value">${escapeHtml(teacher.bankAccountNo)}</span></div>
              <div class="detail-item"><span class="detail-label">IBAN</span><span class="detail-value">${escapeHtml(teacher.iban)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("details-modal-overlay");
  setTimeout(() => overlay.classList.add("active"), 10);
  if (window.lucide) window.lucide.createIcons();
}

async function editTeacherDetails(teacherId) {
  const teacher = (await teacherService.getTeachers()).find(t => t.teacherId === teacherId);
  renderTeacherFormModal(teacher);
}

async function deleteTeacherConfirm(teacherId) {
  const teacher = (await teacherService.getTeachers()).find(t => t.teacherId === teacherId);
  if (!teacher) return;
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay-center" id="delete-modal-overlay">
      <div class="modal-center">
        <div class="modal-header" style="background-color: var(--danger-light); color: var(--danger);">
          <div class="modal-title-wrapper">
            <i data-lucide="alert-triangle"></i>
            <span class="modal-title">Delete Teacher Profile</span>
          </div>
          <button class="modal-close" onclick="closeDeleteModal()" style="color: var(--danger);">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
            Are you sure you want to delete the teacher profile for <strong>${escapeHtml(teacher.name)}</strong> (${escapeHtml(teacher.teacherId)})? 
            This will not delete assigned students but they will need a teacher re-assignment.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
            <button class="btn btn-danger" onclick="executeDeleteTeacher('${escapeHtml(teacher.teacherId)}')">Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("delete-modal-overlay");
  setTimeout(() => overlay.classList.add("active"), 10);
  if (window.lucide) window.lucide.createIcons();
}

async function executeDeleteTeacher(teacherId) {
  try {
    await teacherService.deleteTeacher(teacherId);
  } catch (err) {
    showAlert(describeApiError(err, "Could not delete the teacher."), "danger");
    return;
  }
  closeDeleteModal();
  renderTeachersTable();
  showAlert("Teacher profile deleted.", "danger");
}

function addTeacherDialog() {
  renderTeacherFormModal(null);
}

async function renderTeacherFormModal(teacher = null) {
  const isEdit = !!teacher;
  const schools = await schoolService.getSchools();
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="edit-modal-overlay">
      <div class="modal-drawer" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="${escapeHtml(isEdit ? "edit" : "plus-circle")}"></i>
            <span class="modal-title">${escapeHtml(isEdit ? "Edit Teacher Profile" : "Register New Teacher")}</span>
          </div>
          <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <form id="teacher-form" style="display: flex; flex-direction: column; height: calc(100% - 70px);">
          <div class="modal-body" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
            
            <div class="detail-section">
              <h4 class="detail-section-title">General Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" id="tch-name" class="form-control" value="${escapeHtml(isEdit ? teacher.name : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">CNIC Number</label>
                  <input type="text" id="tch-cnic" class="form-control" placeholder="13 digits" value="${escapeHtml(isEdit ? teacher.cnic : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Number</label>
                  <input type="text" id="tch-contact" class="form-control" value="${escapeHtml(isEdit ? teacher.contactNo : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">School Assignment</label>
                  <select id="tch-school" class="form-control" required>
                    ${schools.map(s => `<option value="${escapeHtml(s.schoolCode)}" ${escapeHtml(isEdit && teacher.schoolId === s.schoolCode ? "selected" : "")}>${escapeHtml(s.name)}</option>`).join("")}
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Qualifications</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Academic Qualification</label>
                  <select id="tch-qualification" class="form-control" required>
                    ${[
                      "Matric Science", "Matric Humanities", "Intermediate Science", "Intermediate Humanities", 
                      "14 years graduation", "16 years masters in science", "16 years masters in other subject", "MPhil", "PhD"
                    ].map(q => `<option value="${escapeHtml(q)}" ${escapeHtml(isEdit && teacher.qualification === q ? "selected" : "")}>${escapeHtml(q)}</option>`).join("")}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Professional Qualification</label>
                  <select id="tch-prof-qualification" class="form-control" required>
                    ${["B.Ed", "M.Ed", "Certificate in ECE", "other teaching certification", "None"].map(pq => 
                      `<option value="${escapeHtml(pq)}" ${escapeHtml(isEdit && teacher.professionalQualification === pq ? "selected" : "")}>${escapeHtml(pq)}</option>`
                    ).join("")}
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Employment & Trainings</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Date of Joining</label>
                  <input type="date" id="tch-joining" class="form-control" value="${escapeHtml(isEdit ? teacher.dateOfJoining : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Employment Status</label>
                  <select id="tch-status" class="form-control" required>
                    <option value="Employed" ${escapeHtml(isEdit && teacher.employmentStatus === "Employed" ? "selected" : "")}>Employed</option>
                    <option value="Resigned" ${escapeHtml(isEdit && teacher.employmentStatus === "Resigned" ? "selected" : "")}>Resigned</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Training Taken</label>
                  <input type="date" id="tch-training-date" class="form-control" value="${escapeHtml(isEdit ? teacher.lastTrainingTaken : "")}">
                </div>
                <div class="form-group">
                  <label class="form-label">No. of Trainings Attended</label>
                  <input type="number" id="tch-training-count" class="form-control" min="0" value="${escapeHtml(isEdit ? teacher.noOfTrainingsAttended : 0)}" required>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Technology Access</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Android Phone</label>
                  <select id="tch-android" class="form-control" required>
                    <option value="Yes" ${escapeHtml(isEdit && teacher.androidPhone === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(isEdit && teacher.androidPhone === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Internet Access</label>
                  <select id="tch-internet" class="form-control" required>
                    <option value="Yes" ${escapeHtml(isEdit && teacher.internetAccess === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(isEdit && teacher.internetAccess === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Bank Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Bank Name</label>
                  <input type="text" id="tch-bank" class="form-control" value="${escapeHtml(isEdit ? teacher.bankName : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Bank Account No.</label>
                  <input type="text" id="tch-acc" class="form-control" value="${escapeHtml(isEdit ? teacher.bankAccountNo : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">IBAN</label>
                  <input type="text" id="tch-iban" class="form-control" placeholder="PK73HABB..." value="${escapeHtml(isEdit ? teacher.iban : "")}" required>
                </div>
              </div>
            </div>
            
          </div>
          <div class="form-actions-footer" style="padding: 1rem 1.5rem; background-color: var(--bg-app); border-top: 1px solid var(--border);">
            <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${escapeHtml(isEdit ? "Save Changes" : "Register Teacher")}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("edit-modal-overlay");
  setTimeout(() => overlay.classList.add("active"), 10);
  if (window.lucide) window.lucide.createIcons();
  
  const form = document.getElementById("teacher-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fields = {
      name: document.getElementById("tch-name").value.trim(),
      cnic: document.getElementById("tch-cnic").value.trim(),
      contactNo: document.getElementById("tch-contact").value.trim(),
      schoolId: document.getElementById("tch-school").value,
      qualification: document.getElementById("tch-qualification").value,
      professionalQualification: document.getElementById("tch-prof-qualification").value,
      dateOfJoining: document.getElementById("tch-joining").value,
      employmentStatus: document.getElementById("tch-status").value,
      lastTrainingTaken: document.getElementById("tch-training-date").value,
      noOfTrainingsAttended: parseInt(document.getElementById("tch-training-count").value) || 0,
      androidPhone: document.getElementById("tch-android").value,
      internetAccess: document.getElementById("tch-internet").value,
      bankName: document.getElementById("tch-bank").value.trim(),
      bankAccountNo: document.getElementById("tch-acc").value.trim(),
      iban: document.getElementById("tch-iban").value.trim()
    };
    
    try {
      if (isEdit) {
        await teacherService.updateTeacher(teacher.teacherId, fields);
        showAlert("Teacher profile updated.");
      } else {
        // The server generates the TCH-xxx id.
        const created = await teacherService.createTeacher(fields);
        showAlert(`New teacher registered successfully (${created.teacherId}).`);
      }
    } catch (err) {
      showAlert(describeApiError(err, "Could not save the teacher."), "danger");
      return;
    }
    
    closeEditModal();
    renderTeachersTable();
  });
}

window.viewTeacherDetails = viewTeacherDetails;
window.editTeacherDetails = editTeacherDetails;
window.deleteTeacherConfirm = deleteTeacherConfirm;
window.executeDeleteTeacher = executeDeleteTeacher;
window.addTeacherDialog = addTeacherDialog;
window.renderTeacherFormModal = renderTeacherFormModal;
