const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { nextId } = require("../utils/ids");

const SELECT = `
  SELECT teacher_id AS teacherId, name, cnic, contact_no AS contactNo,
    school_id AS schoolId, qualification, professional_qualification AS professionalQualification,
    date_of_joining AS dateOfJoining, last_training_taken AS lastTrainingTaken,
    no_of_trainings_attended AS noOfTrainingsAttended, employment_status AS employmentStatus,
    android_phone AS androidPhone, internet_access AS internetAccess,
    bank_account_no AS bankAccountNo, bank_name AS bankName, iban
  FROM teachers
`;

// Fields only an Admin (or the teacher themself) may see (S3).
const PRIVATE_FIELDS = ["cnic", "contactNo", "bankAccountNo", "bankName", "iban"];

function redact(teacher) {
  const copy = { ...teacher };
  for (const f of PRIVATE_FIELDS) delete copy[f];
  return copy;
}

// Admin: everything. Teacher: own record in full, everyone else without
// CNIC / phone / bank details (the dashboard still needs names to show
// "teacher name" next to students).
async function getTeachers(user) {
  const { rows } = await db.query(`${SELECT} ORDER BY teacher_id`);
  if (user && user.role === "Admin") return rows;
  return rows.map((t) => (user && t.teacherId === user.teacherId ? t : redact(t)));
}

const FIELD_MAP = {
  name: "name", cnic: "cnic", contactNo: "contact_no", schoolId: "school_id",
  qualification: "qualification", professionalQualification: "professional_qualification",
  dateOfJoining: "date_of_joining", lastTrainingTaken: "last_training_taken",
  noOfTrainingsAttended: "no_of_trainings_attended", employmentStatus: "employment_status",
  androidPhone: "android_phone", internetAccess: "internet_access",
  bankAccountNo: "bank_account_no", bankName: "bank_name", iban: "iban"
};

async function createTeacher(t) {
  const client = await db.getClient();
  let teacherId = t.teacherId;
  try {
    await client.query("START TRANSACTION");
    if (!teacherId) teacherId = await nextId(client, "teachers");
    await client.query(
      `INSERT INTO teachers (teacher_id, name, cnic, contact_no, school_id, qualification,
        professional_qualification, date_of_joining, last_training_taken,
        no_of_trainings_attended, employment_status, android_phone, internet_access,
        bank_account_no, bank_name, iban)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [teacherId, t.name, t.cnic || null, t.contactNo || null, t.schoolId || null,
       t.qualification || null, t.professionalQualification || null, t.dateOfJoining || null,
       t.lastTrainingTaken || null, t.noOfTrainingsAttended || 0, t.employmentStatus || "Employed",
       t.androidPhone || null, t.internetAccess || null, t.bankAccountNo || null,
       t.bankName || null, t.iban || null]
    );
    if (t.schoolId) {
      await client.query(
        `UPDATE schools SET total_teachers = COALESCE(total_teachers, 0) + 1 WHERE school_code = ?`,
        [t.schoolId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await db.query(`${SELECT} WHERE teacher_id = ?`, [teacherId]);
  return rows[0];
}

async function updateTeacher(teacherId, t, allowedKeys = Object.keys(FIELD_MAP)) {
  const existing = await db.query("SELECT teacher_id, school_id AS schoolId FROM teachers WHERE teacher_id = ?", [teacherId]);
  if (!existing.rows.length) throw new ApiError(404, "Teacher not found.");

  const sets = [], values = [];
  for (const jsKey of allowedKeys) {
    if (t[jsKey] !== undefined) {
      sets.push(`${FIELD_MAP[jsKey]} = ?`);
      values.push(t[jsKey] === "" ? null : t[jsKey]);
    }
  }
  if (sets.length) {
    values.push(teacherId);
    await db.query(`UPDATE teachers SET ${sets.join(", ")} WHERE teacher_id = ?`, values);
  }
  if (t.name !== undefined) {
    // Keep the login account's display name in sync.
    await db.query("UPDATE users SET name = ? WHERE teacher_id = ?", [t.name, teacherId]);
  }
  const { rows } = await db.query(`${SELECT} WHERE teacher_id = ?`, [teacherId]);
  return rows[0];
}

// A Teacher editing their own profile: school and employment status excluded.
async function updateMyTeacherProfile(user, t) {
  if (!user.teacherId) throw new ApiError(400, "Your account has no teacher profile.");
  const selfKeys = Object.keys(FIELD_MAP).filter((k) => k !== "schoolId" && k !== "employmentStatus");
  return updateTeacher(user.teacherId, t, selfKeys);
}

async function deleteTeacher(teacherId) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const { rows } = await client.query("SELECT school_id AS schoolId FROM teachers WHERE teacher_id = ?", [teacherId]);
    if (!rows.length) throw new ApiError(404, "Teacher not found.");

    const linked = await client.query(
      `SELECT (SELECT COUNT(*) FROM students WHERE teacher_id = ?) AS students,
              (SELECT COUNT(*) FROM users WHERE teacher_id = ?) AS accounts`,
      [teacherId, teacherId]
    );
    const { students, accounts } = linked.rows[0];
    if (Number(students) > 0) {
      throw new ApiError(409, `This teacher still has ${students} student(s). Reassign them first.`);
    }
    // Remove the teacher's login account along with the profile.
    if (Number(accounts) > 0) await client.query("DELETE FROM users WHERE teacher_id = ?", [teacherId]);
    await client.query("DELETE FROM teachers WHERE teacher_id = ?", [teacherId]);
    if (rows[0].schoolId) {
      await client.query(
        `UPDATE schools SET total_teachers = GREATEST(COALESCE(total_teachers, 0) - 1, 0) WHERE school_code = ?`,
        [rows[0].schoolId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { message: "Teacher record deleted successfully." };
}

module.exports = { getTeachers, createTeacher, updateTeacher, updateMyTeacherProfile, deleteTeacher, redact };
