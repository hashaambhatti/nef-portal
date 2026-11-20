const { z } = require("zod");
const { idSchema } = require("./common");

const guardianFields = {
  name: z.string().trim().min(1).max(150),
  cnic: z.string().regex(/^\d{13}$/, "CNIC must be 13 digits.").optional().or(z.literal("")),
  contactNo: z.string().trim().max(50).optional(),
  occupation: z.string().trim().max(150).optional()
};

// PUT /guardians (Admin only) - bulk upsert.
const bulkGuardiansSchema = z.array(z.object({ guardianId: idSchema, ...guardianFields })).max(5000);

// PUT /guardians/:guardianId - one guardian (Admin, or Teacher of that school).
const updateGuardianSchema = z.object(guardianFields).partial();

module.exports = { bulkGuardiansSchema, updateGuardianSchema };
