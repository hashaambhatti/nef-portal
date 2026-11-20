const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { bulkBuildingsSchema } = require("../validators/buildings.validator");
const ctrl = require("../controllers/buildings.controller");

router.get("/", authenticate, ctrl.getAll);
router.put("/", authenticate, authorize("Admin"), validate(bulkBuildingsSchema), ctrl.bulkSave);

module.exports = router;
