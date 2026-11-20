const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { nextId } = require("../utils/ids");
const { getTeacherSchool, assertStudentsInSchool } = require("../utils/scope");

const SELECT_STUDENT = `
  SELECT
    s.student_id AS studentId, s.name, s.b_form_number AS bFormNumber,
    s.date_of_birth AS dateOfBirth, s.age, s.teacher_id AS teacherId,
    t.name AS teacherName, s.school_name AS schoolName, s.class,
    s.date_of_admission AS dateOfAdmission, s.gender, s.orphan, s.disability,
    s.specify, s.pass_out_date AS passOutDate, s.result, s.refugee,
    s.child_in_labor AS childInLabor, s.mother_tongue AS motherTongue,
    s.can_understand_urdu AS canUnderstandUrdu, s.citizenship,
    s.residency_status AS residencyStatus, s.house, s.guardian_id AS guardianId,
    g.contact_no AS guardianContact
  FROM students s
  LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
  LEFT JOIN guardians g ON g.guardian_id = s.guardian_id
`;

// Admin: all students. Teacher: only students of their own school (S5).
async function getStudents(user) {
  const school = await getTeacherSchool(db, user);
  if (!school) {
    const { rows } = await db.query(`${SELECT_STUDENT} ORDER BY s.student_id`);
    return rows;
  }
  const { rows } = await db.query(
    `${SELECT_STUDENT} WHERE s.school_name = ? ORDER BY s.student_id`,
    [school.schoolName]
  );
  return rows;
}

async function getStudent(studentId) {
  const { rows } = await db.query(`${SELECT_STUDENT} WHERE s.student_id = ?`, [studentId]);
  return rows[0];
}

const nul = (v) => (v === "" || v === undefined ? null : v);

