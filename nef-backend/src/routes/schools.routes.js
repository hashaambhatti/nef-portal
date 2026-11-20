const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { validate, validateIdParam } = require("../middleware/validate");
const { createSchoolSchema, updateSchoolSchema } = require("../validators/schools.validator");
const ctrl = require("../controllers/schools.controller");

// Public: code + name only, for the signup form's school dropdown (F3).
router.get("/public", ctrl.getPublic);
router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, authorize("Admin"), validate(createSchoolSchema), ctrl.create);
router.put("/:schoolCode", authenticate, authorize("Admin"), validateIdParam("schoolCode"), validate(updateSchoolSchema), ctrl.update);
router.delete("/:schoolCode", authenticate, authorize("Admin"), validateIdParam("schoolCode"), ctrl.remove);

module.exports = router;
