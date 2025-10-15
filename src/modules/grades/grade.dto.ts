import Joi from "joi";

const gradeItemSchema = Joi.object({
  student: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student is required",
      "string.pattern.base": "Invalid student ID format",
    }),
  marksObtained: Joi.number().required().min(0).messages({
    "number.base": "Marks obtained must be a number",
    "number.min": "Marks cannot be negative",
    "any.required": "Marks obtained is required",
  }),
  remarks: Joi.string().optional().trim().max(200).messages({
    "string.max": "Remarks cannot exceed 200 characters",
  }),
  isAbsent: Joi.boolean().optional().default(false),
});

const gradingScaleSchema = Joi.object({
  A: Joi.object({
    min: Joi.number().required().min(0).max(100),
    max: Joi.number().required().min(0).max(100),
  }).required(),
  B: Joi.object({
    min: Joi.number().required().min(0).max(100),
    max: Joi.number().required().min(0).max(100),
  }).required(),
  C: Joi.object({
    min: Joi.number().required().min(0).max(100),
    max: Joi.number().required().min(0).max(100),
  }).required(),
  D: Joi.object({
    min: Joi.number().required().min(0).max(100),
    max: Joi.number().required().min(0).max(100),
  }).required(),
  F: Joi.object({
    min: Joi.number().required().min(0).max(100),
    max: Joi.number().required().min(0).max(100),
  }).required(),
});

export const createGradeSchema = Joi.object({
  exam: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Exam is required",
      "string.pattern.base": "Invalid exam ID format",
    }),
  academicYear: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  gradingScale: gradingScaleSchema.optional(),
  grades: Joi.array().items(gradeItemSchema).required().min(1).messages({
    "array.min": "At least one grade is required",
    "any.required": "Grades are required",
  }),
});

export const updateGradeSchema = Joi.object({
  gradingScale: gradingScaleSchema.optional(),
  grades: Joi.array().items(gradeItemSchema).optional(),
});

export const publishGradeSchema = Joi.object({
  isPublished: Joi.boolean().required().valid(true).messages({
    "any.only": "Grades can only be published (set to true)",
    "any.required": "Publication status is required",
  }),
});

export const gradeQuerySchema = Joi.object({
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
  academicYear: Joi.string()
    .optional()
    .pattern(/^\d{4}-\d{4}$/),
  isPublished: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("averageMarks", "averagePercentage", "createdAt", "updatedAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const studentGradeQuerySchema = Joi.object({
  student: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student ID is required",
      "string.pattern.base": "Invalid student ID format",
    }),
  academicYear: Joi.string()
    .optional()
    .pattern(/^\d{4}-\d{4}$/),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
});

export const gradeReportSchema = Joi.object({
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  academicYear: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  reportType: Joi.string()
    .valid("summary", "detailed", "transcript")
    .default("summary"),
});

export const gradeParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid grade ID format",
      "any.required": "Grade ID is required",
    }),
});