// Enrollment. Creates the guardian (if given), the student, and bumps the
// school's student count, all in one transaction (F5). Ids are generated
// server-side when not supplied (F10).
async function createStudent(data, user) {
  const client = await db.getClient();
  let studentId = data.studentId;
  try {
    await client.query("START TRANSACTION");

    const school = await getTeacherSchool(client, user);
    if (school) {
      // A teacher always enrolls into their own school, as themself.
      data = { ...data, schoolName: school.schoolName, teacherId: user.teacherId };
    }
    if (!studentId) studentId = await nextId(client, "students");

    let guardianId = nul(data.guardianId);
    if (data.guardian) {
      guardianId = await nextId(client, "guardians");
      const g = data.guardian;
      await client.query(
        `INSERT INTO guardians (guardian_id, name, cnic, contact_no, occupation) VALUES (?,?,?,?,?)`,
        [guardianId, g.name, nul(g.cnic), nul(g.contactNo), nul(g.occupation)]
      );
    }

    await client.query(
      `INSERT INTO students (
        student_id, name, b_form_number, date_of_birth, age, teacher_id, school_name,
        class, date_of_admission, gender, orphan, disability, specify, pass_out_date,
        result, refugee, child_in_labor, mother_tongue, can_understand_urdu,
        citizenship, residency_status, house, guardian_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        studentId, data.name, nul(data.bFormNumber), nul(data.dateOfBirth), data.age ?? null,
        nul(data.teacherId), nul(data.schoolName), data.class, nul(data.dateOfAdmission),
        data.gender, nul(data.orphan), nul(data.disability), nul(data.specify),
        nul(data.passOutDate), nul(data.result), nul(data.refugee), nul(data.childInLabor),
        nul(data.motherTongue), nul(data.canUnderstandUrdu), nul(data.citizenship),
        nul(data.residencyStatus), nul(data.house), guardianId
      ]
    );

    if (data.schoolName) {
      await client.query(
        `UPDATE schools SET total_students = COALESCE(total_students, 0) + 1 WHERE name = ?`,
        [data.schoolName]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getStudent(studentId);
}

const FIELD_MAP = {
  name: "name", bFormNumber: "b_form_number", dateOfBirth: "date_of_birth",
  age: "age", teacherId: "teacher_id", schoolName: "school_name", class: "class",
  dateOfAdmission: "date_of_admission", gender: "gender", orphan: "orphan",
  disability: "disability", specify: "specify", passOutDate: "pass_out_date",
  result: "result", refugee: "refugee", childInLabor: "child_in_labor",
  motherTongue: "mother_tongue", canUnderstandUrdu: "can_understand_urdu",
  citizenship: "citizenship", residencyStatus: "residency_status", house: "house",
  guardianId: "guardian_id"
};

async function updateStudent(studentId, data, user) {
  const existing = await db.query(
    "SELECT student_id, school_name AS schoolName FROM students WHERE student_id = ?",
    [studentId]
  );
  if (!existing.rows.length) throw new ApiError(404, "Student not found.");

  const school = await getTeacherSchool(db, user);
  if (school) {
    if (existing.rows[0].schoolName !== school.schoolName) {
      throw new ApiError(403, "You can only edit students of your own school.");
    }
    if (data.schoolName !== undefined && data.schoolName !== school.schoolName) {
      throw new ApiError(403, "Only an Admin can move a student to another school.");
    }
    if (data.guardianId !== undefined) delete data.guardianId; // guardians are edited separately
  }

  const sets = [];
  const values = [];
  for (const [jsKey, column] of Object.entries(FIELD_MAP)) {
    if (data[jsKey] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(nul(data[jsKey]));
    }
  }
  if (sets.length) {
    const client = await db.getClient();
    try {
      await client.query("START TRANSACTION");
      values.push(studentId);
      await client.query(`UPDATE students SET ${sets.join(", ")} WHERE student_id = ?`, values);
      const oldSchool = existing.rows[0].schoolName;
      if (data.schoolName !== undefined && nul(data.schoolName) !== oldSchool) {
        // Admin moved the student: keep both schools' counts right.
        if (oldSchool) {
          await client.query(
            `UPDATE schools SET total_students = GREATEST(COALESCE(total_students, 0) - 1, 0) WHERE name = ?`,
            [oldSchool]
          );
        }
        if (data.schoolName) {
          await client.query(
            `UPDATE schools SET total_students = COALESCE(total_students, 0) + 1 WHERE name = ?`,
            [data.schoolName]
          );
        }
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  return getStudent(studentId);
}

// Grade promotion: only class / result / passOutDate change. Teachers may
// only promote students of their own school.
async function saveStudents(students, user) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const school = await getTeacherSchool(client, user);
    await assertStudentsInSchool(client, students.map((s) => s.studentId), school);
    for (const s of students) {
      await client.query(
        `UPDATE students SET class = ?, result = ?, pass_out_date = ? WHERE student_id = ?`,
        [s.class, nul(s.result), nul(s.passOutDate), s.studentId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getStudents(user);
}

async function deleteStudent(studentId) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const { rows } = await client.query(
      "SELECT guardian_id AS guardianId, school_name AS schoolName FROM students WHERE student_id = ?",
      [studentId]
    );
    if (!rows.length) throw new ApiError(404, "Student not found.");
    const { guardianId, schoolName } = rows[0];

    await client.query("DELETE FROM attendance WHERE student_id = ?", [studentId]);
    await client.query("DELETE FROM students WHERE student_id = ?", [studentId]);

    // F11: only delete the guardian if no other student (e.g. a sibling) uses it.
    if (guardianId) {
      const others = await client.query(
        "SELECT COUNT(*) AS n FROM students WHERE guardian_id = ?", [guardianId]
      );
      if (Number(others.rows[0].n) === 0) {
        await client.query("DELETE FROM guardians WHERE guardian_id = ?", [guardianId]);
      }
    }
    if (schoolName) {
      await client.query(
        `UPDATE schools SET total_students = GREATEST(COALESCE(total_students, 0) - 1, 0) WHERE name = ?`,
        [schoolName]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { message: "Student record deleted successfully." };
}

module.exports = { getStudents, createStudent, updateStudent, saveStudents, deleteStudent };
