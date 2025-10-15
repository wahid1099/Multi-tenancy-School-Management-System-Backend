import Joi from "joi";

const scheduleItemSchema = Joi.object({
  day: Joi.string()
    .required()
    .valid(
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    )
    .messages({
      "string.empty": "Day is required",
      "any.only": "Invalid day specified",
    }),
  startTime: Joi.string()
    .required()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.empty": "Start time is required",
      "string.pattern.base": "Invalid time format (HH:MM)",
    }),
  endTime: Joi.string()
    .required()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.empty": "End time is required",
      "string.pattern.base": "Invalid time format (HH:MM)",
    }),
  subject: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Subject is required",
      "string.pattern.base": "Invalid subject ID format",
    }),
  teacher: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Teacher is required",
      "string.pattern.base": "Invalid teacher ID format",
    }),
});

export const createClassSchema = Joi.object({
  name: Joi.string().required().trim().max(50).messages({
    "string.empty": "Class name is required",
    "string.max": "Class name cannot exceed 50 characters",
  }),
  section: Joi.string().required().trim().uppercase().max(10).messages({
    "string.empty": "Section is required",
    "string.max": "Section cannot exceed 10 characters",
  }),
  grade: Joi.string().required().trim().max(20).messages({
    "string.empty": "Grade is required",
    "string.max": "Grade cannot exceed 20 characters",
  }),
  academicYear: Joi.string()
    .required()
    .trim()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  classTeacher: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Class teacher is required",
      "string.pattern.base": "Invalid class teacher ID format",
    }),
  subjects: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid subject ID format",
        })
    )
    .optional(),
  capacity: Joi.number().required().integer().min(1).max(100).messages({
    "number.base": "Capacity must be a number",
    "number.integer": "Capacity must be an integer",
    "number.min": "Capacity must be at least 1",
    "number.max": "Capacity cannot exceed 100",
    "any.required": "Class capacity is required",
  }),
  room: Joi.string().optional().trim().max(50).messages({
    "string.max": "Room cannot exceed 50 characters",
  }),
  schedule: Joi.array().items(scheduleItemSchema).optional(),
});

export const updateClassSchema = Joi.object({
  name: Joi.string().optional().trim().max(50).messages({
    "string.max": "Class name cannot exceed 50 characters",
  }),
  section: Joi.string().optional().trim().uppercase().max(10).messages({
    "string.max": "Section cannot exceed 10 characters",
  }),
  grade: Joi.string().optional().trim().max(20).messages({
    "string.max": "Grade cannot exceed 20 characters",
  }),
  academicYear: Joi.string()
    .optional()
    .trim()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  classTeacher: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid class teacher ID format",
    }),
  subjects: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional(),
  capacity: Joi.number().optional().integer().min(1).max(100).messages({
    "number.integer": "Capacity must be an integer",
    "number.min": "Capacity must be at least 1",
    "number.max": "Capacity cannot exceed 100",
  }),
  room: Joi.string().optional().trim().max(50).messages({
    "string.max": "Room cannot exceed 50 characters",
  }),
  schedule: Joi.array().items(scheduleItemSchema).optional(),
  isActive: Joi.boolean().optional(),
});

export const addStudentSchema = Joi.object({
  studentId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student ID is required",
      "string.pattern.base": "Invalid student ID format",
    }),
});

export const removeStudentSchema = Joi.object({
  studentId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student ID is required",
      "string.pattern.base": "Invalid student ID format",
    }),
});

export const classQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  grade: Joi.string().optional().trim(),
  academicYear: Joi.string().optional().trim(),
  classTeacher: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("name", "grade", "section", "academicYear", "createdAt", "updatedAt")
    .default("name"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

export const classParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid class ID format",
      "any.required": "Class ID is required",
    }),
});
