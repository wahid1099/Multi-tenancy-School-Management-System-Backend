import Joi from "joi";

const guardianInfoSchema = Joi.object({
  fatherName: Joi.string().required().trim().max(100).messages({
    "string.empty": "Father name is required",
    "string.max": "Father name cannot exceed 100 characters",
  }),
  motherName: Joi.string().required().trim().max(100).messages({
    "string.empty": "Mother name is required",
    "string.max": "Mother name cannot exceed 100 characters",
  }),
  guardianName: Joi.string().optional().trim().max(100).messages({
    "string.max": "Guardian name cannot exceed 100 characters",
  }),
  guardianRelation: Joi.string().optional().trim().max(50).messages({
    "string.max": "Guardian relation cannot exceed 50 characters",
  }),
  guardianPhone: Joi.string().required().trim().messages({
    "string.empty": "Guardian phone is required",
  }),
  guardianEmail: Joi.string().optional().email().lowercase().trim().messages({
    "string.email": "Please provide a valid email address",
  }),
  guardianAddress: Joi.object({
    street: Joi.string().optional().trim(),
    city: Joi.string().optional().trim(),
    state: Joi.string().optional().trim(),
    zipCode: Joi.string().optional().trim(),
    country: Joi.string().optional().trim(),
  }).optional(),
});

const medicalInfoSchema = Joi.object({
  bloodGroup: Joi.string()
    .optional()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    .messages({
      "any.only": "Invalid blood group",
    }),
  allergies: Joi.array().items(Joi.string().trim()).optional(),
  medications: Joi.array().items(Joi.string().trim()).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().required().trim().messages({
      "string.empty": "Emergency contact name is required",
    }),
    phone: Joi.string().required().trim().messages({
      "string.empty": "Emergency contact phone is required",
    }),
    relation: Joi.string().required().trim().messages({
      "string.empty": "Emergency contact relation is required",
    }),
  }).required(),
});

const previousSchoolSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    "string.empty": "Previous school name is required",
  }),
  address: Joi.string().required().trim().messages({
    "string.empty": "Previous school address is required",
  }),
  lastClass: Joi.string().required().trim().messages({
    "string.empty": "Last class is required",
  }),
  tcNumber: Joi.string().optional().trim(),
  tcDate: Joi.date().optional(),
});

const documentSchema = Joi.object({
  type: Joi.string()
    .required()
    .valid(
      "birth_certificate",
      "transfer_certificate",
      "photo",
      "address_proof",
      "other"
    )
    .messages({
      "string.empty": "Document type is required",
      "any.only": "Invalid document type",
    }),
  name: Joi.string().required().trim().messages({
    "string.empty": "Document name is required",
  }),
  url: Joi.string().required().trim().uri().messages({
    "string.empty": "Document URL is required",
    "string.uri": "Invalid document URL",
  }),
});

export const createStudentSchema = Joi.object({
  user: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "User reference is required",
      "string.pattern.base": "Invalid user ID format",
    }),
  studentId: Joi.string().required().trim().uppercase().max(20).messages({
    "string.empty": "Student ID is required",
    "string.max": "Student ID cannot exceed 20 characters",
  }),
  admissionNumber: Joi.string().required().trim().max(20).messages({
    "string.empty": "Admission number is required",
    "string.max": "Admission number cannot exceed 20 characters",
  }),
  admissionDate: Joi.date().required().max("now").messages({
    "date.base": "Admission date must be a valid date",
    "any.required": "Admission date is required",
    "date.max": "Admission date cannot be in the future",
  }),
  class: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Class is required",
      "string.pattern.base": "Invalid class ID format",
    }),
  rollNumber: Joi.string().optional().trim().max(10).messages({
    "string.max": "Roll number cannot exceed 10 characters",
  }),
  academicYear: Joi.string()
    .required()
    .trim()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  guardianInfo: guardianInfoSchema.required(),
  medicalInfo: medicalInfoSchema.optional(),
  previousSchool: previousSchoolSchema.optional(),
  documents: Joi.array().items(documentSchema).optional(),
});

export const updateStudentSchema = Joi.object({
  studentId: Joi.string().optional().trim().uppercase().max(20).messages({
    "string.max": "Student ID cannot exceed 20 characters",
  }),
  admissionNumber: Joi.string().optional().trim().max(20).messages({
    "string.max": "Admission number cannot exceed 20 characters",
  }),
  admissionDate: Joi.date().optional().max("now").messages({
    "date.max": "Admission date cannot be in the future",
  }),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid class ID format",
    }),
  rollNumber: Joi.string().optional().trim().max(10).messages({
    "string.max": "Roll number cannot exceed 10 characters",
  }),
  academicYear: Joi.string()
    .optional()
    .trim()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  guardianInfo: guardianInfoSchema.optional(),
  medicalInfo: medicalInfoSchema.optional(),
  previousSchool: previousSchoolSchema.optional(),
  documents: Joi.array().items(documentSchema).optional(),
  status: Joi.string()
    .optional()
    .valid("active", "inactive", "transferred", "graduated", "dropped")
    .messages({
      "any.only": "Invalid status",
    }),
});

export const studentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  academicYear: Joi.string().optional().trim(),
  status: Joi.string()
    .optional()
    .valid("active", "inactive", "transferred", "graduated", "dropped"),
  sortBy: Joi.string()
    .valid(
      "studentId",
      "admissionNumber",
      "admissionDate",
      "createdAt",
      "updatedAt"
    )
    .default("studentId"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

export const studentParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid student ID format",
      "any.required": "Student ID is required",
    }),
});
