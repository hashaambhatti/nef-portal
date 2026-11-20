const { z } = require("zod");

// Record ids are only letters, digits, "-" and "_". Besides keeping the data
// clean, this means an id can never carry HTML or JavaScript into the
// dashboard (the frontend puts ids inside onclick="..." attributes) (S4).
const ID_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;
const idSchema = z.string().trim().regex(ID_PATTERN, "Must be 1-20 letters, digits, '-' or '_'.");

const emailSchema = z.string().trim().toLowerCase().email("A valid email address is required.").max(191);

// S9: at least 8 characters, with at least one letter and one digit.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a digit.");

// "" from an empty date input is allowed and stored as NULL.
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
  .optional()
  .or(z.literal(""))
  .nullable();

module.exports = { ID_PATTERN, idSchema, emailSchema, passwordSchema, dateSchema };
