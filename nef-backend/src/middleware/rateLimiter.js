const rateLimit = require("express-rate-limit");

// Applied to all /api/* routes - generous, just a backstop against abuse.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

// Applied to POST /auth/login and /auth/signup specifically - tight,
// to slow down brute-force password guessing / account enumeration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in a few minutes." }
});

module.exports = { generalLimiter, authLimiter };
