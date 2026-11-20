const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const authenticate = require("../middleware/authenticate");
const { loginSchema, signupSchema } = require("../validators/auth.validator");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/login", authLimiter, validate(loginSchema), ctrl.login);
router.post("/signup", authLimiter, validate(signupSchema), ctrl.signup);
// Requires the token so it can be revoked server-side.
router.post("/logout", authenticate, ctrl.logout);

module.exports = router;
