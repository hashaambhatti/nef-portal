const { z } = require("zod");

const { idSchema } = require("./common");

const bulkBuildingsSchema = z.array(
  z.object({
    buildingId: idSchema,
    type: z.string().optional(),
    noOfRooms: z.coerce.number().int().min(0).optional(),
    noOfWashrooms: z.coerce.number().int().min(0).optional(),
    drinkingWater: z.enum(["Yes", "No"]).optional(),
    electricity: z.enum(["Yes", "No"]).optional(),
    condition: z.string().optional(),
    specify: z.string().optional(),
    schoolId: idSchema.optional()
  })
);

module.exports = { bulkBuildingsSchema };
