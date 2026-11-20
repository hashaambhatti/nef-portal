const { z } = require("zod");
const { idSchema, emailSchema, passwordSchema } = require("./common");

// PUT /api/users (Admin only) - bulk edit of existing accounts, matched by id
// (F6: matching by email made email changes impossible).
const bulkUsersSchema = z.array(
  z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().trim().min(1).max(150),
    email: emailSchema,
    role: z.enum(["Admin", "Teacher"]),
    // A new password, in plain text. Omit to keep the current one.
    newPassword: passwordSchema.optional(),
    teacherId: idSchema.nullable().optional()
  })
);

// POST /api/users (Admin only) - create an account of either role.
const createUserSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(["Admin", "Teacher"]),
    teacherId: idSchema.nullable().optional()
  })
  .refine((d) => d.role !== "Teacher" || d.teacherId, {
    message: "teacherId is required for Teacher accounts.",
    path: ["teacherId"]
  });

// PUT /api/users/me - any logged-in user edits their own account.
// Role can never be changed here. Changing email or password requires the
// current password.
const updateMeSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  email: emailSchema.optional(),
  currentPassword: z.string().max(128).optional(),
  newPassword: passwordSchema.optional()
});

module.exports = { bulkUsersSchema, createUserSchema, updateMeSchema };
