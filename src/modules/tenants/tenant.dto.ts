import Joi from "joi";

/**
 * Create tenant validation schema
 */
export const createTenantSchema = Joi.object({
  name: Joi.string().required().trim().max(100).messages({
    "string.empty": "Tenant name is required",
    "string.max": "Tenant name cannot exceed 100 characters",
  }),
  subdomain: Joi.string()
    .required()
    .lowercase()
    .trim()
    .pattern(/^[a-z0-9-]+$/)
    .max(50)
    .messages({
      "string.empty": "Subdomain is required",
      "string.pattern.base":
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
      "string.max": "Subdomain cannot exceed 50 characters",
    }),
  domain: Joi.string().optional().trim().lowercase(),
  logo: Joi.string().optional().trim(),
  address: Joi.object({
    street: Joi.string().required().trim().messages({
      "string.empty": "Street address is required",
    }),
    city: Joi.string().required().trim().messages({
      "string.empty": "City is required",
    }),
    state: Joi.string().required().trim().messages({
      "string.empty": "State is required",
    }),
    zipCode: Joi.string().required().trim().messages({
      "string.empty": "Zip code is required",
    }),
    country: Joi.string().required().trim().messages({
      "string.empty": "Country is required",
    }),
  }).required(),
  contact: Joi.object({
    email: Joi.string().required().email().lowercase().trim().messages({
      "string.empty": "Contact email is required",
      "string.email": "Please provide a valid email address",
    }),
    phone: Joi.string().required().trim().messages({
      "string.empty": "Contact phone is required",
    }),
    website: Joi.string().optional().trim().lowercase(),
  }).required(),
  settings: Joi.object({
    timezone: Joi.string().optional().trim().default("UTC"),
    currency: Joi.string().optional().uppercase().trim().default("USD"),
    language: Joi.string().optional().lowercase().trim().default("en"),
    academicYearStart: Joi.date().required().messages({
      "date.base": "Academic year start date must be a valid date",
      "any.required": "Academic year start date is required",
    }),
    academicYearEnd: Joi.date()
      .required()
      .greater(Joi.ref("academicYearStart"))
      .messages({
        "date.base": "Academic year end date must be a valid date",
        "any.required": "Academic year end date is required",
        "date.greater": "Academic year end date must be after start date",
      }),
  }).optional(),
  subscription: Joi.object({
    plan: Joi.string().valid("basic", "premium", "enterprise").default("basic"),
    status: Joi.string()
      .valid("active", "inactive", "suspended")
      .default("active"),
    startDate: Joi.date().optional().default(new Date()),
    endDate: Joi.date().required().greater("now").messages({
      "date.base": "Subscription end date must be a valid date",
      "any.required": "Subscription end date is required",
      "date.greater": "Subscription end date must be in the future",
    }),
    maxUsers: Joi.number().integer().min(1).default(50).messages({
      "number.min": "Max users must be at least 1",
    }),
    maxStudents: Joi.number().integer().min(1).default(500).messages({
      "number.min": "Max students must be at least 1",
    }),
  }).optional(),
});

/**
 * Update tenant validation schema
 */
export const updateTenantSchema = Joi.object({
  name: Joi.string().optional().trim().max(100).messages({
    "string.max": "Tenant name cannot exceed 100 characters",
  }),
  domain: Joi.string().optional().trim().lowercase(),
  logo: Joi.string().optional().trim(),
  address: Joi.object({
    street: Joi.string().optional().trim(),
    city: Joi.string().optional().trim(),
    state: Joi.string().optional().trim(),
    zipCode: Joi.string().optional().trim(),
    country: Joi.string().optional().trim(),
  }).optional(),
  contact: Joi.object({
    email: Joi.string().optional().email().lowercase().trim().messages({
      "string.email": "Please provide a valid email address",
    }),
    phone: Joi.string().optional().trim(),
    website: Joi.string().optional().trim().lowercase(),
  }).optional(),
  settings: Joi.object({
    timezone: Joi.string().optional().trim(),
    currency: Joi.string().optional().uppercase().trim(),
    language: Joi.string().optional().lowercase().trim(),
    academicYearStart: Joi.date().optional(),
    academicYearEnd: Joi.date()
      .optional()
      .when("academicYearStart", {
        is: Joi.exist(),
        then: Joi.date().greater(Joi.ref("academicYearStart")),
        otherwise: Joi.date(),
      })
      .messages({
        "date.greater": "Academic year end date must be after start date",
      }),
  }).optional(),
  subscription: Joi.object({
    plan: Joi.string().valid("basic", "premium", "enterprise").optional(),
    status: Joi.string().valid("active", "inactive", "suspended").optional(),
    endDate: Joi.date().optional().greater("now").messages({
      "date.greater": "Subscription end date must be in the future",
    }),
    maxUsers: Joi.number().integer().min(1).optional().messages({
      "number.min": "Max users must be at least 1",
    }),
    maxStudents: Joi.number().integer().min(1).optional().messages({
      "number.min": "Max students must be at least 1",
    }),
  }).optional(),
  isActive: Joi.boolean().optional(),
});

/**
 * Query parameters validation schema
 */
export const tenantQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  status: Joi.string().valid("active", "inactive", "suspended").optional(),
  plan: Joi.string().valid("basic", "premium", "enterprise").optional(),
  sortBy: Joi.string()
    .valid("name", "createdAt", "updatedAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

/**
 * Tenant ID parameter validation schema
 */
export const tenantParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid tenant ID format",
      "any.required": "Tenant ID is required",
    }),
});
