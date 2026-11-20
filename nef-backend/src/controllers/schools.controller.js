const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/schools.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getSchools()));
exports.getPublic = asyncHandler(async (req, res) => res.status(200).json(await svc.getPublicSchools()));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await svc.createSchool(req.body)));
exports.update = asyncHandler(async (req, res) => res.status(200).json(await svc.updateSchool(req.params.schoolCode, req.body)));
exports.remove = asyncHandler(async (req, res) => res.status(200).json(await svc.deleteSchool(req.params.schoolCode)));
