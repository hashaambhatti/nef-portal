const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const { bulkUsersSchema, createUserSchema, updateMeSchema } = require("../validators/users.validator");
const ctrl = require("../controllers/auth.controller");

// Own account - any logged-in user. Registered before the Admin routes.
router.get("/me", authenticate, ctrl.getMe);
router.put("/me", authenticate, validate(updateMeSchema), ctrl.updateMe);

// User management - Admin only (S2, S3).
router.get("/", authenticate, authorize("Admin"), ctrl.getUsers);
router.post("/", authenticate, authorize("Admin"), validate(createUserSchema), ctrl.createUser);
router.put("/", authenticate, authorize("Admin"), validate(bulkUsersSchema), ctrl.saveUsers);

module.exports = router;
