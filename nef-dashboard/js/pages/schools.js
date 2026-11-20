

function getSchoolsPageTemplate() {
  const state = tableStates.schools;
  return `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title">Schools Database</h3>
        <button class="btn btn-primary" onclick="addSchoolDialog()">
          <i data-lucide="plus-circle"></i> Add School
        </button>
      </div>
      
      <div class="actions-bar">
        <div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" id="schools-search" class="search-input" placeholder="Search by School Code, Name, Region..." value="${escapeHtml(state.search)}">
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="table-custom">
          <thead>
            <tr>
              <th>School Code</th>
              <th>School Name</th>
              <th>Region</th>
              <th>District</th>
              <th>School Level</th>
              <th>School Type</th>
              <th>School Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="schools-table-body">
            <!-- Dynamic Content -->
          </tbody>
        </table>
      </div>
      
      <div class="pagination" id="schools-pagination"></div>
    </div>
  `;
}



async function renderSchoolsTable() {
  const body = document.getElementById("schools-table-body");
  const pagination = document.getElementById("schools-pagination");
  if (!body || !pagination) return;
  
  const state = tableStates.schools;
  let schools = await schoolService.getSchools();
  
  if (state.search) {
    const q = state.search.toLowerCase();
    schools = schools.filter(s => 
      String(s.schoolCode || "").toLowerCase().includes(q) || 
      String(s.name || "").toLowerCase().includes(q) || 
      String(s.region || "").toLowerCase().includes(q) ||
      String(s.district || "").toLowerCase().includes(q)
    );
  }
  
  const total = schools.length;
  const totalPages = Math.ceil(total / state.limit) || 1;
  if (state.page > totalPages) state.page = totalPages;
  
  const startIndex = (state.page - 1) * state.limit;
  const endIndex = Math.min(startIndex + state.limit, total);
  const pageData = schools.slice(startIndex, endIndex);
  
  let html = "";
  pageData.forEach(school => {
    const statusBadge = String(school.schoolStatus || "").toLowerCase() === "functional" ? "badge-success" : "badge-danger";
    
    html += `
      <tr>
        <td><strong>${escapeHtml(school.schoolCode)}</strong></td>
        <td>${escapeHtml(school.name)}</td>
        <td>${escapeHtml(school.region)}</td>
        <td>${escapeHtml(school.district)}</td>
        <td>${escapeHtml(school.schoolLevel)}</td>
        <td>${escapeHtml(school.schoolType)}</td>
        <td><span class="badge ${statusBadge}">${escapeHtml(school.schoolStatus)}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="viewSchoolDetails('${escapeHtml(school.schoolCode)}')" title="View details"><i data-lucide="eye"></i></button>
            <button class="btn-icon" onclick="editSchoolDetails('${escapeHtml(school.schoolCode)}')" title="Edit details"><i data-lucide="edit"></i></button>
            <button class="btn-icon btn-icon-danger" onclick="deleteSchoolConfirm('${escapeHtml(school.schoolCode)}')" title="Delete school"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
  
  if (total === 0) {
    html = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">No schools registered.</td></tr>`;
  }
  body.innerHTML = html;
  
  pagination.innerHTML = `
    <div>Showing <strong>${escapeHtml(total > 0 ? startIndex + 1 : 0)}</strong> to <strong>${escapeHtml(endIndex)}</strong> of <strong>${escapeHtml(total)}</strong> records</div>
    <div class="pagination-buttons">
      <button class="pagination-btn" id="schools-prev-btn" ${escapeHtml(state.page === 1 ? "disabled" : "")}>Previous</button>
      <button class="pagination-btn" id="schools-next-btn" ${escapeHtml(state.page === totalPages ? "disabled" : "")}>Next</button>
    </div>
  `;
  
  const prevBtn = document.getElementById("schools-prev-btn");
  const nextBtn = document.getElementById("schools-next-btn");
  if (prevBtn) prevBtn.addEventListener("click", async () => { state.page--; await renderSchoolsTable(); if (window.lucide) window.lucide.createIcons(); });
  if (nextBtn) nextBtn.addEventListener("click", async () => { state.page++; await renderSchoolsTable(); if (window.lucide) window.lucide.createIcons(); });
  
  if (window.lucide) window.lucide.createIcons();
}

function bindSchoolsPageEvents() {
  const searchInput = document.getElementById("schools-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      tableStates.schools.search = e.target.value;
      tableStates.schools.page = 1;
      renderSchoolsTable();
    });
  }
  renderSchoolsTable();
}

