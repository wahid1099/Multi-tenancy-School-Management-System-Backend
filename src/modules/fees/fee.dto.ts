import Joi from "joi";

const feeStructureSchema = Joi.object({
  name: Joi.string().required().trim().max(100).messages({
    "string.empty": "Fee name is required",
    "string.max": "Fee name cannot exceed 100 characters",
  }),
  amount: Joi.number().required().min(0).messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount cannot be negative",
    "any.required": "Amount is required",
  }),
  dueDate: Joi.date().required().messages({
    "date.base": "Due date must be a valid date",
    "any.required": "Due date is required",
  }),
  isOptional: Joi.boolean().optional().default(false),
});

const discountSchema = Joi.object({
  name: Joi.string().required().trim().messages({
    "string.empty": "Discount name is required",
  }),
  type: Joi.string().required().valid("percentage", "fixed").messages({
    "string.empty": "Discount type is required",
    "any.only": "Discount type must be percentage or fixed",
  }),
  value: Joi.number().required().min(0).messages({
    "number.base": "Discount value must be a number",
    "number.min": "Discount value cannot be negative",
    "any.required": "Discount value is required",
  }),
  applicableFor: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional(),
});

const feePaymentSchema = Joi.object({
  feeStructure: Joi.string().required().trim().messages({
    "string.empty": "Fee structure is required",
  }),
  amountPaid: Joi.number().required().min(0).messages({
    "number.base": "Amount paid must be a number",
    "number.min": "Amount paid cannot be negative",
    "any.required": "Amount paid is required",
  }),
  paymentDate: Joi.date().required().max("now").messages({
    "date.base": "Payment date must be a valid date",
    "any.required": "Payment date is required",
    "date.max": "Payment date cannot be in the future",
  }),
  paymentMethod: Joi.string()
    .required()
    .valid("cash", "card", "bank_transfer", "cheque", "online")
    .messages({
      "string.empty": "Payment method is required",
      "any.only": "Invalid payment method",
    }),
  transactionId: Joi.string().optional().trim(),
  receiptNumber: Joi.string().required().trim().messages({
    "string.empty": "Receipt number is required",
  }),
  remarks: Joi.string().optional().trim().max(200).messages({
    "string.max": "Remarks cannot exceed 200 characters",
  }),
});

export const createFeeSchema = Joi.object({
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
  feeStructure: Joi.array()
    .items(feeStructureSchema)
    .required()
    .min(1)
    .messages({
      "array.min": "At least one fee structure is required",
      "any.required": "Fee structure is required",
    }),
  dueDate: Joi.date().required().min("now").messages({
    "date.base": "Due date must be a valid date",
    "any.required": "Due date is required",
    "date.min": "Due date cannot be in the past",
  }),
  lateFeePenalty: Joi.number().optional().min(0).default(0).messages({
    "number.min": "Late fee penalty cannot be negative",
  }),
  lateFeeAfterDays: Joi.number().optional().min(1).default(30).messages({
    "number.min": "Late fee after days must be at least 1",
  }),
  discounts: Joi.array().items(discountSchema).optional(),
});

export const updateFeeSchema = Joi.object({
  feeStructure: Joi.array().items(feeStructureSchema).optional(),
  dueDate: Joi.date().optional().min("now").messages({
    "date.min": "Due date cannot be in the past",
  }),
  lateFeePenalty: Joi.number().optional().min(0).messages({
    "number.min": "Late fee penalty cannot be negative",
  }),
  lateFeeAfterDays: Joi.number().optional().min(1).messages({
    "number.min": "Late fee after days must be at least 1",
  }),
  discounts: Joi.array().items(discountSchema).optional(),
  isActive: Joi.boolean().optional(),
});

export const recordPaymentSchema = Joi.object({
  student: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Student is required",
      "string.pattern.base": "Invalid student ID format",
    }),
  payments: Joi.array().items(feePaymentSchema).required().min(1).messages({
    "array.min": "At least one payment is required",
    "any.required": "Payments are required",
  }),
});

export const feeQuerySchema = Joi.object({
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
  sortBy: Joi.string()
    .valid("dueDate", "totalAmount", "createdAt", "updatedAt")
    .default("dueDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

export const feeRecordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  student: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  fee: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  status: Joi.string()
    .optional()
    .valid("pending", "partial", "paid", "overdue"),
  dueDateFrom: Joi.date().optional(),
  dueDateTo: Joi.date().optional().min(Joi.ref("dueDateFrom")).messages({
    "date.min": "Due date to must be after due date from",
  }),
  sortBy: Joi.string()
    .valid("dueDate", "finalAmount", "amountPaid", "createdAt", "updatedAt")
    .default("dueDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

export const feeReportSchema = Joi.object({
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  academicYear: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{4}$/)
    .messages({
      "string.empty": "Academic year is required",
      "string.pattern.base": "Academic year format should be YYYY-YYYY",
    }),
  term: Joi.string().optional().valid("first", "second", "third", "annual"),
  reportType: Joi.string()
    .valid("summary", "detailed", "defaulters")
    .default("summary"),
});

export const feeParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid fee ID format",
      "any.required": "Fee ID is required",
    }),
});
