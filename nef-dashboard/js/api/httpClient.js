const httpClient = {
  async request(endpoint, options = {}) {
    const url = `${window.CONFIG.API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    const token = localStorage.getItem("nef_auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      throw { status: 0, message: "Cannot reach the server. Please check your connection and try again." };
    }

    // Some responses (e.g. proxies, 502 pages) are not JSON.
    let data = null;
    const text = await response.text();
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = null; }
    }

    if (!response.ok) {
      // Expired / revoked session: clear it and send the user to the login page.
      if (response.status === 401 && endpoint !== "/auth/login") {
        localStorage.removeItem("nef_auth_token");
        localStorage.removeItem("nef_current_user");
        if (typeof currentUser !== "undefined") currentUser = null;
        if (window.location.hash !== "#login") window.location.hash = "#login";
      }
      throw {
        status: response.status,
        message: (data && data.message) || `The server returned an error (${response.status}).`,
        errors: (data && data.errors) || null
      };
    }
    return data;
  },
  get(endpoint, options) { return this.request(endpoint, { ...options, method: "GET" }); },
  post(endpoint, body, options) { return this.request(endpoint, { ...options, method: "POST", body: JSON.stringify(body || {}) }); },
  put(endpoint, body, options) { return this.request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }); },
  delete(endpoint, options) { return this.request(endpoint, { ...options, method: "DELETE" }); }
};
window.httpClient = httpClient;

// Turns a thrown API error into one readable line for alerts, including the
// first field-level validation message when there is one.
function describeApiError(err, fallback) {
  if (!err) return fallback || "Something went wrong.";
  let msg = err.message || fallback || "Something went wrong.";
  if (Array.isArray(err.errors) && err.errors.length) {
    const e = err.errors[0];
    msg += ` (${e.field ? e.field + ": " : ""}${e.message})`;
  }
  return msg;
}
window.describeApiError = describeApiError;
