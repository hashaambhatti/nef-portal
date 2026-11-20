const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/students", require("./students.routes"));
router.use("/guardians", require("./guardians.routes"));
router.use("/teachers", require("./teachers.routes"));
router.use("/schools", require("./schools.routes"));
router.use("/buildings", require("./buildings.routes"));
router.use("/classes", require("./classes.routes"));
router.use("/attendance", require("./attendance.routes"));

module.exports = router;
