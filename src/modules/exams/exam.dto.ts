import Joi from "joi";

const examQuestionSchema = Joi.object({
  question: Joi.string().required().trim().messages({
    "string.empty": "Question is required",
  }),
  type: Joi.string()
    .required()
    .valid("multiple_choice", "true_false", "short_answer", "essay")
    .messages({
      "string.empty": "Question type is required",
      "any.only": "Invalid question type",
    }),
  options: Joi.array()
    .items(Joi.string().trim())
    .when("type", {
      is: Joi.valid("multiple_choice", "true_false"),
      then: Joi.required().min(2),
      otherwise: Joi.optional(),
    })
    .messages({
      "array.min":
        "At least 2 options are required for multiple choice questions",
    }),
  correctAnswer: Joi.alternatives()
    .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()))
    .optional(),
  marks: Joi.number().required().min(0).messages({
    "number.base": "Marks must be a number",
    "number.min": "Marks cannot be negative",
    "any.required": "Marks are required",
  }),
  difficulty: Joi.string().valid("easy", "medium", "hard").default("medium"),
});

export const createExamSchema = Joi.object({
  title: Joi.string().required().trim().max(200).messages({
    "string.empty": "Exam title is required",
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().optional().trim().max(1000).messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
  subject: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Subject is required",
      "string.pattern.base": "Invalid subject ID format",
    }),
  class: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.empty": "Class is required",
      "string.pattern.base": "Invalid class ID format",
    }),
  examType: Joi.string()
    .required()
    .valid("quiz", "unit_test", "midterm", "final", "assignment")
    .messages({
      "string.empty": "Exam type is required",
      "any.only": "Invalid exam type",
    }),
  totalMarks: Joi.number().required().min(1).messages({
    "number.base": "Total marks must be a number",
    "number.min": "Total marks must be at least 1",
    "any.required": "Total marks are required",
  }),
  passingMarks: Joi.number()
    .required()
    .min(0)
    .max(Joi.ref("totalMarks"))
    .messages({
      "number.base": "Passing marks must be a number",
      "number.min": "Passing marks cannot be negative",
      "number.max": "Passing marks cannot exceed total marks",
      "any.required": "Passing marks are required",
    }),
  duration: Joi.number().required().min(1).messages({
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 1 minute",
    "any.required": "Duration is required",
  }),
  startDate: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  endDate: Joi.date().required().greater(Joi.ref("startDate")).messages({
    "date.base": "End date must be a valid date",
    "any.required": "End date is required",
    "date.greater": "End date must be after start date",
  }),
  instructions: Joi.string().optional().trim().max(2000).messages({
    "string.max": "Instructions cannot exceed 2000 characters",
  }),
  questions: Joi.array().items(examQuestionSchema).optional(),
  allowRetake: Joi.boolean().optional().default(false),
  maxAttempts: Joi.number().optional().min(1).default(1).messages({
    "number.min": "Max attempts must be at least 1",
  }),
  showResults: Joi.boolean().optional().default(true),
  randomizeQuestions: Joi.boolean().optional().default(false),
});

export const updateExamSchema = Joi.object({
  title: Joi.string().optional().trim().max(200).messages({
    "string.max": "Title cannot exceed 200 characters",
  }),
  description: Joi.string().optional().trim().max(1000).messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid subject ID format",
    }),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid class ID format",
    }),
  examType: Joi.string()
    .optional()
    .valid("quiz", "unit_test", "midterm", "final", "assignment")
    .messages({
      "any.only": "Invalid exam type",
    }),
  totalMarks: Joi.number().optional().min(1).messages({
    "number.min": "Total marks must be at least 1",
  }),
  passingMarks: Joi.number().optional().min(0).messages({
    "number.min": "Passing marks cannot be negative",
  }),
  duration: Joi.number().optional().min(1).messages({
    "number.min": "Duration must be at least 1 minute",
  }),
  startDate: Joi.date().optional(),
  endDate: Joi.date()
    .optional()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startDate")),
      otherwise: Joi.date(),
    })
    .messages({
      "date.greater": "End date must be after start date",
    }),
  instructions: Joi.string().optional().trim().max(2000).messages({
    "string.max": "Instructions cannot exceed 2000 characters",
  }),
  questions: Joi.array().items(examQuestionSchema).optional(),
  allowRetake: Joi.boolean().optional(),
  maxAttempts: Joi.number().optional().min(1).messages({
    "number.min": "Max attempts must be at least 1",
  }),
  showResults: Joi.boolean().optional(),
  randomizeQuestions: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

export const publishExamSchema = Joi.object({
  isPublished: Joi.boolean().required().valid(true).messages({
    "any.only": "Exam can only be published (set to true)",
    "any.required": "Publication status is required",
  }),
});

export const examQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().optional().trim(),
  subject: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  class: Joi.string()
    .optional()
    .pattern(/^[0-9a-fA-F]{24}$/),
  examType: Joi.string()
    .optional()
    .valid("quiz", "unit_test", "midterm", "final", "assignment"),
  isPublished: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional().min(Joi.ref("dateFrom")).messages({
    "date.min": "End date must be after start date",
  }),
  sortBy: Joi.string()
    .valid(
      "title",
      "startDate",
      "endDate",
      "totalMarks",
      "createdAt",
      "updatedAt"
    )
    .default("startDate"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

export const examParamsSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.pattern.base": "Invalid exam ID format",
      "any.required": "Exam ID is required",
    }),
});
