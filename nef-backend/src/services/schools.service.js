const db = require("../config/db");
const ApiError = require("../utils/ApiError");
const { nextId } = require("../utils/ids");

const SELECT = `
  SELECT school_code AS schoolCode, name, region, district, tehsil, uc,
    complete_address AS completeAddress, total_students AS totalStudents,
    total_teachers AS totalTeachers, contact_no AS contactNo,
    head_teacher_name AS headTeacherName, head_teacher_contact_no AS headTeacherContactNo,
    lat, lng,
    building_id AS buildingId, school_level AS schoolLevel, school_type AS schoolType,
    school_gender AS schoolGender, school_status AS schoolStatus,
    school_sign_board AS schoolSignBoard, date_of_establishment AS dateOfEstablishment
  FROM schools
`;

function mapRow(row) {
  if (!row) return row;
  const { lat, lng, ...rest } = row;
  return { ...rest, coordinates: { lat: lat === null ? null : Number(lat), long: lng === null ? null : Number(lng) } };
}

async function getSchools() {
  const { rows } = await db.query(`${SELECT} ORDER BY school_code`);
  return rows.map(mapRow);
}

// Unauthenticated - only what the signup form's dropdown needs.
async function getPublicSchools() {
  const { rows } = await db.query(
    `SELECT school_code AS schoolCode, name FROM schools ORDER BY name`
  );
  return rows;
}

async function upsertBuilding(client, buildingId, schoolCode, b) {
  await client.query(
    `INSERT INTO buildings (building_id, type, no_of_rooms, no_of_washrooms,
      drinking_water, electricity, condition_status, specify, school_id)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       type = VALUES(type), no_of_rooms = VALUES(no_of_rooms),
       no_of_washrooms = VALUES(no_of_washrooms), drinking_water = VALUES(drinking_water),
       electricity = VALUES(electricity), condition_status = VALUES(condition_status),
       specify = VALUES(specify), school_id = VALUES(school_id)`,
    [buildingId, b.type || null, b.noOfRooms ?? null, b.noOfWashrooms ?? null,
     b.drinkingWater || null, b.electricity || null, b.condition || null,
     b.specify || null, schoolCode]
  );
}

// Creates the school and (optionally) its building in one transaction.
// schoolCode / buildingId are generated server-side when not supplied (F10).
async function createSchool(s) {
  const client = await db.getClient();
  let schoolCode = s.schoolCode;
  try {
    await client.query("START TRANSACTION");
    if (!schoolCode) schoolCode = await nextId(client, "schools");
    let buildingId = s.buildingId || null;
    if (s.building && !buildingId) buildingId = await nextId(client, "buildings");

    await client.query(
      `INSERT INTO schools (school_code, name, region, district, tehsil, uc, complete_address,
        total_students, total_teachers, contact_no, head_teacher_name, head_teacher_contact_no,
        lat, lng, building_id, school_level, school_type, school_gender, school_status,
        school_sign_board, date_of_establishment)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [schoolCode, s.name, s.region || null, s.district || null, s.tehsil || null, s.uc || null,
       s.completeAddress || null, s.totalStudents || 0, s.totalTeachers || 0, s.contactNo || null,
       s.headTeacherName || null, s.headTeacherContactNo || null,
       s.coordinates?.lat ?? null, s.coordinates?.long ?? null,
       buildingId, s.schoolLevel || null, s.schoolType || null, s.schoolGender || null,
       s.schoolStatus || null, s.schoolSignBoard || null, s.dateOfEstablishment || null]
    );
    if (s.building) await upsertBuilding(client, buildingId, schoolCode, s.building);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await db.query(`${SELECT} WHERE school_code = ?`, [schoolCode]);
  return mapRow(rows[0]);
}

const FIELD_MAP = {
  name: "name", region: "region", district: "district", tehsil: "tehsil", uc: "uc",
  completeAddress: "complete_address", totalStudents: "total_students",
  totalTeachers: "total_teachers", contactNo: "contact_no",
  headTeacherName: "head_teacher_name", headTeacherContactNo: "head_teacher_contact_no",
  buildingId: "building_id", schoolLevel: "school_level", schoolType: "school_type",
  schoolGender: "school_gender", schoolStatus: "school_status",
  schoolSignBoard: "school_sign_board", dateOfEstablishment: "date_of_establishment"
};

async function updateSchool(schoolCode, s) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const existing = await client.query(
      "SELECT name, building_id AS buildingId FROM schools WHERE school_code = ? FOR UPDATE",
      [schoolCode]
    );
    if (!existing.rows.length) throw new ApiError(404, "School not found.");
    const old = existing.rows[0];

    let buildingId = s.buildingId || old.buildingId;
    if (s.building && !buildingId) buildingId = await nextId(client, "buildings");

    const sets = [], values = [];
    for (const [jsKey, col] of Object.entries(FIELD_MAP)) {
      if (jsKey === "buildingId") continue;
      if (s[jsKey] !== undefined) { sets.push(`${col} = ?`); values.push(s[jsKey] === "" ? null : s[jsKey]); }
    }
    if (buildingId !== old.buildingId) { sets.push("building_id = ?"); values.push(buildingId); }
    if (s.coordinates) {
      sets.push("lat = ?", "lng = ?");
      values.push(s.coordinates.lat ?? null, s.coordinates.long ?? null);
    }
    if (sets.length) {
      values.push(schoolCode);
      await client.query(`UPDATE schools SET ${sets.join(", ")} WHERE school_code = ?`, values);
    }
    // Students reference their school by name - keep them attached on rename.
    if (s.name !== undefined && s.name !== old.name) {
      await client.query("UPDATE students SET school_name = ? WHERE school_name = ?", [s.name, old.name]);
    }
    if (s.building) await upsertBuilding(client, buildingId, schoolCode, s.building);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  const { rows } = await db.query(`${SELECT} WHERE school_code = ?`, [schoolCode]);
  return mapRow(rows[0]);
}

async function deleteSchool(schoolCode) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    const { rows } = await client.query(
      "SELECT name, building_id AS buildingId FROM schools WHERE school_code = ?", [schoolCode]
    );
    if (!rows.length) throw new ApiError(404, "School not found.");

    const linked = await client.query(
      `SELECT (SELECT COUNT(*) FROM teachers WHERE school_id = ?) AS teachers,
              (SELECT COUNT(*) FROM students WHERE school_name = ?) AS students`,
      [schoolCode, rows[0].name]
    );
    const { teachers, students } = linked.rows[0];
    if (Number(teachers) > 0 || Number(students) > 0) {
      throw new ApiError(409, `This school still has ${teachers} teacher(s) and ${students} student(s). Move or remove them first.`);
    }

    await client.query("DELETE FROM classes WHERE school_id = ?", [schoolCode]);
    await client.query("DELETE FROM buildings WHERE school_id = ?", [schoolCode]);
    if (rows[0].buildingId) {
      await client.query("DELETE FROM buildings WHERE building_id = ?", [rows[0].buildingId]);
    }
    await client.query("DELETE FROM schools WHERE school_code = ?", [schoolCode]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return { message: "School record deleted successfully." };
}

module.exports = { getSchools, getPublicSchools, createSchool, updateSchool, deleteSchool };
