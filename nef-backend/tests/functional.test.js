const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { fakeDb, src } = require("./helpers");

beforeEach(() => fakeDb.reset());

test("Login returns teacherId and id (needed by every teacher page)", async () => {
  const auth = src("services/auth.service");
  fakeDb.reset(() => [{ id: 7, name: "Amara", email: "amara@nef.gov.pk", role: "Teacher", teacherId: "TCH-001",
    password_hash: "hash:passw0rd1", tokenVersion: 2 }]);
  const res = await auth.login("Amara@NEF.gov.pk", "passw0rd1");
  assert.equal(res.user.teacherId, "TCH-001");
  assert.equal(res.user.id, 7);
  assert.equal(fakeDb.log[0].params[0], "amara@nef.gov.pk");
});

test("Login gives the same error for unknown email and wrong password", async () => {
  const auth = src("services/auth.service");
  fakeDb.reset(() => []);
  await assert.rejects(auth.login("nobody@x.com", "x"), { status: 401, message: "Invalid email or password." });
  fakeDb.reset(() => [{ id: 1, password_hash: "hash:right1234" }]);
  await assert.rejects(auth.login("a@x.com", "wrong1234"), { status: 401, message: "Invalid email or password." });
});

test("F6: Admin bulk user edit matches by id, so the email can change", async () => {
  const auth = src("services/auth.service");
  fakeDb.reset((sql) => {
    if (sql.startsWith("UPDATE users")) return { affectedRows: 1 };
    if (sql.includes("COUNT(*) AS n FROM users")) return [{ n: 1 }];
    return [];
  });
  await auth.saveUsers([{ id: 5, name: "T", email: "new@x.com", role: "Teacher", teacherId: "TCH-001" }], { id: 1 });
  const upd = fakeDb.log.find((q) => q.sql.startsWith("UPDATE users"));
  assert.match(upd.sql, /WHERE id = \?$/);
  assert.equal(upd.params.at(-1), 5);
  assert.equal(upd.params[1], "new@x.com");
});

test("F6: an Admin cannot remove their own Admin role", async () => {
  const auth = src("services/auth.service");
  await assert.rejects(
    auth.saveUsers([{ id: 1, name: "A", email: "a@x.com", role: "Teacher" }], { id: 1 }),
    { status: 400 }
  );
});

test("F6: changing own email needs the current password", async () => {
  const auth = src("services/auth.service");
  fakeDb.reset(() => [{ id: 3, email: "old@x.com", password_hash: "hash:right1234" }]);
  await assert.rejects(auth.updateMe(3, { email: "new@x.com", currentPassword: "wrong" }), { status: 400 });
});

test("F10: next id uses the highest existing number", async () => {
  const { nextId } = src("utils/ids");
  fakeDb.reset(() => [{ maxNum: 12 }]);
  assert.equal(await nextId({ query: (s, p) => fakeDb.run(s, p) }, "students"), "STD-013");
  fakeDb.reset(() => [{ maxNum: null }]);
  assert.equal(await nextId({ query: (s, p) => fakeDb.run(s, p) }, "schools"), "SCH-001");
});

test("F11: deleting a student keeps a guardian shared with a sibling", async () => {
  const svc = src("services/students.service");
  fakeDb.reset((sql) => {
    if (sql.startsWith("SELECT guardian_id")) return [{ guardianId: "GRD-001", schoolName: "School A" }];
    if (sql.includes("COUNT(*) AS n FROM students WHERE guardian_id")) return [{ n: 1 }];
    return { affectedRows: 1 };
  });
  await svc.deleteStudent("STD-001");
  assert.equal(fakeDb.log.some((q) => q.sql.startsWith("DELETE FROM guardians")), false);
  assert.ok(fakeDb.log.some((q) => q.sql === "COMMIT"));
});

test("F11: deleting the only child of a guardian removes the guardian", async () => {
  const svc = src("services/students.service");
  fakeDb.reset((sql) => {
    if (sql.startsWith("SELECT guardian_id")) return [{ guardianId: "GRD-001", schoolName: "School A" }];
    if (sql.includes("COUNT(*) AS n FROM students WHERE guardian_id")) return [{ n: 0 }];
    return { affectedRows: 1 };
  });
  await svc.deleteStudent("STD-001");
  assert.ok(fakeDb.log.some((q) => q.sql.startsWith("DELETE FROM guardians")));
});

test("Promotion bulk save only touches class/result/passOutDate", async () => {
  const svc = src("services/students.service");
  fakeDb.reset(() => []);
  await svc.saveStudents([{ studentId: "STD-001", class: "Grade 2", result: "Pass", passOutDate: "" }], { role: "Admin" });
  const upd = fakeDb.log.find((q) => q.sql.startsWith("UPDATE students"));
  assert.equal(upd.sql, "UPDATE students SET class = ?, result = ?, pass_out_date = ? WHERE student_id = ?");
  assert.deepEqual(upd.params, ["Grade 2", "Pass", null, "STD-001"]);
});

test("School create generates codes and saves the building in the same transaction", async () => {
  const svc = src("services/schools.service");
  let n = 0;
  fakeDb.reset((sql) => {
    if (sql.includes("MAX(CAST")) return [{ maxNum: n++ === 0 ? 3 : 8 }];
    if (sql.startsWith("SELECT school_code AS schoolCode")) return [{ schoolCode: "SCH-004", lat: "33.6", lng: null }];
    return { affectedRows: 1 };
  });
  const s = await svc.createSchool({ name: "New", building: { type: "Rented", noOfRooms: 2 } });
  const insSchool = fakeDb.log.find((q) => q.sql.startsWith("INSERT INTO schools"));
  const insBuilding = fakeDb.log.find((q) => q.sql.startsWith("INSERT INTO buildings"));
  assert.equal(insSchool.params[0], "SCH-004");
  assert.equal(insBuilding.params[0], "BLD-009");
  assert.equal(insBuilding.params[8], "SCH-004");
  assert.deepEqual(s.coordinates, { lat: 33.6, long: null });
});

test("Validators: empty date inputs are accepted and dates must be YYYY-MM-DD", () => {
  const { createStudentSchema } = src("validators/students.validator");
  const base = { name: "A", class: "Prep", gender: "Male" };
  assert.equal(createStudentSchema.safeParse({ ...base, passOutDate: "" }).success, true);
  assert.equal(createStudentSchema.safeParse({ ...base, dateOfBirth: "20/11/2020" }).success, false);
});
