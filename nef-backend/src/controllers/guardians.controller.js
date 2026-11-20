const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/guardians.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getGuardians(req.user)));
exports.bulkSave = asyncHandler(async (req, res) => res.status(200).json(await svc.saveGuardians(req.body)));
exports.update = asyncHandler(async (req, res) => res.status(200).json(await svc.updateGuardian(req.params.guardianId, req.body, req.user)));
