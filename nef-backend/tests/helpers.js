// Test harness: runs the services and middleware against an in-memory fake
// database, with tiny stand-ins for libraries that only matter at runtime
// (mysql2, express, bcryptjs, jsonwebtoken). Works before `npm install` too,
// as long as zod can be found.
const Module = require("module");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-1234";

const stubs = {
  dotenv: { config: () => ({}) },
  "mysql2/promise": {
    createPool: () => ({ query: async () => { throw new Error("real pool not used in tests"); }, end: async () => {} })
  },
  bcryptjs: {
    hash: async (p) => `hash:${p}`,
    hashSync: (p) => `hash:${p}`,
    compare: async (p, h) => h === `hash:${p}`
  },
  jsonwebtoken: {
    sign: (payload) => Buffer.from(JSON.stringify(payload)).toString("base64"),
    verify: (token) => {
      try { return JSON.parse(Buffer.from(token, "base64").toString()); } catch (e) { throw new Error("bad token"); }
    }
  },
  express: Object.assign(() => ({}), {
    Router: () => {
      const routes = [];
      const r = { routes };
      for (const m of ["get", "post", "put", "delete"]) {
        r[m] = (p, ...handlers) => { routes.push({ method: m.toUpperCase(), path: p, handlers }); return r; };
      }
      r.use = () => r;
      return r;
    }
  }),
  "express-rate-limit": () => { const mw = (req, res, next) => next(); mw.isRateLimiter = true; return mw; }
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
  return originalLoad.call(this, request, parent, isMain);
};

// ---- fake database -------------------------------------------------------
// Each test sets fakeDb.handler = (sql, params) => rows. Every query is logged.
const fakeDb = {
  log: [],
  handler: () => [],
  reset(handler) { this.log = []; this.handler = handler || (() => []); },
  async run(sql, params) {
    const norm = sql.replace(/\s+/g, " ").trim();
    this.log.push({ sql: norm, params });
    return { rows: await this.handler(norm, params || []) };
  }
};
const dbPath = path.join(__dirname, "..", "src", "config", "db.js");
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: {
    query: (sql, params) => fakeDb.run(sql, params),
    getClient: async () => ({ query: (sql, params) => fakeDb.run(sql, params), release: () => {} }),
    pool: { end: async () => {} },
    connectionOptions: () => ({})
  }
};

const src = (p) => require(path.join(__dirname, "..", "src", p));

module.exports = { fakeDb, src };
