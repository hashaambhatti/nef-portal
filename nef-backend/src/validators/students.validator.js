const { z } = require("zod");
const { idSchema, dateSchema } = require("./common");

const yesNo = z.enum(["Yes", "No"]).optional();
const text = (max) => z.string().trim().max(max).optional();

const studentBase = {
  name: z.string().trim().min(1, "name is required.").max(150),
  bFormNumber: text(20),
  dateOfBirth: dateSchema,
  age: z.coerce.number().int().min(0).max(30).optional(),
  teacherId: idSchema.optional().or(z.literal("")),
  schoolName: text(200),
  class: z.string().trim().min(1, "class is required.").max(50),
  dateOfAdmission: dateSchema,
  gender: z.enum(["Male", "Female"]),
  orphan: yesNo,
  disability: yesNo,
  specify: text(200),
  passOutDate: dateSchema,
  result: text(50),
  refugee: yesNo,
  childInLabor: text(150),
  motherTongue: text(50),
  canUnderstandUrdu: yesNo,
  citizenship: text(50),
  residencyStatus: text(50),
  house: text(100),
  guardianId: idSchema.optional().or(z.literal(""))
};

const guardianInput = z.object({
  name: z.string().trim().min(1, "Guardian name is required.").max(150),
  cnic: z.string().regex(/^\d{13}$/, "Guardian CNIC must be 13 digits.").optional().or(z.literal("")),
  contactNo: text(50),
  occupation: text(150)
});

// POST /students - studentId is optional: when omitted the server generates
// the next STD-xxx id. An optional `guardian` object creates the guardian in
// the same transaction (enrollment form).
const createStudentSchema = z.object({
  studentId: idSchema.optional(),
  ...studentBase,
  guardian: guardianInput.optional()
});

// PUT /students/:studentId - partial update; id comes from the URL.
const updateStudentSchema = z.object(studentBase).partial();

// PUT /students bulk (grade promotion) - only class/result/passOutDate change.
const bulkStudentsSchema = z
  .array(
    z.object({
      studentId: idSchema,
      class: z.string().trim().min(1).max(50),
      result: text(50),
      passOutDate: dateSchema
    })
  )
  .max(5000);

module.exports = { createStudentSchema, updateStudentSchema, bulkStudentsSchema, guardianInput };
