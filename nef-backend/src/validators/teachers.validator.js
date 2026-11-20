const { z } = require("zod");
const { idSchema, dateSchema } = require("./common");

const yesNo = z.enum(["Yes", "No"]).optional();
const text = (max) => z.string().trim().max(max).optional();

const teacherBase = {
  name: z.string().trim().min(1, "name is required.").max(150),
  cnic: z.string().regex(/^\d{13}$/, "CNIC must be 13 digits.").optional().or(z.literal("")),
  contactNo: text(50),
  schoolId: idSchema.optional().or(z.literal("")),
  qualification: text(150),
  professionalQualification: text(150),
  dateOfJoining: dateSchema,
  lastTrainingTaken: dateSchema,
  noOfTrainingsAttended: z.coerce.number().int().min(0).max(1000).optional(),
  employmentStatus: z.enum(["Employed", "Resigned", "Retired", "Terminated"]).optional(),
  androidPhone: yesNo,
  internetAccess: yesNo,
  bankAccountNo: text(50),
  bankName: text(150),
  iban: text(50)
};

// POST /teachers - teacherId optional; generated as TCH-xxx when omitted.
const createTeacherSchema = z.object({ teacherId: idSchema.optional(), ...teacherBase });

const updateTeacherSchema = z.object(teacherBase).partial();

// PUT /teachers/me - a Teacher edits their own profile. School assignment and
// employment status are Admin decisions, so they are not accepted here.
const { schoolId, employmentStatus, ...selfEditable } = teacherBase;
const updateMyTeacherSchema = z.object(selfEditable).partial();

module.exports = { createTeacherSchema, updateTeacherSchema, updateMyTeacherSchema };
