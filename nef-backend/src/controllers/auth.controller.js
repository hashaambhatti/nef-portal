const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const authService = require("../services/auth.service");
const { config } = require("../config/env");

exports.login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  res.status(200).json(await authService.login(email || username, password));
});

exports.signup = asyncHandler(async (req, res) => {
  if (!config.allowSignup) throw new ApiError(403, "Self-registration is turned off. Ask an Admin to create your account.");
  res.status(201).json(await authService.signup(req.body));
});

exports.logout = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.logout(req.user.id));
});

exports.getUsers = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.getUsers());
});

exports.createUser = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.createUser(req.body));
});

exports.saveUsers = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.saveUsers(req.body, req.user));
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.getMe(req.user.id));
});

exports.updateMe = asyncHandler(async (req, res) => {
  res.status(200).json(await authService.updateMe(req.user.id, req.body));
});
