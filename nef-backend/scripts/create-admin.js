#!/usr/bin/env node
// Creates (or resets the password of) an Admin account (F7).
// Public signup can only create Teachers, so this is how the first Admin is made.
//
// Usage:
//   ADMIN_NAME="Admin" ADMIN_EMAIL=admin@nef.gov.pk ADMIN_PASSWORD='S3cure-pass' npm run create-admin
// or interactively:
//   npm run create-admin

require("dotenv").config();
const readline = require("readline");
const mysql = require("mysql2/promise");
const { connectionOptions } = require("../src/config/db");
const { hashPassword } = require("../src/utils/password");
const { emailSchema, passwordSchema } = require("../src/validators/common");

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));
}

async function main() {
  let { ADMIN_NAME: name, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;

  if (!name || !email || !password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    name = name || (await ask(rl, "Admin full name: "));
    email = email || (await ask(rl, "Admin email: "));
    password = password || (await ask(rl, "Admin password (min 8 chars, letters + digits): "));
    rl.close();
  }

  const e = emailSchema.safeParse(email);
  if (!e.success) throw new Error("Invalid email address.");
  const p = passwordSchema.safeParse(password);
  if (!p.success) throw new Error(p.error.issues.map((i) => i.message).join(" "));
  if (!name) throw new Error("Name is required.");

  const { waitForConnections, connectionLimit, ...opts } = connectionOptions();
  const conn = await mysql.createConnection(opts);
  try {
    const hash = await hashPassword(password);
    const [rows] = await conn.query("SELECT id FROM users WHERE email = ?", [e.data]);
    if (rows.length) {
      await conn.query(
        "UPDATE users SET name = ?, password_hash = ?, role = 'Admin', teacher_id = NULL, token_version = token_version + 1 WHERE id = ?",
        [name, hash, rows[0].id]
      );
      console.log(`Existing account ${e.data} is now an Admin with the new password.`);
    } else {
      await conn.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'Admin')",
        [name, e.data, hash]
      );
      console.log(`Admin account created: ${e.data}`);
    }
  } finally {
    await conn.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("create-admin failed:", err.message);
    process.exit(1);
  });
