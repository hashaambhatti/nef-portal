const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { bulkAttendanceSchema } = require("../validators/attendance.validator");
const ctrl = require("../controllers/attendance.controller");

router.get("/", authenticate, ctrl.getAll);
router.put("/", authenticate, authorize("Admin", "Teacher"), validate(bulkAttendanceSchema), ctrl.bulkSave);

module.exports = router;
