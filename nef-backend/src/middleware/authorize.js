const ApiError = require("../utils/ApiError");

// Usage: authorize("Admin") or authorize("Admin", "Teacher")
// Must run after authenticate.js so req.user is populated.
module.exports = function authorize(...allowedRoles) {
  const middleware = (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated."));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action."));
    }
    next();
  };
  middleware.allowedRoles = allowedRoles; // lets tests check every route's roles
  return middleware;
};
