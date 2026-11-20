const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/attendance.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getAttendance(req.user)));
exports.bulkSave = asyncHandler(async (req, res) => res.status(200).json(await svc.saveAttendance(req.body, req.user)));
