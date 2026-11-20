const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { bulkClassesSchema } = require("../validators/classes.validator");
const ctrl = require("../controllers/classes.controller");

router.get("/", authenticate, ctrl.getAll);
router.put("/", authenticate, authorize("Admin"), validate(bulkClassesSchema), ctrl.bulkSave);

module.exports = router;
