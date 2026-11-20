const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { validate, validateIdParam } = require("../middleware/validate");
const { createTeacherSchema, updateTeacherSchema, updateMyTeacherSchema } = require("../validators/teachers.validator");
const ctrl = require("../controllers/teachers.controller");

// Admin sees everything; a Teacher sees other teachers without CNIC/phone/bank (S3).
router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, authorize("Admin"), validate(createTeacherSchema), ctrl.create);
// A Teacher edits their own profile (profile page). Before "/:teacherId".
router.put("/me", authenticate, authorize("Teacher"), validate(updateMyTeacherSchema), ctrl.updateMe);
router.put("/:teacherId", authenticate, authorize("Admin"), validateIdParam("teacherId"), validate(updateTeacherSchema), ctrl.update);
router.delete("/:teacherId", authenticate, authorize("Admin"), validateIdParam("teacherId"), ctrl.remove);

module.exports = router;
