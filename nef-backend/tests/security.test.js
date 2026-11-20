const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { fakeDb, src } = require("./helpers");

beforeEach(() => fakeDb.reset());

// ---------------------------------------------------------------- S1
test("S1: signup schema has no role field - a sent role is dropped", () => {
  const { signupSchema } = src("validators/auth.validator");
  const r = signupSchema.safeParse({
    name: "Mallory", email: "m@x.com", password: "abcd1234", role: "Admin",
    teacherProfile: { schoolId: "SCH-001" }
  });
  assert.equal(r.success, true);
  assert.equal("role" in r.data, false);
});

test("S1: signup service always creates a Teacher account", async () => {
  const auth = src("services/auth.service");
  fakeDb.reset((sql) => {
    if (sql.startsWith("SELECT id FROM users")) return [];
    if (sql.startsWith("SELECT school_code FROM schools")) return [{ school_code: "SCH-001" }];
    if (sql.includes("MAX(CAST")) return [{ maxNum: 4 }];
    return { affectedRows: 1 };
  });
  await auth.signup({ name: "M", email: "m@x.com", password: "abcd1234", role: "Admin", teacherProfile: { schoolId: "SCH-001" } });
  const insertUser = fakeDb.log.find((q) => q.sql.startsWith("INSERT INTO users"));
  assert.match(insertUser.sql, /'Teacher'/);
  assert.equal(insertUser.params.includes("Admin"), false);
  const insertTeacher = fakeDb.log.find((q) => q.sql.startsWith("INSERT INTO teachers"));
  assert.equal(insertTeacher.params[0], "TCH-005"); // F10: MAX + 1
});

// ---------------------------------------------------------------- S2 / S3
test("S2/S3: every route that changes data, and user/teacher admin routes, are role-protected", () => {
  const authenticate = src("middleware/authenticate");
  const files = ["users", "students", "guardians", "teachers", "schools", "buildings", "classes", "attendance"];
  for (const f of files) {
    const router = src(`routes/${f}.routes`);
    for (const r of router.routes) {
      const isPublic = f === "schools" && r.path === "/public";
      if (isPublic) continue;
      assert.equal(r.handlers[0], authenticate, `${f} ${r.method} ${r.path} must authenticate first`);
      const isOwnAccount = f === "users" && r.path === "/me";
      if (r.method !== "GET" && !isOwnAccount) {
        assert.ok(r.handlers.some((h) => Array.isArray(h.allowedRoles)), `${f} ${r.method} ${r.path} must authorize`);
      }
    }
  }
  const users = src("routes/users.routes");
  for (const r of users.routes.filter((x) => x.path === "/")) {
    const roles = r.handlers.find((h) => h.allowedRoles).allowedRoles;
    assert.deepEqual(roles, ["Admin"], `users ${r.method} / must be Admin-only`);
  }
});

test("S3: a Teacher sees other teachers without CNIC / phone / bank details", async () => {
  const svc = src("services/teachers.service");
  fakeDb.reset(() => [
    { teacherId: "TCH-001", name: "Me", cnic: "1", contactNo: "2", bankAccountNo: "3", bankName: "4", iban: "5" },
    { teacherId: "TCH-002", name: "Other", cnic: "1", contactNo: "2", bankAccountNo: "3", bankName: "4", iban: "5" }
  ]);
  const list = await svc.getTeachers({ role: "Teacher", teacherId: "TCH-001" });
  assert.equal(list[0].iban, "5");
  for (const k of ["cnic", "contactNo", "bankAccountNo", "bankName", "iban"]) assert.equal(k in list[1], false);
  const adminList = await svc.getTeachers({ role: "Admin" });
  assert.equal(adminList[1].iban, "5");
});

// ---------------------------------------------------------------- S4
test("S4: ids with HTML/JS are rejected", () => {
  const { idSchema } = src("validators/common");
  assert.equal(idSchema.safeParse("STD-001").success, true);
  assert.equal(idSchema.safeParse("x');alert(1)//").success, false);
  assert.equal(idSchema.safeParse("<img src=x>").success, false);
});

// ---------------------------------------------------------------- S5
const teacherUser = { role: "Teacher", teacherId: "TCH-001" };
function scopedHandler(extra) {
  return (sql, params) => {
    if (sql.includes("FROM teachers t JOIN schools s")) return [{ schoolCode: "SCH-001", schoolName: "School A" }];
    return extra(sql, params);
  };
}

