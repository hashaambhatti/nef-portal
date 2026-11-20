const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/students.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getStudents(req.user)));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await svc.createStudent(req.body, req.user)));
exports.update = asyncHandler(async (req, res) => res.status(200).json(await svc.updateStudent(req.params.studentId, req.body, req.user)));
// Grade promotion (js/pages/promotion.js) - class/result/passOutDate only.
exports.bulkSave = asyncHandler(async (req, res) => res.status(200).json(await svc.saveStudents(req.body, req.user)));
exports.remove = asyncHandler(async (req, res) => res.status(200).json(await svc.deleteStudent(req.params.studentId)));
