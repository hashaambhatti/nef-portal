// Generates the next human-readable id ("TCH-007", "STD-123", ...).
//
// Uses the highest existing number, not COUNT(*) + 1, so deleting a record
// never causes the next id to collide with an existing one (F10).
// Call it inside the same transaction as the INSERT.

const TABLES = {
  teachers: { column: "teacher_id", prefix: "TCH" },
  students: { column: "student_id", prefix: "STD" },
  guardians: { column: "guardian_id", prefix: "GRD" },
  schools: { column: "school_code", prefix: "SCH" },
  buildings: { column: "building_id", prefix: "BLD" }
};

async function nextId(client, table) {
  const spec = TABLES[table];
  if (!spec) throw new Error(`nextId: unknown table ${table}`);
  const { column, prefix } = spec;
  // Table and column names come from the fixed map above, never from input.
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(${column}, ?) AS UNSIGNED)), 0) AS maxNum
     FROM ${table} WHERE ${column} LIKE ? FOR UPDATE`,
    [prefix.length + 2, `${prefix}-%`]
  );
  const next = Number(rows[0] ? rows[0].maxNum : 0) + 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

module.exports = { nextId };
