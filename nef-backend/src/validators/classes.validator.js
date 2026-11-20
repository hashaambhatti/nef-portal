const { z } = require("zod");

const { idSchema } = require("./common");

const bulkClassesSchema = z.array(
  z.object({
    schoolId: idSchema,
    noOfClasses: z.coerce.number().int().min(0).optional(),
    classType: z.string().optional(),
    maleStudents: z.coerce.number().int().min(0).optional(),
    femaleStudents: z.coerce.number().int().min(0).optional()
  })
);

module.exports = { bulkClassesSchema };
