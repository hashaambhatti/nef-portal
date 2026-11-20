const { z } = require("zod");
const { idSchema, dateSchema } = require("./common");

const text = (max) => z.string().trim().max(max).optional();

const coordinatesSchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    long: z.coerce.number().min(-180).max(180).optional()
  })
  .optional();

const buildingInput = z.object({
  type: text(100),
  noOfRooms: z.coerce.number().int().min(0).max(1000).optional(),
  noOfWashrooms: z.coerce.number().int().min(0).max(1000).optional(),
  drinkingWater: z.enum(["Yes", "No"]).optional(),
  electricity: z.enum(["Yes", "No"]).optional(),
  condition: text(50),
  specify: text(500)
});

const schoolBase = {
  name: z.string().trim().min(1, "name is required.").max(200),
  region: text(100),
  district: text(100),
  tehsil: text(100),
  uc: text(100),
  completeAddress: text(500),
  totalStudents: z.coerce.number().int().min(0).optional(),
  totalTeachers: z.coerce.number().int().min(0).optional(),
  contactNo: text(50),
  headTeacherName: text(150),
  headTeacherContactNo: text(50),
  coordinates: coordinatesSchema,
  buildingId: idSchema.optional().or(z.literal("")),
  schoolLevel: text(100),
  schoolType: text(100),
  schoolGender: text(50),
  schoolStatus: text(50),
  schoolSignBoard: text(50),
  dateOfEstablishment: dateSchema,
  // Optional building details, saved in the same transaction as the school.
  building: buildingInput.optional()
};

// POST /schools - schoolCode optional; generated as SCH-xxx when omitted.
const createSchoolSchema = z.object({ schoolCode: idSchema.optional(), ...schoolBase });

const updateSchoolSchema = z.object(schoolBase).partial();

module.exports = { createSchoolSchema, updateSchoolSchema };
