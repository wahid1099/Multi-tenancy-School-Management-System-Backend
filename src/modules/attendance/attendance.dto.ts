import Joi from "joi";

const attendanceRecordSchema = Joi.object({
  student: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student is required",
      "string.pattern.base": "Invalid student ID format",
    }),
  status: Joi.string()
    .required()
    .valid("present", "absent", "late", "excused")
    .messages({
      "string.empty": "Attendance status is required",
      "any.only": "Invalid attendance status",
    }),
  remarks: Joi.string().optional().trim().max(200).messages({
    "string.max": "Remarks cannot exceed 200 characters",
  }),
});

export const createAttendanceSchema = Joi.object({
  class: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Class is required",
      "string.pattern.base": "Invalid class ID format",
    }),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid subject ID format",
    }),
  date: Joi.date().required().max("now").messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
    "date.max": "Date cannot be in the future",
  }),
  period: Joi.number().optional().integer().min(1).max(10).messages({
    "number.integer": "Period must be an integer",
    "number.min": "Period must be at least 1",
    "number.max": "Period cannot exceed 10",
  }),
  records: Joi.array()
    .items(attendanceRecordSchema)
    .required()
    .min(1)
    .messages({
      "array.min": "At least one attendance record is required",
      "any.required": "Attendance records are required",
    }),
});

export const updateAttendanceSchema = Joi.object({
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid subject ID format",
    }),
  date: Joi.date().optional().max("now").messages({
    "date.max": "Date cannot be in the future",
  }),
  period: Joi.number().optional().integer().min(1).max(10).messages({
    "number.integer": "Period must be an integer",
    "number.min": "Period must be at least 1",
    "number.max": "Period cannot exceed 10",
  }),
  records: Joi.array().items(attendanceRecordSchema).optional(),
});

export const submitAttendanceSchema = Joi.object({
  isSubmitted: Joi.boolean().required().valid(true).messages({
    "any.only": "Attendance can only be submitted (set to true)",
    "any.required": "Submission status is required",
  }),
});

export const attendanceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  teacher: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional().min(Joi.ref("dateFrom")).messages({
    "date.min": "End date must be after start date",
  }),
  isSubmitted: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("date", "class", "attendancePercentage", "createdAt", "updatedAt")
    .default("date"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const attendanceReportSchema = Joi.object({
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  student: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  dateFrom: Joi.date().required().messages({
    "any.required": "Start date is required",
  }),
  dateTo: Joi.date().required().min(Joi.ref("dateFrom")).messages({
    "any.required": "End date is required",
    "date.min": "End date must be after start date",
  }),
  reportType: Joi.string()
    .valid("summary", "detailed", "student")
    .default("summary"),
});

export const attendanceParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid attendance ID format",
      "any.required": "Attendance ID is required",
    }),
});