test("S5: a Teacher cannot edit a student of another school", async () => {
  const svc = src("services/students.service");
  fakeDb.reset(scopedHandler((sql) => {
    if (sql.startsWith("SELECT student_id, school_name")) return [{ student_id: "STD-009", schoolName: "School B" }];
    return [];
  }));
  await assert.rejects(svc.updateStudent("STD-009", { name: "x" }, teacherUser), { status: 403 });
});

test("S5: a Teacher cannot mark attendance for another school's student", async () => {
  const svc = src("services/attendance.service");
  fakeDb.reset(scopedHandler((sql) => {
    if (sql.includes("WHERE student_id IN (?) AND school_name = ?")) return [{ studentId: "STD-001" }];
    return [];
  }));
  await assert.rejects(
    svc.saveAttendance([
      { studentId: "STD-001", date: "2026-11-20", status: "Present" },
      { studentId: "STD-999", date: "2026-11-20", status: "Absent" }
    ], teacherUser),
    { status: 403 }
  );
  assert.ok(fakeDb.log.some((q) => q.sql === "ROLLBACK"));
});

test("S5: a Teacher's enrollment is forced into their own school and name", async () => {
  const svc = src("services/students.service");
  fakeDb.reset(scopedHandler((sql) => {
    if (sql.includes("MAX(CAST")) return [{ maxNum: 0 }];
    if (sql.startsWith("SELECT s.student_id")) return [{ studentId: "STD-001" }];
    return { affectedRows: 1 };
  }));
  await svc.createStudent({ name: "Ali", class: "Prep", gender: "Male", schoolName: "School B", teacherId: "TCH-002",
    guardian: { name: "Father" } }, teacherUser);
  const ins = fakeDb.log.find((q) => q.sql.startsWith("INSERT INTO students"));
  assert.equal(ins.params[0], "STD-001");
  assert.equal(ins.params[5], "TCH-001");
  assert.equal(ins.params[6], "School A");
  assert.equal(ins.params[22], "GRD-001");
});

// ---------------------------------------------------------------- S6
test("S6: production config refuses missing CORS origin and weak JWT secret", () => {
  const saved = { ...process.env };
  try {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "short";
    delete process.env.CORS_ORIGIN;
    process.env.MYSQL_HOST = "h"; process.env.MYSQL_DATABASE = "d"; process.env.MYSQL_USER = "u";
    const p = require.resolve("../src/config/env");
    delete require.cache[p];
    const { validateConfig } = require(p);
    const problems = validateConfig().join(" ");
    assert.match(problems, /JWT_SECRET/);
    assert.match(problems, /CORS_ORIGIN/);
  } finally {
    process.env = saved;
    delete require.cache[require.resolve("../src/config/env")];
  }
});

// ---------------------------------------------------------------- S9
test("S9: weak passwords are rejected", () => {
  const { passwordSchema } = src("validators/common");
  assert.equal(passwordSchema.safeParse("abc12").success, false);
  assert.equal(passwordSchema.safeParse("password").success, false);
  assert.equal(passwordSchema.safeParse("passw0rd1").success, true);
});

test("S9: a token issued before logout is rejected", async () => {
  const authenticate = src("middleware/authenticate");
  const { signToken } = src("utils/jwt");
  const token = signToken({ sub: 1, tv: 0 });
  fakeDb.reset(() => [{ id: 1, role: "Admin", tokenVersion: 1 }]); // bumped by logout
  const err = await new Promise((resolve) =>
    authenticate({ headers: { authorization: `Bearer ${token}` } }, {}, resolve)
  );
  assert.equal(err.status, 401);
});

test("S9: role is read from the database, not trusted from the token", async () => {
  const authenticate = src("middleware/authenticate");
  const { signToken } = src("utils/jwt");
  const token = signToken({ sub: 1, tv: 3, role: "Admin" });
  fakeDb.reset(() => [{ id: 1, role: "Teacher", teacherId: "TCH-001", tokenVersion: 3 }]);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const err = await new Promise((resolve) => authenticate(req, {}, resolve));
  assert.equal(err, undefined);
  assert.equal(req.user.role, "Teacher");
});
