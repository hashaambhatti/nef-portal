const db = require("../config/db");

async function getClasses() {
  const { rows } = await db.query(
    `SELECT school_id AS schoolId, no_of_classes AS noOfClasses,
      class_type AS classType, male_students AS maleStudents,
      female_students AS femaleStudents
     FROM classes ORDER BY school_id`
  );
  return rows;
}

// One summary row per school - delete + reinsert per school_id is simplest
// since there's no natural per-row id in the contract's shape.
async function saveClasses(classRows) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    for (const c of classRows) {
      await client.query("DELETE FROM classes WHERE school_id = ?", [c.schoolId]);
      await client.query(
        `INSERT INTO classes (school_id, no_of_classes, class_type, male_students, female_students)
         VALUES (?,?,?,?,?)`,
        [c.schoolId, c.noOfClasses || 0, c.classType || null, c.maleStudents || 0, c.femaleStudents || 0]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getClasses();
}

module.exports = { getClasses, saveClasses };
