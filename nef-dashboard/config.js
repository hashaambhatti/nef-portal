// ---------------------------------------------------------------------------
// Frontend configuration.
//
// Before deploying, put your live backend's URL in PRODUCTION_API_BASE_URL
// (for Render it looks like https://nef-backend.onrender.com/api).
//
// When the page is opened from localhost / 127.0.0.1 (VS Code Live Server),
// the local backend on port 3000 is used automatically.
//
// USE_MOCK_API: true  -> demo mode: data lives only in this browser's
//                        localStorage, no backend needed. Never for real users.
// USE_MOCK_API: false -> real backend (required for production).
// ---------------------------------------------------------------------------
const PRODUCTION_API_BASE_URL = "https://YOUR-BACKEND.onrender.com/api";

const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const CONFIG = {
  API_BASE_URL: isLocalHost ? "http://localhost:3000/api" : PRODUCTION_API_BASE_URL,
  USE_MOCK_API: false,
  VERSION: "2.2.0"
};
window.CONFIG = CONFIG;
