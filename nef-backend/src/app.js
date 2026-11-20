const { config, validateConfig } = require("./config/env");

// On Vercel this file is the entry point (src/server.js is not run there),
// so the same startup configuration check happens here.
if (process.env.VERCEL) {
  const problems = validateConfig();
  if (problems.length) {
    throw new Error("NEF backend configuration problems: " + problems.join(" "));
  }
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const db = require("./config/db");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { generalLimiter } = require("./middleware/rateLimiter");

const app = express();

// Behind Render / nginx the client IP comes from X-Forwarded-For. Without
// this the rate limiter would treat every user as the proxy's IP (S7).
app.set("trust proxy", config.trustProxy);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    // Only the exact frontend origin(s) - never "*" (S6).
    origin(origin, callback) {
      // Requests without an Origin header (curl, health checks) are allowed;
      // browsers always send one for cross-origin calls.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600
  })
);
app.use(express.json({ limit: "2mb" }));
if (!config.isTest) app.use(morgan(config.isProduction ? "combined" : "dev"));

app.use("/api", generalLimiter, routes);

// Liveness + database check (F12). Returns 503 if MySQL is unreachable, so
// the hosting platform's health check notices a broken deployment.
app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "ok" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
