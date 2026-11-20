const db = require("../config/db");
const { getTeacherSchool, assertStudentsInSchool } = require("../utils/scope");

// Admin: all records. Teacher: records of students in their own school (S5).
async function getAttendance(user) {
  const school = await getTeacherSchool(db, user);
  const base = `SELECT a.student_id AS studentId, DATE_FORMAT(a.date, '%Y-%m-%d') AS date, a.status
                FROM attendance a`;
  if (!school) {
    const { rows } = await db.query(`${base} ORDER BY a.date, a.student_id`);
    return rows;
  }
  const { rows } = await db.query(
    `${base} JOIN students s ON s.student_id = a.student_id
     WHERE s.school_name = ? ORDER BY a.date, a.student_id`,
    [school.schoolName]
  );
  return rows;
}

// Bulk upsert on (student_id, date). A teacher can only mark attendance for
// students of their own school.
async function saveAttendance(records, user) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const school = await getTeacherSchool(client, user);
    await assertStudentsInSchool(client, records.map((r) => r.studentId), school);
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance (student_id, date, status)
         VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE status = VALUES(status)`,
        [r.studentId, r.date, r.status]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { message: "Attendance saved successfully." };
}

module.exports = { getAttendance, saveAttendance };
