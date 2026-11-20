const ApiError = require("../utils/ApiError");
const { ID_PATTERN } = require("../validators/common");

function formatIssues(error) {
  return error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
}

// Usage: validate(someZodSchema) as route middleware. Validates req.body and
// replaces it with the parsed (type-coerced, unknown-keys-stripped) result.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new ApiError(400, "Validation failed.", formatIssues(result.error)));
    }
    req.body = result.data;
    next();
  };
}

// Usage: validateIdParam("studentId") - rejects malformed :ids in the URL.
function validateIdParam(name) {
  return (req, res, next) => {
    if (!ID_PATTERN.test(String(req.params[name] || ""))) {
      return next(new ApiError(400, `Invalid ${name}.`));
    }
    next();
  };
}

module.exports = validate;
module.exports.validate = validate;
module.exports.validateIdParam = validateIdParam;
