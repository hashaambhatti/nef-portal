const asyncHandler = require("../utils/asyncHandler");
const svc = require("../services/classes.service");

exports.getAll = asyncHandler(async (req, res) => res.status(200).json(await svc.getClasses()));
exports.bulkSave = asyncHandler(async (req, res) => res.status(200).json(await svc.saveClasses(req.body)));
