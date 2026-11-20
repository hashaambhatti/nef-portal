#!/usr/bin/env node
// Creates all tables from db/schema.sql in the database configured in .env.
// Usage:  npm run db:setup
// Safe to re-run: every statement is CREATE TABLE IF NOT EXISTS.

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { connectionOptions } = require("../src/config/db");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  const { waitForConnections, connectionLimit, ...opts } = connectionOptions({ multipleStatements: true });
  const conn = await mysql.createConnection(opts);
  try {
    await conn.query(sql);
    const [tables] = await conn.query("SHOW TABLES");
    console.log(`Schema applied. Tables now present: ${tables.map((t) => Object.values(t)[0]).join(", ")}`);
  } finally {
    await conn.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Schema setup failed:", err.message);
    process.exit(1);
  });
