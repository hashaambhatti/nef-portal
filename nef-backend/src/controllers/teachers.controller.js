const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/teachers.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getTeachers(req.user)));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await svc.createTeacher(req.body)));
exports.update = asyncHandler(async (req, res) => res.status(200).json(await svc.updateTeacher(req.params.teacherId, req.body)));
exports.updateMe = asyncHandler(async (req, res) => res.status(200).json(await svc.updateMyTeacherProfile(req.user, req.body)));
exports.remove = asyncHandler(async (req, res) => res.status(200).json(await svc.deleteTeacher(req.params.teacherId)));
