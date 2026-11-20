const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/buildings.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getBuildings()));
exports.bulkSave = asyncHandler(async (req, res) => res.status(200).json(await svc.saveBuildings(req.body)));
