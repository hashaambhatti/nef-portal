const jwt = require("jsonwebtoken");
const { config } = require("../config/env");

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: "HS256"
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
}

module.exports = { signToken, verifyToken };
