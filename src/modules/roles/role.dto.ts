import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().required().trim().max(50).messages({
    "string.empty": "Role name is required",
    "string.max": "Role name cannot exceed 50 characters",
  }),
  description: Joi.string().optional().trim().max(200).messages({
    "string.max": "Description cannot exceed 200 characters",
  }),
  permissions: Joi.array()
    .items(
      Joi.object({
        resource: Joi.string().required().trim().messages({
          "string.empty": "Resource is required",
        }),
        actions: Joi.array()
          .items(Joi.string().trim())
          .min(1)
          .required()
          .messages({
            "array.min": "At least one action is required",
          }),
      })
    )
    .required()
    .min(1)
    .messages({
      "array.min": "At least one permission is required",
    }),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().optional().trim().max(50).messages({
    "string.max": "Role name cannot exceed 50 characters",
  }),
  description: Joi.string().optional().trim().max(200).messages({
    "string.max": "Description cannot exceed 200 characters",
  }),
  permissions: Joi.array()
    .items(
      Joi.object({
        resource: Joi.string().required().trim(),
        actions: Joi.array().items(Joi.string().trim()).min(1).required(),
      })
    )
    .optional(),
  isActive: Joi.boolean().optional(),
});

export const roleQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional(),
  isSystem: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("name", "createdAt", "updatedAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const roleParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid role ID format",
      "any.required": "Role ID is required",
    }),
});
