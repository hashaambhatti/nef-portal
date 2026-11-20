const { z } = require("zod");
const { idSchema } = require("./common");

const bulkAttendanceSchema = z
  .array(
    z.object({
      studentId: idSchema,
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD."),
      // Only "Present"/"Absent" are sent by js/pages/attendance.js today.
      status: z.enum(["Present", "Absent"])
    })
  )
  .max(20000);

module.exports = { bulkAttendanceSchema };
