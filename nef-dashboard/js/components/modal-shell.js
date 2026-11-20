function closeDetailsModal() {
  const overlay = document.getElementById("details-modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
    }, 250);
  }
}

function closeEditModal() {
  const overlay = document.getElementById("edit-modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
    }, 250);
  }
}

function closeDeleteModal() {
  const overlay = document.getElementById("delete-modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.remove();
    }, 200);
  }
}

function closeProfileModal() {
  const overlay = document.getElementById("profile-modal-overlay");
  if (overlay) {
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 200);
  }
}

window.closeDetailsModal = closeDetailsModal;
window.closeEditModal = closeEditModal;
window.closeDeleteModal = closeDeleteModal;
window.closeProfileModal = closeProfileModal;
