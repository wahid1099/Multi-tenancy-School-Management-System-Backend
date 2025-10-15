import Joi from "joi";

export const createSubjectSchema = Joi.object({
  name: Joi.string().required().trim().max(100).messages({
    "string.empty": "Subject name is required",
    "string.max": "Subject name cannot exceed 100 characters",
  }),
  code: Joi.string().required().trim().uppercase().max(20).messages({
    "string.empty": "Subject code is required",
    "string.max": "Subject code cannot exceed 20 characters",
  }),
  description: Joi.string().optional().trim().max(500).messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  category: Joi.string()
    .required()
    .valid("core", "elective", "extracurricular")
    .messages({
      "string.empty": "Subject category is required",
      "any.only": "Category must be core, elective, or extracurricular",
    }),
  credits: Joi.number().required().min(0).max(10).messages({
    "number.base": "Credits must be a number",
    "number.min": "Credits cannot be negative",
    "number.max": "Credits cannot exceed 10",
    "any.required": "Credits are required",
  }),
  department: Joi.string().optional().trim().max(100).messages({
    "string.max": "Department name cannot exceed 100 characters",
  }),
  prerequisites: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          "string.pattern.base": "Invalid prerequisite subject ID format",
        })
    )
    .optional(),
});

export const updateSubjectSchema = Joi.object({
  name: Joi.string().optional().trim().max(100).messages({
    "string.max": "Subject name cannot exceed 100 characters",
  }),
  code: Joi.string().optional().trim().uppercase().max(20).messages({
    "string.max": "Subject code cannot exceed 20 characters",
  }),
  description: Joi.string().optional().trim().max(500).messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
  category: Joi.string()
    .optional()
    .valid("core", "elective", "extracurricular")
    .messages({
      "any.only": "Category must be core, elective, or extracurricular",
    }),
  credits: Joi.number().optional().min(0).max(10).messages({
    "number.min": "Credits cannot be negative",
    "number.max": "Credits cannot exceed 10",
  }),
  department: Joi.string().optional().trim().max(100).messages({
    "string.max": "Department name cannot exceed 100 characters",
  }),
  prerequisites: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional(),
  isActive: Joi.boolean().optional(),
});

export const subjectQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  category: Joi.string()
    .valid("core", "elective", "extracurricular")
    .optional(),
  department: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("name", "code", "category", "credits", "createdAt", "updatedAt")
    .default("name"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

export const subjectParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid subject ID format",
      "any.required": "Subject ID is required",
    }),
});
