const { z } = require("zod");
const { idSchema, emailSchema, passwordSchema, dateSchema } = require("./common");

const loginSchema = z
  .object({
    username: z.string().trim().toLowerCase().min(1).optional(),
    email: emailSchema.optional(),
    password: z.string().min(1, "Password is required.").max(128)
  })
  .refine((d) => d.username || d.email, {
    message: "email is required.",
    path: ["email"]
  });

const yesNo = z.enum(["Yes", "No"]).optional();

const teacherProfileSchema = z.object({
  cnic: z.string().regex(/^\d{13}$/, "CNIC must be 13 digits.").optional().or(z.literal("")),
  contactNo: z.string().trim().max(50).optional(),
  schoolId: idSchema,
  qualification: z.string().max(150).optional(),
  professionalQualification: z.string().max(150).optional(),
  dateOfJoining: dateSchema,
  lastTrainingTaken: dateSchema,
  noOfTrainingsAttended: z.coerce.number().int().min(0).max(1000).optional(),
  androidPhone: yesNo,
  internetAccess: yesNo,
  bankAccountNo: z.string().trim().max(50).optional(),
  bankName: z.string().trim().max(150).optional(),
  iban: z.string().trim().max(50).optional()
});

// S1: public signup can ONLY create Teacher accounts. There is no "role"
// field any more - Admin accounts are created with `npm run create-admin`
// or by an existing Admin through POST /api/users.
const signupSchema = z.object({
  name: z.string().trim().min(1, "name is required.").max(150),
  email: emailSchema,
  password: passwordSchema,
  teacherProfile: teacherProfileSchema
});

module.exports = { loginSchema, signupSchema, teacherProfileSchema };
