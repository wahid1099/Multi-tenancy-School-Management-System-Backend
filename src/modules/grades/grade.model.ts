import mongoose, { Document, Schema } from "mongoose";

export interface IGradeItem {
  student: mongoose.Types.ObjectId;
  marksObtained: number;
  grade: string;
  percentage: number;
  remarks?: string;
  isAbsent: boolean;
}

export interface IGrade extends Document {
  tenant: string;
  exam: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  academicYear: string;
  gradingScale: {
    A: { min: number; max: number };
    B: { min: number; max: number };
    C: { min: number; max: number };
    D: { min: number; max: number };
    F: { min: number; max: number };
  };
  grades: IGradeItem[];
  totalStudents: number;
  averageMarks: number;
  averagePercentage: number;
  passCount: number;
  failCount: number;
  absentCount: number;
  highestMarks: number;
  lowestMarks: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const gradeItemSchema = new Schema<IGradeItem>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      enum: ["A", "B", "C", "D", "F"],
    },
    percentage: {
      type: Number,
      required: [true, "Percentage is required"],
      min: [0, "Percentage cannot be negative"],
      max: [100, "Percentage cannot exceed 100"],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [200, "Remarks cannot exceed 200 characters"],
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const gradingScaleSchema = new Schema(
  {
    A: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    B: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    C: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    D: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    F: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
  },
  { _id: false }
);

const gradeSchema = new Schema<IGrade>(
  {
    tenant: {
      type: String,
      required: [true, "Grade must belong to a tenant"],
      index: true,
    },
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam is required"],
      unique: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      match: [/^\d{4}-\d{4}$/, "Academic year format should be YYYY-YYYY"],
    },
    gradingScale: {
      type: gradingScaleSchema,
      default: {
        A: { min: 90, max: 100 },
        B: { min: 80, max: 89 },
        C: { min: 70, max: 79 },
        D: { min: 60, max: 69 },
        F: { min: 0, max: 59 },
      },
    },
    grades: [gradeItemSchema],
    totalStudents: {
      type: Number,
      default: 0,
    },
    averageMarks: {
      type: Number,
      default: 0,
    },
    averagePercentage: {
      type: Number,
      default: 0,
    },
    passCount: {
      type: Number,
      default: 0,
    },
    failCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    highestMarks: {
      type: Number,
      default: 0,
    },
    lowestMarks: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
gradeSchema.index({ tenant: 1, class: 1, subject: 1 });
gradeSchema.index({ tenant: 1, academicYear: 1 });
gradeSchema.index({ isPublished: 1 });

// Pre-save middleware to calculate statistics
gradeSchema.pre<IGrade>("save", function (next) {
  if (this.grades.length === 0) {
    return next();
  }

  const presentGrades = this.grades.filter((g: IGradeItem) => !g.isAbsent);

  this.totalStudents = this.grades.length;
  this.absentCount = this.grades.filter((g: IGradeItem) => g.isAbsent).length;

  if (presentGrades.length > 0) {
    const totalMarks = presentGrades.reduce(
      (sum: number, g: IGradeItem) => sum + g.marksObtained,
      0
    );
    const totalPercentage = presentGrades.reduce(
      (sum: number, g: IGradeItem) => sum + g.percentage,
      0
    );

    this.averageMarks =
      Math.round((totalMarks / presentGrades.length) * 100) / 100;
    this.averagePercentage =
      Math.round((totalPercentage / presentGrades.length) * 100) / 100;

    this.highestMarks = Math.max(
      ...presentGrades.map((g: IGradeItem) => g.marksObtained)
    );
    this.lowestMarks = Math.min(
      ...presentGrades.map((g: IGradeItem) => g.marksObtained)
    );

    this.passCount = presentGrades.filter(
      (g: IGradeItem) => g.grade !== "F"
    ).length;
    this.failCount = presentGrades.filter(
      (g: IGradeItem) => g.grade === "F"
    ).length;
  }

  next();
});

// Method to calculate grade based on percentage
gradeSchema.methods.calculateGrade = function (percentage: number): string {
  const scale = this.gradingScale;

  if (percentage >= scale.A.min) return "A";
  if (percentage >= scale.B.min) return "B";
  if (percentage >= scale.C.min) return "C";
  if (percentage >= scale.D.min) return "D";
  return "F";
};

export const Grade = mongoose.model<IGrade>("Grade", gradeSchema);
