const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { getTeacherSchool } = require("../utils/scope");

const SELECT = `SELECT g.guardian_id AS guardianId, g.name, g.cnic, g.contact_no AS contactNo, g.occupation FROM guardians g`;

// Admin: all. Teacher: guardians of students in their own school (S5).
async function getGuardians(user) {
  const school = await getTeacherSchool(db, user);
  if (!school) {
    const { rows } = await db.query(`${SELECT} ORDER BY g.guardian_id`);
    return rows;
  }
  const { rows } = await db.query(
    `${SELECT} WHERE g.guardian_id IN (SELECT guardian_id FROM students WHERE school_name = ?)
     ORDER BY g.guardian_id`,
    [school.schoolName]
  );
  return rows;
}

// Admin-only bulk upsert.
async function saveGuardians(guardians) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    for (const g of guardians) {
      await client.query(
        `INSERT INTO guardians (guardian_id, name, cnic, contact_no, occupation)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), cnic = VALUES(cnic),
           contact_no = VALUES(contact_no), occupation = VALUES(occupation)`,
        [g.guardianId, g.name, g.cnic || null, g.contactNo || null, g.occupation || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getGuardians({ role: "Admin" });
}

const FIELD_MAP = { name: "name", cnic: "cnic", contactNo: "contact_no", occupation: "occupation" };

async function updateGuardian(guardianId, data, user) {
  const existing = await db.query("SELECT guardian_id FROM guardians WHERE guardian_id = ?", [guardianId]);
  if (!existing.rows.length) throw new ApiError(404, "Guardian not found.");

  const school = await getTeacherSchool(db, user);
  if (school) {
    const { rows } = await db.query(
      "SELECT COUNT(*) AS n FROM students WHERE guardian_id = ? AND school_name = ?",
      [guardianId, school.schoolName]
    );
    if (Number(rows[0].n) === 0) throw new ApiError(403, "You can only edit guardians of students in your own school.");
  }

  const sets = [], values = [];
  for (const [k, col] of Object.entries(FIELD_MAP)) {
    if (data[k] !== undefined) { sets.push(`${col} = ?`); values.push(data[k] === "" ? null : data[k]); }
  }
  if (sets.length) {
    values.push(guardianId);
    await db.query(`UPDATE guardians SET ${sets.join(", ")} WHERE guardian_id = ?`, values);
  }
  const { rows } = await db.query(`${SELECT} WHERE g.guardian_id = ?`, [guardianId]);
  return rows[0];
}

module.exports = { getGuardians, saveGuardians, updateGuardian };
