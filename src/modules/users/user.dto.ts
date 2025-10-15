import Joi from "joi";

/**
 * User registration validation schema
 */
export const registerUserSchema = Joi.object({
  tenant: Joi.string().required().messages({
    "string.empty": "Tenant is required",
  }),
  firstName: Joi.string().required().trim().max(50).messages({
    "string.empty": "First name is required",
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastName: Joi.string().required().trim().max(50).messages({
    "string.empty": "Last name is required",
    "string.max": "Last name cannot exceed 50 characters",
  }),
  email: Joi.string().required().email().lowercase().trim().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required",
  }),
  role: Joi.string()
    .valid("admin", "tenant_admin", "teacher", "student", "parent")
    .default("student"),
  phone: Joi.string().optional().trim(),
  dateOfBirth: Joi.date().optional().max("now").messages({
    "date.max": "Date of birth cannot be in the future",
  }),
  gender: Joi.string().valid("male", "female", "other").optional(),
  address: Joi.object({
    street: Joi.string().optional().trim(),
    city: Joi.string().optional().trim(),
    state: Joi.string().optional().trim(),
    zipCode: Joi.string().optional().trim(),
    country: Joi.string().optional().trim(),
  }).optional(),
});

/**
 * User login validation schema
 */
export const loginUserSchema = Joi.object({
  email: Joi.string().required().email().lowercase().trim().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
  tenant: Joi.string().optional(),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = Joi.object({
  firstName: Joi.string().optional().trim().max(50).messages({
    "string.max": "First name cannot exceed 50 characters",
  }),
  lastName: Joi.string().optional().trim().max(50).messages({
    "string.max": "Last name cannot exceed 50 characters",
  }),
  phone: Joi.string().optional().trim(),
  dateOfBirth: Joi.date().optional().max("now").messages({
    "date.max": "Date of birth cannot be in the future",
  }),
  gender: Joi.string().valid("male", "female", "other").optional(),
  address: Joi.object({
    street: Joi.string().optional().trim(),
    city: Joi.string().optional().trim(),
    state: Joi.string().optional().trim(),
    zipCode: Joi.string().optional().trim(),
    country: Joi.string().optional().trim(),
  }).optional(),
  avatar: Joi.string().optional().trim(),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "string.empty": "Current password is required",
  }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .messages({
      "string.empty": "New password is required",
      "string.min": "New password must be at least 8 characters long",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  confirmNewPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "New passwords do not match",
      "string.empty": "Confirm new password is required",
    }),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email().lowercase().trim().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  tenant: Joi.string().optional(),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Reset token is required",
  }),
  password: Joi.string()
    .required()
    .min(8)
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]"
      )
    )
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match",
    "string.empty": "Confirm password is required",
  }),
});

/**
 * User query parameters validation schema
 */
export const userQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  role: Joi.string()
    .valid("admin", "tenant_admin", "teacher", "student", "parent")
    .optional(),
  isActive: Joi.boolean().optional(),
  isEmailVerified: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid(
      "firstName",
      "lastName",
      "email",
      "role",
      "createdAt",
      "updatedAt",
      "lastLogin"
    )
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

/**
 * User ID parameter validation schema
 */
export const userParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "any.required": "User ID is required",
    }),
});

/**
 * Update user role validation schema
 */
export const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .required()
    .valid("admin", "tenant_admin", "teacher", "student", "parent")
    .messages({
      "string.empty": "Role is required",
      "any.only": "Invalid role specified",
    }),
});
