// School Information System Core JS
// Implements router, authentication, views, state management, and actions.

// 1. Session State & Routing
let currentUser = JSON.parse(localStorage.getItem("nef_current_user")) || null;

// Routing State
let currentHash = window.location.hash || "#login";
// Pagination, Sorting & Search States
let tableStates = {
  students: {
    page: 1,
    limit: 100,
    search: "",
    sortBy: "studentId",
    sortOrder: "asc",
    showFiltersPanel: false,
    advanced: {
      school: "all",
      teacherId: "all",
      grade: "all",
      gender: "all",
      disability: "all",
      result: "all",
      enrollmentStatus: "all",
      admissionYear: "all",
      graduationYear: "all",
      ageRange: "all",
      orphan: "all",
      refugee: "all",
      citizenship: "all",
      residency: "all",
      motherTongue: "all",
      speakUrdu: "all",
      childLabor: "all",
      house: "all"
    }
  },
  teachers: { page: 1, limit: 100, search: "", filter: "all", sortBy: "teacherId", sortOrder: "asc" },
  schools: { page: 1, limit: 100, search: "", filter: "all", sortBy: "schoolCode", sortOrder: "asc" },
  myStudents: { page: 1, limit: 100, search: "", sortBy: "studentId", sortOrder: "asc" }
};

// Generic Dataset Sorter