async function viewSchoolDetails(schoolCode) {
  const school = (await schoolService.getSchools()).find(s => s.schoolCode === schoolCode);
  if (!school) return;
  const building = (await schoolService.getBuildings()).find(b => b.schoolId === schoolCode) || {};
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="details-modal-overlay">
      <div class="modal-drawer">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="school"></i>
            <span class="modal-title">School Profile Detail</span>
          </div>
          <button class="modal-close" onclick="closeDetailsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4 class="detail-section-title">General Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">School Name</span><span class="detail-value">${escapeHtml(school.name)}</span></div>
              <div class="detail-item"><span class="detail-label">School Code</span><span class="detail-value">${escapeHtml(school.schoolCode)}</span></div>
              <div class="detail-item"><span class="detail-label">Region</span><span class="detail-value">${escapeHtml(school.region)}</span></div>
              <div class="detail-item"><span class="detail-label">District</span><span class="detail-value">${escapeHtml(school.district)}</span></div>
              <div class="detail-item"><span class="detail-label">Tehsil</span><span class="detail-value">${escapeHtml(school.tehsil)}</span></div>
              <div class="detail-item"><span class="detail-label">Union Council</span><span class="detail-value">${escapeHtml(school.uc)}</span></div>
              <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Complete Address</span><span class="detail-value">${escapeHtml(school.completeAddress)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">School Profile Details</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">School Level</span><span class="detail-value">${escapeHtml(school.schoolLevel)}</span></div>
              <div class="detail-item"><span class="detail-label">School Type</span><span class="detail-value">${escapeHtml(school.schoolType)}</span></div>
              <div class="detail-item"><span class="detail-label">School Gender</span><span class="detail-value">${escapeHtml(school.schoolGender)}</span></div>
              <div class="detail-item"><span class="detail-label">School Status</span><span class="detail-value">${escapeHtml(school.schoolStatus)}</span></div>
              <div class="detail-item"><span class="detail-label">School Sign Board</span><span class="detail-value">${escapeHtml(school.schoolSignBoard)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">People & Contacts</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Total Students</span><span class="detail-value">${escapeHtml(school.totalStudents)}</span></div>
              <div class="detail-item"><span class="detail-label">Total Teachers</span><span class="detail-value">${escapeHtml(school.totalTeachers)}</span></div>
              <div class="detail-item"><span class="detail-label">Head Teacher</span><span class="detail-value">${escapeHtml(school.headTeacherName)}</span></div>
              <div class="detail-item"><span class="detail-label">Head Contact No</span><span class="detail-value">${escapeHtml(school.headTeacherContactNo)}</span></div>
              <div class="detail-item"><span class="detail-label">School Contact No</span><span class="detail-value">${escapeHtml(school.contactNo)}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">GPS Coordinates</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Latitude</span><span class="detail-value">${escapeHtml(school.coordinates?.lat || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Longitude</span><span class="detail-value">${escapeHtml(school.coordinates?.long || "N/A")}</span></div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-section-title">Building Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Building Type</span><span class="detail-value">${escapeHtml(building.type || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Number of Rooms</span><span class="detail-value">${escapeHtml(building.noOfRooms || 0)}</span></div>
              <div class="detail-item"><span class="detail-label">Number of Washrooms</span><span class="detail-value">${escapeHtml(building.noOfWashrooms || 0)}</span></div>
              <div class="detail-item"><span class="detail-label">Drinking Water</span><span class="detail-value">${escapeHtml(building.drinkingWater || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Electricity</span><span class="detail-value">${escapeHtml(building.electricity || "N/A")}</span></div>
              <div class="detail-item"><span class="detail-label">Building Condition</span><span class="detail-value">${escapeHtml(building.condition || "N/A")}</span></div>
              <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Specify (Condition Details)</span><span class="detail-value">${escapeHtml(building.specify || "N/A")}</span></div>
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

async function editSchoolDetails(schoolCode) {
  const school = (await schoolService.getSchools()).find(s => s.schoolCode === schoolCode);
  renderSchoolFormModal(school);
}

async function deleteSchoolConfirm(schoolCode) {
  const school = (await schoolService.getSchools()).find(s => s.schoolCode === schoolCode);
  if (!school) return;
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay-center" id="delete-modal-overlay">
      <div class="modal-center">
        <div class="modal-header" style="background-color: var(--danger-light); color: var(--danger);">
          <div class="modal-title-wrapper">
            <i data-lucide="alert-triangle"></i>
            <span class="modal-title">Delete School Record</span>
          </div>
          <button class="modal-close" onclick="closeDeleteModal()" style="color: var(--danger);">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <p style="margin-bottom: 1.5rem; font-size: 0.95rem;">
            Are you sure you want to delete <strong>${escapeHtml(school.name)}</strong>? 
            This will also delete the associated school building records.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn btn-secondary" onclick="closeDeleteModal()">Cancel</button>
            <button class="btn btn-danger" onclick="executeDeleteSchool('${escapeHtml(school.schoolCode)}')">Delete Permanently</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("delete-modal-overlay");
  setTimeout(() => overlay.classList.add("active"), 10);
  if (window.lucide) window.lucide.createIcons();
}

async function executeDeleteSchool(schoolCode) {
  try {
    await schoolService.deleteSchool(schoolCode);
  } catch (err) {
    showAlert(describeApiError(err, "Could not delete the school."), "danger");
    return;
  }
  closeDeleteModal();
  renderSchoolsTable();
  showAlert("School deleted.", "danger");
}

function addSchoolDialog() {
  renderSchoolFormModal(null);
}

async function renderSchoolFormModal(school = null) {
  const isEdit = !!school;
  const building = isEdit ? ((await schoolService.getBuildings()).find(b => b.schoolId === school.schoolCode) || {}) : {};
  
  const modalContainer = document.getElementById("modal-container");
  if (!modalContainer) return;
  
  modalContainer.innerHTML = `
    <div class="modal-overlay" id="edit-modal-overlay">
      <div class="modal-drawer" style="max-width: 650px;">
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <i data-lucide="${escapeHtml(isEdit ? "edit" : "plus-circle")}"></i>
            <span class="modal-title">${escapeHtml(isEdit ? "Edit School Details" : "Register New School")}</span>
          </div>
          <button class="modal-close" onclick="closeEditModal()">&times;</button>
        </div>
        <form id="school-form" style="display: flex; flex-direction: column; height: calc(100% - 70px);">
          <div class="modal-body" style="flex: 1; padding: 1.5rem; overflow-y: auto;">
            
            <div class="detail-section">
              <h4 class="detail-section-title">General Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">School Name</label>
                  <input type="text" id="sch-name" class="form-control" value="${escapeHtml(isEdit ? school.name : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Region</label>
                  <select id="sch-region" class="form-control" required>
                    <option value="Islamabad capital Territory" ${escapeHtml(isEdit && school.region === "Islamabad capital Territory" ? "selected" : "")}>Islamabad Capital Territory</option>
                    <option value="GB" ${escapeHtml(isEdit && school.region === "GB" ? "selected" : "")}>Gilgit Baltistan (GB)</option>
                    <option value="AJK" ${escapeHtml(isEdit && school.region === "AJK" ? "selected" : "")}>Azad Jammu & Kashmir (AJK)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">District</label>
                  <input type="text" id="sch-district" class="form-control" value="${escapeHtml(isEdit ? school.district : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Tehsil</label>
                  <input type="text" id="sch-tehsil" class="form-control" value="${escapeHtml(isEdit ? school.tehsil : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Union Council UC#</label>
                  <input type="text" id="sch-uc" class="form-control" value="${escapeHtml(isEdit ? school.uc : "")}" required>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Complete Address</label>
                  <input type="text" id="sch-address" class="form-control" value="${escapeHtml(isEdit ? school.completeAddress : "")}" required>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">School Structure</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">School Level</label>
                  <select id="sch-level" class="form-control" required>
                    <option value="Primary" ${escapeHtml(isEdit && school.schoolLevel === "Primary" ? "selected" : "")}>Primary</option>
                    <option value="Middle" ${escapeHtml(isEdit && school.schoolLevel === "Middle" ? "selected" : "")}>Middle</option>
                    <option value="Secondary" ${escapeHtml(isEdit && school.schoolLevel === "Secondary" ? "selected" : "")}>Secondary</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">School Type</label>
                  <select id="sch-type" class="form-control" required>
                    <option value="Community School" ${escapeHtml(isEdit && school.schoolType === "Community School" ? "selected" : "")}>Community School</option>
                    <option value="Non-Formal" ${escapeHtml(isEdit && school.schoolType === "Non-Formal" ? "selected" : "")}>Non-Formal</option>
                    <option value="Adult Literacy" ${escapeHtml(isEdit && school.schoolType === "Adult Literacy" ? "selected" : "")}>Adult Literacy</option>
                    <option value="Non-Formal (Accelerated Learning Center)" ${escapeHtml(isEdit && school.schoolType === "Non-Formal (Accelerated Learning Center)" ? "selected" : "")}>Non-Formal (ALC)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Gender Type</label>
                  <select id="sch-gender" class="form-control" required>
                    <option value="Co-Education" ${escapeHtml(isEdit && school.schoolGender === "Co-Education" ? "selected" : "")}>Co-Education</option>
                    <option value="Male" ${escapeHtml(isEdit && school.schoolGender === "Male" ? "selected" : "")}>Male Only</option>
                    <option value="Female" ${escapeHtml(isEdit && school.schoolGender === "Female" ? "selected" : "")}>Female Only</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">School Status</label>
                  <select id="sch-status" class="form-control" required>
                    <option value="Functional" ${escapeHtml(isEdit && school.schoolStatus === "Functional" ? "selected" : "")}>Functional</option>
                    <option value="Non functional" ${escapeHtml(isEdit && school.schoolStatus === "Non functional" ? "selected" : "")}>Non-Functional</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">School Sign Board</label>
                  <select id="sch-board" class="form-control" required>
                    <option value="Yes" ${escapeHtml(isEdit && school.schoolSignBoard === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(isEdit && school.schoolSignBoard === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">People & Head Teacher</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Head Teacher Name</label>
                  <input type="text" id="sch-head" class="form-control" value="${escapeHtml(isEdit ? school.headTeacherName : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Head Teacher Contact</label>
                  <input type="text" id="sch-head-contact" class="form-control" value="${escapeHtml(isEdit ? school.headTeacherContactNo : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">School Contact No.</label>
                  <input type="text" id="sch-contact" class="form-control" value="${escapeHtml(isEdit ? school.contactNo : "")}" required>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">GPS Location</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="number" id="sch-lat" step="any" class="form-control" value="${escapeHtml(isEdit ? school.coordinates?.lat : "")}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="number" id="sch-long" step="any" class="form-control" value="${escapeHtml(isEdit ? school.coordinates?.long : "")}" required>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-section-title">Building Information</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Building Type</label>
                  <select id="bld-type" class="form-control" required>
                    <option value="Rented" ${escapeHtml(isEdit && building.type === "Rented" ? "selected" : "")}>Rented</option>
                    <option value="Community" ${escapeHtml(isEdit && building.type === "Community" ? "selected" : "")}>Community</option>
                    <option value="Own House" ${escapeHtml(isEdit && building.type === "Own House" ? "selected" : "")}>Own House</option>
                    <option value="NEF Building" ${escapeHtml(isEdit && building.type === "NEF Building" ? "selected" : "")}>NEF Building</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Number of Rooms</label>
                  <input type="number" id="bld-rooms" class="form-control" min="1" value="${escapeHtml(isEdit ? building.noOfRooms : 2)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Number of Washrooms</label>
                  <input type="number" id="bld-washrooms" class="form-control" min="0" value="${escapeHtml(isEdit ? building.noOfWashrooms : 1)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Drinking Water Access</label>
                  <select id="bld-water" class="form-control" required>
                    <option value="Yes" ${escapeHtml(isEdit && building.drinkingWater === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(isEdit && building.drinkingWater === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Electricity Connection</label>
                  <select id="bld-electricity" class="form-control" required>
                    <option value="Yes" ${escapeHtml(isEdit && building.electricity === "Yes" ? "selected" : "")}>Yes</option>
                    <option value="No" ${escapeHtml(isEdit && building.electricity === "No" ? "selected" : "")}>No</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Building Condition</label>
                  <select id="bld-condition" class="form-control" required>
                    <option value="Satisfactory" ${escapeHtml(isEdit && building.condition === "Satisfactory" ? "selected" : "")}>Satisfactory</option>
                    <option value="Required renovation" ${escapeHtml(isEdit && building.condition === "Required renovation" ? "selected" : "")}>Required Renovation</option>
                    <option value="Required white wash" ${escapeHtml(isEdit && building.condition === "Required white wash" ? "selected" : "")}>Required White Wash</option>
                  </select>
                </div>
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Condition Specify</label>
                  <input type="text" id="bld-specify" class="form-control" value="${escapeHtml(isEdit ? building.specify : "")}">
                </div>
              </div>
            </div>
            
          </div>
          <div class="form-actions-footer" style="padding: 1rem 1.5rem; background-color: var(--bg-app); border-top: 1px solid var(--border);">
            <button type="button" class="btn btn-secondary" onclick="closeEditModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">${escapeHtml(isEdit ? "Save Changes" : "Register School")}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const overlay = document.getElementById("edit-modal-overlay");
  setTimeout(() => overlay.classList.add("active"), 10);
  if (window.lucide) window.lucide.createIcons();
  
  const form = document.getElementById("school-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const schoolFields = {
      name: document.getElementById("sch-name").value.trim(),
      region: document.getElementById("sch-region").value,
      district: document.getElementById("sch-district").value.trim(),
      tehsil: document.getElementById("sch-tehsil").value.trim(),
      uc: document.getElementById("sch-uc").value.trim(),
      completeAddress: document.getElementById("sch-address").value.trim(),
      schoolLevel: document.getElementById("sch-level").value,
      schoolType: document.getElementById("sch-type").value,
      schoolGender: document.getElementById("sch-gender").value,
      schoolStatus: document.getElementById("sch-status").value,
      schoolSignBoard: document.getElementById("sch-board").value,
      headTeacherName: document.getElementById("sch-head").value.trim(),
      headTeacherContactNo: document.getElementById("sch-head-contact").value.trim(),
      contactNo: document.getElementById("sch-contact").value.trim(),
      coordinates: {
        lat: parseFloat(document.getElementById("sch-lat").value) || 0,
        long: parseFloat(document.getElementById("sch-long").value) || 0
      }
    };
    
    // Building details travel with the school; the server generates
    // SCH-xxx / BLD-xxx ids and saves both in one transaction.
    const buildingFields = {
      type: document.getElementById("bld-type").value,
      noOfRooms: parseInt(document.getElementById("bld-rooms").value) || 0,
      noOfWashrooms: parseInt(document.getElementById("bld-washrooms").value) || 0,
      drinkingWater: document.getElementById("bld-water").value,
      electricity: document.getElementById("bld-electricity").value,
      condition: document.getElementById("bld-condition").value,
      specify: document.getElementById("bld-specify").value.trim()
    };
    
    try {
      if (isEdit) {
        await schoolService.updateSchool(school.schoolCode, { ...schoolFields, building: buildingFields });
        showAlert("School data updated.");
      } else {
        const created = await schoolService.createSchool({ ...schoolFields, building: buildingFields });
        showAlert(`New school registered successfully (${created.schoolCode}).`);
      }
    } catch (err) {
      showAlert(describeApiError(err, "Could not save the school."), "danger");
      return;
    }
    
    closeEditModal();
    renderSchoolsTable();
  });
}

window.viewSchoolDetails = viewSchoolDetails;
window.editSchoolDetails = editSchoolDetails;
window.deleteSchoolConfirm = deleteSchoolConfirm;
window.executeDeleteSchool = executeDeleteSchool;
window.addSchoolDialog = addSchoolDialog;
window.renderSchoolFormModal = renderSchoolFormModal;
