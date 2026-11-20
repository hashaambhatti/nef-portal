require("dotenv").config();

// Central place for configuration. Fails fast at startup when something
// required is missing, instead of crashing later on the first login (S6).

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const corsOrigins = parseList(process.env.CORS_ORIGIN);
if (!corsOrigins.length && !isProduction) {
  // Sensible local defaults (VS Code Live Server). Never "*".
  corsOrigins.push("http://localhost:5500", "http://127.0.0.1:5500");
}

const config = {
  isProduction,
  isTest,
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigins,
  // Number of reverse proxies in front of the app (Render, nginx, etc.).
  // Needed so the rate limiter sees the real client IP (S7).
  trustProxy: process.env.TRUST_PROXY !== undefined
    ? (isNaN(Number(process.env.TRUST_PROXY)) ? process.env.TRUST_PROXY : Number(process.env.TRUST_PROXY))
    : (isProduction ? 1 : false),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  // Set ALLOW_SIGNUP=false to turn off public self-registration entirely.
  allowSignup: String(process.env.ALLOW_SIGNUP || "true").toLowerCase() !== "false"
};

function validateConfig() {
  const problems = [];

  if (!config.jwtSecret) {
    problems.push("JWT_SECRET is not set.");
  } else if (isProduction && config.jwtSecret.length < 32) {
    problems.push("JWT_SECRET must be at least 32 characters in production (use: openssl rand -hex 32).");
  } else if (isProduction && /replace-with|changeme/i.test(config.jwtSecret)) {
    problems.push("JWT_SECRET still has the placeholder value from .env.example.");
  }

  if (isProduction && !corsOrigins.length) {
    problems.push("CORS_ORIGIN must be set in production (the exact URL the frontend is served from).");
  }
  if (corsOrigins.includes("*")) {
    problems.push("CORS_ORIGIN must not be '*'. List the exact frontend origin(s), comma-separated.");
  }

  const hasUrl = Boolean(process.env.MYSQL_URL);
  const hasDiscrete = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER"].every((k) => process.env[k]);
  if (!hasUrl && !hasDiscrete) {
    problems.push("Database is not configured: set MYSQL_URL, or MYSQL_HOST + MYSQL_DATABASE + MYSQL_USER + MYSQL_PASSWORD.");
  }

  return problems;
}

module.exports = { config, validateConfig };
