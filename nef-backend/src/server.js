const { config, validateConfig } = require("./config/env");

// Refuse to start with a broken configuration (S6).
const problems = validateConfig();
if (problems.length) {
  console.error("NEF backend cannot start - configuration problems:");
  for (const p of problems) console.error("  - " + p);
  console.error("See .env.example and README.md.");
  process.exit(1);
}

const app = require("./app");
const db = require("./config/db");

const server = app.listen(config.port, () => {
  console.log(`NEF backend listening on port ${config.port} (${config.isProduction ? "production" : "development"})`);
});

// Graceful shutdown so in-flight requests finish during a redeploy.
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    db.pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
