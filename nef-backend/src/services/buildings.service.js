const db = require("../config/db");

async function getBuildings() {
  const { rows } = await db.query(
    `SELECT building_id AS buildingId, type, no_of_rooms AS noOfRooms,
      no_of_washrooms AS noOfWashrooms, drinking_water AS drinkingWater,
      electricity, condition_status AS \`condition\`, specify, school_id AS schoolId
     FROM buildings ORDER BY building_id`
  );
  return rows;
}

async function saveBuildings(buildings) {
  const client = await db.getClient();
  try {
    await client.query("START TRANSACTION");
    for (const b of buildings) {
      await client.query(
        `INSERT INTO buildings (building_id, type, no_of_rooms, no_of_washrooms,
          drinking_water, electricity, condition_status, specify, school_id)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           type = VALUES(type), no_of_rooms = VALUES(no_of_rooms),
           no_of_washrooms = VALUES(no_of_washrooms), drinking_water = VALUES(drinking_water),
           electricity = VALUES(electricity), condition_status = VALUES(condition_status),
           specify = VALUES(specify), school_id = VALUES(school_id)`,
        [b.buildingId, b.type || null, b.noOfRooms || null, b.noOfWashrooms || null,
         b.drinkingWater || null, b.electricity || null, b.condition || null,
         b.specify || null, b.schoolId || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getBuildings();
}

module.exports = { getBuildings, saveBuildings };
