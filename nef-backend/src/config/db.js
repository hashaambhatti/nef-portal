const mysql = require("mysql2/promise");
require("dotenv").config();

// Opens one connection pool. Works with either MYSQL_URL or discrete env vars.
//
// dateStrings: DATE columns come back as "YYYY-MM-DD" strings instead of JS
// Date objects, so dates never shift by a day because of time zones (F8).
//
// SSL: managed MySQL hosts (Aiven, etc.) require TLS. Put the provider's CA
// certificate text in MYSQL_SSL_CA, or set MYSQL_SSL=true to use TLS with the
// system's trusted CAs.
function sslOptions() {
  if (process.env.MYSQL_SSL_CA) {
    // Allow the certificate to be pasted with literal "\n" sequences too.
    return { ca: process.env.MYSQL_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true };
  }
  if (String(process.env.MYSQL_SSL || "").toLowerCase() === "true") {
    return { rejectUnauthorized: true };
  }
  return undefined;
}

const common = {
  waitForConnections: true,
  // Serverless (Vercel) may run several copies at once, each with its own
  // pool, so keep each pool small there to stay under the database's limit.
  connectionLimit: parseInt(process.env.MYSQL_POOL_SIZE, 10) || (process.env.VERCEL ? 3 : 10),
  dateStrings: true,
  ssl: sslOptions()
};

// Connection options, shared with scripts/ (setup-db, create-admin).
function connectionOptions(extra = {}) {
  return process.env.MYSQL_URL
    ? { uri: process.env.MYSQL_URL, ...common, ...extra }
    : {
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        ...common,
        ...extra
      };
}

const pool = mysql.createPool(connectionOptions());

module.exports = {
  // mysql2 returns [rows, fields]; normalised to { rows } for every service.
  // For INSERT/UPDATE/DELETE, rows is the ResultSetHeader (affectedRows, ...).
  query: async (sql, params) => {
    const [rows] = await pool.query(sql, params);
    return { rows };
  },
  getClient: async () => {
    const conn = await pool.getConnection();
    return {
      query: async (sql, params) => {
        const [rows] = await conn.query(sql, params);
        return { rows };
      },
      release: () => conn.release()
    };
  },
  pool,
  connectionOptions
};
