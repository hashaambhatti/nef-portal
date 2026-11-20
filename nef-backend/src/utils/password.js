const bcrypt = require("bcryptjs");
const { config } = require("../config/env");

const hashPassword = (plain) => bcrypt.hash(plain, config.bcryptRounds);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// Compared against when a login email does not exist, so the response takes
// about as long as a wrong password and does not reveal which emails exist.
let dummyHash = null;
function getDummyHash() {
  if (!dummyHash) dummyHash = bcrypt.hashSync("nef-dummy-password", config.bcryptRounds);
  return dummyHash;
}

module.exports = { hashPassword, comparePassword, getDummyHash };
