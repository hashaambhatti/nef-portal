const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { validate, validateIdParam } = require("../middleware/validate");
const { bulkGuardiansSchema, updateGuardianSchema } = require("../validators/guardians.validator");
const ctrl = require("../controllers/guardians.controller");

router.get("/", authenticate, ctrl.getAll);
// Bulk upsert is Admin-only; Teachers edit one guardian at a time (S5).
router.put("/", authenticate, authorize("Admin"), validate(bulkGuardiansSchema), ctrl.bulkSave);
router.put("/:guardianId", authenticate, authorize("Admin", "Teacher"), validateIdParam("guardianId"), validate(updateGuardianSchema), ctrl.update);

module.exports = router;
