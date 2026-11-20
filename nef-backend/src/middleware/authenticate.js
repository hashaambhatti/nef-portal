const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

// Reads "Authorization: Bearer <token>", verifies it, then loads the user
// from the database on every request. This means:
//   * a deleted user is locked out immediately;
//   * a role change takes effect immediately (no stale "Admin" in a token);
//   * logout / password change bump users.token_version, which revokes every
//     token issued before that moment (S9).
module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Missing or malformed Authorization header."));
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token."));
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, teacher_id AS teacherId, token_version AS tokenVersion
       FROM users WHERE id = ?`,
      [decoded.sub]
    );
    const user = rows[0];
    if (!user || Number(user.tokenVersion) !== Number(decoded.tv)) {
      return next(new ApiError(401, "Session has ended. Please log in again."));
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teacherId: user.teacherId || null
    };
    next();
  } catch (err) {
    next(err);
  }
};
