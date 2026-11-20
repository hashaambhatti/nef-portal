const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { hashPassword, comparePassword, getDummyHash } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const { nextId } = require("../utils/ids");

const USER_COLUMNS = `id, name, email, role, teacher_id AS teacherId`;

function publicUser(u) {
  return { id: u.id, username: u.email, name: u.name, email: u.email, role: u.role, teacherId: u.teacherId || null };
}

async function login(identifier, password) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash, token_version AS tokenVersion FROM users WHERE email = ?`,
    [String(identifier || "").trim().toLowerCase()]
  );
  const user = rows[0];

  // Always run one bcrypt comparison so a missing email and a wrong password
  // take the same time and return the same message.
  const valid = await comparePassword(password, user ? user.password_hash : getDummyHash());
  if (!user || !valid) throw new ApiError(401, "Invalid email or password.");

  const token = signToken({ sub: user.id, tv: Number(user.tokenVersion) || 0 });
  // teacherId is required by every teacher page in the dashboard.
  return { token, user: publicUser(user) };
}

// Public self-registration. Always creates a Teacher (S1).
async function signup({ name, email, password, teacherProfile: tp }) {
  const existing = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.rows.length) throw new ApiError(409, "An account with this email already exists.");

  const school = await db.query("SELECT school_code FROM schools WHERE school_code = ?", [tp.schoolId]);
  if (!school.rows.length) throw new ApiError(400, "Selected school does not exist.");

  const passwordHash = await hashPassword(password);
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");

    const teacherId = await nextId(client, "teachers");
    await client.query(
      `INSERT INTO teachers (teacher_id, name, cnic, contact_no, school_id, qualification,
        professional_qualification, date_of_joining, last_training_taken,
        no_of_trainings_attended, employment_status, android_phone, internet_access,
        bank_account_no, bank_name, iban)
       VALUES (?,?,?,?,?,?,?,?,?,?,'Employed',?,?,?,?,?)`,
      [teacherId, name, tp.cnic || null, tp.contactNo || null, tp.schoolId,
       tp.qualification || null, tp.professionalQualification || null, tp.dateOfJoining || null,
       tp.lastTrainingTaken || null, tp.noOfTrainingsAttended || 0,
       tp.androidPhone || null, tp.internetAccess || null, tp.bankAccountNo || null,
       tp.bankName || null, tp.iban || null]
    );

    await client.query(
      `UPDATE schools SET total_teachers = COALESCE(total_teachers, 0) + 1 WHERE school_code = ?`,
      [tp.schoolId]
    );

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, teacher_id) VALUES (?, ?, ?, 'Teacher', ?)`,
      [name, email, passwordHash, teacherId]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { message: "Account created successfully. You can now log in." };
}

// Revokes every token of this user (this device and all others).
async function logout(userId) {
  await db.query("UPDATE users SET token_version = token_version + 1 WHERE id = ?", [userId]);
  return { message: "Logged out." };
}

// ---- Admin: user management -------------------------------------------

async function getUsers() {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users ORDER BY id`);
  return rows.map(publicUser);
}

async function createUser({ name, email, password, role, teacherId }) {
  const existing = await db.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.rows.length) throw new ApiError(409, "An account with this email already exists.");
  if (role === "Teacher") {
    const t = await db.query("SELECT teacher_id FROM teachers WHERE teacher_id = ?", [teacherId]);
    if (!t.rows.length) throw new ApiError(400, "teacherId does not exist.");
  }
  const passwordHash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role, teacher_id) VALUES (?, ?, ?, ?, ?)`,
    [name, email, passwordHash, role, role === "Teacher" ? teacherId : null]
  );
  const created = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [rows.insertId]);
  return publicUser(created.rows[0]);
}

// Bulk edit, matched by id (F6). A new password is only set when
// `newPassword` is present (O2: no more guessing from a "$2" prefix).
async function saveUsers(users, actingUser) {
  const self = users.find((u) => Number(u.id) === Number(actingUser.id));
  if (self && self.role !== "Admin") {
    throw new ApiError(400, "You cannot remove your own Admin role.");
  }

  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    for (const u of users) {
      const sets = ["name = ?", "email = ?", "role = ?", "teacher_id = ?"];
      const values = [u.name, u.email, u.role, u.role === "Teacher" ? (u.teacherId || null) : null];
      if (u.newPassword) {
        sets.push("password_hash = ?", "token_version = token_version + 1");
        values.push(await hashPassword(u.newPassword));
      }
      values.push(u.id);
      const { rows } = await client.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
      if (!rows.affectedRows) throw new ApiError(404, `User ${u.id} not found.`);
    }
    // There must always be at least one Admin left.
    const { rows: admins } = await client.query("SELECT COUNT(*) AS n FROM users WHERE role = 'Admin'");
    if (Number(admins[0].n) < 1) throw new ApiError(400, "At least one Admin account must remain.");
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getUsers();
}

// ---- Any logged-in user: own account ------------------------------------

async function getMe(userId) {
  const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [userId]);
  if (!rows.length) throw new ApiError(404, "User not found.");
  return publicUser(rows[0]);
}

async function updateMe(userId, { name, email, currentPassword, newPassword }) {
  const { rows } = await db.query(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE id = ?`,
    [userId]
  );
  const user = rows[0];
  if (!user) throw new ApiError(404, "User not found.");

  const emailChanging = email !== undefined && email !== user.email;
  if (emailChanging || newPassword) {
    if (!currentPassword || !(await comparePassword(currentPassword, user.password_hash))) {
      throw new ApiError(400, "Your current password is required to change your email or password.", [
        { field: "currentPassword", message: "Current password is incorrect." }
      ]);
    }
  }
  if (emailChanging) {
    const taken = await db.query("SELECT id FROM users WHERE email = ? AND id <> ?", [email, userId]);
    if (taken.rows.length) throw new ApiError(409, "An account with this email already exists.");
  }

  const sets = [];
  const values = [];
  if (name !== undefined) { sets.push("name = ?"); values.push(name); }
  if (emailChanging) { sets.push("email = ?"); values.push(email); }
  let token = null;
  if (newPassword) {
    sets.push("password_hash = ?", "token_version = token_version + 1");
    values.push(await hashPassword(newPassword));
  }

  if (sets.length) {
    values.push(userId);
    await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
  }
  // Keep the teacher profile name in sync with the account name.
  if (name !== undefined && user.teacherId) {
    await db.query("UPDATE teachers SET name = ? WHERE teacher_id = ?", [name, user.teacherId]);
  }

  // A password change revokes old tokens, so hand back a fresh one for this device.
  if (newPassword) {
    const fresh = await db.query("SELECT token_version AS tv FROM users WHERE id = ?", [userId]);
    token = signToken({ sub: userId, tv: Number(fresh.rows[0].tv) || 0 });
  }
  const me = await getMe(userId);
  return token ? { user: me, token } : { user: me };
}

module.exports = { login, signup, logout, getUsers, createUser, saveUsers, getMe, updateMe, publicUser };
