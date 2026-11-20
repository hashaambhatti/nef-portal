const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { validate, validateIdParam } = require("../middleware/validate");
const {
  createStudentSchema, updateStudentSchema, bulkStudentsSchema
} = require("../validators/students.validator");
const ctrl = require("../controllers/students.controller");

// Teachers are limited to their own school inside the service layer (S5).
router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, authorize("Admin", "Teacher"), validate(createStudentSchema), ctrl.create);
// Bulk grade promotion - Teachers run this from the Promotion page.
router.put("/", authenticate, authorize("Admin", "Teacher"), validate(bulkStudentsSchema), ctrl.bulkSave);
router.put("/:studentId", authenticate, authorize("Admin", "Teacher"), validateIdParam("studentId"), validate(updateStudentSchema), ctrl.update);
router.delete("/:studentId", authenticate, authorize("Admin"), validateIdParam("studentId"), ctrl.remove);

module.exports = router;
