import Joi from "joi";

const timeSlotSchema = Joi.object({
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
  room: Joi.string().optional().trim().max(50).messages({
    "string.max": "Room cannot exceed 50 characters",
  }),
  type: Joi.string()
    .valid("lecture", "lab", "tutorial", "break", "assembly")
    .default("lecture"),
});

const breakTimeSchema = Joi.object({
  name: Joi.string().required().trim().max(50).messages({
    "string.empty": "Break name is required",
    "string.max": "Break name cannot exceed 50 characters",
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
  days: Joi.array()
    .items(
      Joi.string().valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      )
    )
    .required()
    .min(1)
    .messages({
      "array.min": "At least one day is required for break time",
    }),
});

export const createTimetableSchema = Joi.object({
  class: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Class is required",
      "string.pattern.base": "Invalid class ID format",
    }),
  academicYear: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  term: Joi.string()
    .required()
    .valid("first", "second", "third", "annual")
    .messages({
      "string.empty": "Term is required",
      "any.only": "Invalid term specified",
    }),
  effectiveFrom: Joi.date().required().messages({
    "date.base": "Effective from date must be a valid date",
    "any.required": "Effective from date is required",
  }),
  effectiveTo: Joi.date()
    .required()
    .greater(Joi.ref("effectiveFrom"))
    .messages({
      "date.base": "Effective to date must be a valid date",
      "any.required": "Effective to date is required",
      "date.greater": "Effective to date must be after effective from date",
    }),
  timeSlots: Joi.array().items(timeSlotSchema).required().min(1).messages({
    "array.min": "At least one time slot is required",
    "any.required": "Time slots are required",
  }),
  breakTimes: Joi.array().items(breakTimeSchema).optional(),
  workingDays: Joi.array()
    .items(
      Joi.string().valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      )
    )
    .required()
    .min(1)
    .messages({
      "array.min": "At least one working day is required",
      "any.required": "Working days are required",
    }),
});

export const updateTimetableSchema = Joi.object({
  academicYear: Joi.string()
    .optional()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  term: Joi.string()
    .optional()
    .valid("first", "second", "third", "annual")
    .messages({
      "any.only": "Invalid term specified",
    }),
  effectiveFrom: Joi.date().optional(),
  effectiveTo: Joi.date()
    .optional()
    .when("effectiveFrom", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("effectiveFrom")),
      otherwise: Joi.date(),
    })
    .messages({
      "date.greater": "Effective to date must be after effective from date",
    }),
  timeSlots: Joi.array().items(timeSlotSchema).optional(),
  breakTimes: Joi.array().items(breakTimeSchema).optional(),
  workingDays: Joi.array()
    .items(
      Joi.string().valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      )
    )
    .optional(),
  isActive: Joi.boolean().optional(),
});

export const timetableQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  academicYear: Joi.string()
    .optional()
    .pattern(/^\d{4}-\d{4}$/),
  term: Joi.string().optional().valid("first", "second", "third", "annual"),
  isActive: Joi.boolean().optional(),
  effectiveDate: Joi.date().optional(),
  sortBy: Joi.string()
    .valid("effectiveFrom", "effectiveTo", "createdAt", "updatedAt")
    .default("effectiveFrom"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const teacherTimetableQuerySchema = Joi.object({
  teacher: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Teacher ID is required",
      "string.pattern.base": "Invalid teacher ID format",
    }),
  academicYear: Joi.string()
    .optional()
    .pattern(/^\d{4}-\d{4}$/),
  effectiveDate: Joi.date().optional(),
});

export const timetableParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid timetable ID format",
      "any.required": "Timetable ID is required",
    }),
});
