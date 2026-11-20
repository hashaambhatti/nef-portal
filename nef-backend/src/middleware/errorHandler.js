const ApiError = require("../utils/ApiError");

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }

  // Malformed or oversized JSON bodies (from express.json()).
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }

  // MySQL duplicate key (unique constraint violation)
  if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
    return res.status(409).json({ message: "A record with these details already exists." });
  }
  // MySQL foreign key constraint violations
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
    return res.status(409).json({ message: "This record is still used by other data and cannot be deleted." });
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.errno === 1452) {
    return res.status(400).json({ message: "A referenced record (school, teacher or guardian) does not exist." });
  }

  // Unexpected: log the details server-side only.
  if (process.env.NODE_ENV !== "test") console.error(err);
  res.status(500).json({ message: "An unexpected error occurred on the server." });
};
