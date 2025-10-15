import mongoose, { Document, Schema } from "mongoose";

export interface IExamQuestion {
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "essay";
  options?: string[];
  correctAnswer?: string | string[];
  marks: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface IExam extends Document {
  tenant: string;
  title: string;
  description?: string;
  subject: string;
  class: string;
  examType: "quiz" | "unit_test" | "midterm" | "final" | "assignment";
  totalMarks: number;
  passingMarks: number;
  duration: number; // in minutes
  startDate: Date;
  endDate: Date;
  instructions?: string;
  questions: IExamQuestion[];
  isPublished: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  showResults: boolean;
  randomizeQuestions: boolean;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const examQuestionSchema = new Schema<IExamQuestion>(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "short_answer", "essay"],
      required: [true, "Question type is required"],
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    correctAnswer: {
      type: Schema.Types.Mixed, // Can be string or array of strings
    },
    marks: {
      type: Number,
      required: [true, "Marks are required"],
      min: [0, "Marks cannot be negative"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { _id: false }
);

const examSchema = new Schema<IExam>(
  {
    tenant: {
      type: String,
      required: [true, "Exam must belong to a tenant"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    examType: {
      type: String,
      enum: ["quiz", "unit_test", "midterm", "final", "assignment"],
      required: [true, "Exam type is required"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks are required"],
      min: [1, "Total marks must be at least 1"],
    },
    passingMarks: {
      type: Number,
      required: [true, "Passing marks are required"],
      min: [0, "Passing marks cannot be negative"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [2000, "Instructions cannot exceed 2000 characters"],
    },
    questions: [examQuestionSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
    allowRetake: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, "Max attempts must be at least 1"],
    },
    showResults: {
      type: Boolean,
      default: true,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
examSchema.index({ tenant: 1, subject: 1 });
examSchema.index({ tenant: 1, class: 1 });
examSchema.index({ tenant: 1, examType: 1 });
examSchema.index({ startDate: 1, endDate: 1 });
examSchema.index({ isPublished: 1, isActive: 1 });

// Virtual for question count
examSchema.virtual("questionCount").get(function () {
  return this.questions.length;
});

// Pre-save middleware to validate dates and calculate total marks
examSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    next(new Error("End date must be after start date"));
  }

  if (this.passingMarks > this.totalMarks) {
    next(new Error("Passing marks cannot exceed total marks"));
  }

  // Calculate total marks from questions
  if (this.questions.length > 0) {
    const calculatedTotal = this.questions.reduce((sum, q) => sum + q.marks, 0);
    if (calculatedTotal !== this.totalMarks) {
      this.totalMarks = calculatedTotal;
    }
  }

  next();
});

export const Exam = mongoose.model<IExam>("Exam", examSchema);
