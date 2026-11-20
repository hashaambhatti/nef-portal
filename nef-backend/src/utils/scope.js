const ApiError = require("./ApiError");

// Teacher data scoping (S5).
//
// A Teacher may only see and change students, guardians and attendance that
// belong to the school they are assigned to. students.school_name stores the
// school's name, so scoping compares against the name of the teacher's school.
// Admins are never scoped.

async function getTeacherSchool(client, user) {
  if (!user || user.role !== "Teacher") return null;
  if (!user.teacherId) throw new ApiError(403, "Your account is not linked to a teacher profile.");

  const { rows } = await client.query(
    `SELECT s.school_code AS schoolCode, s.name AS schoolName
     FROM teachers t JOIN schools s ON s.school_code = t.school_id
     WHERE t.teacher_id = ?`,
    [user.teacherId]
  );
  if (!rows.length) throw new ApiError(403, "Your teacher profile is not assigned to a school.");
  return rows[0];
}

// Throws 403 unless every studentId belongs to the teacher's school.
async function assertStudentsInSchool(client, studentIds, school) {
  if (!school) return; // Admin
  const ids = [...new Set(studentIds)];
  if (!ids.length) return;
  const { rows } = await client.query(
    `SELECT student_id AS studentId FROM students WHERE student_id IN (?) AND school_name = ?`,
    [ids, school.schoolName]
  );
  if (rows.length !== ids.length) {
    throw new ApiError(403, "You can only change records of students in your own school.");
  }
}

module.exports = { getTeacherSchool, assertStudentsInSchool };
