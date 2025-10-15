import mongoose, { Document, Schema } from "mongoose";

export interface IAttendanceRecord {
  student: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
}

export interface IAttendance extends Document {
  tenant: string;
  class: string;
  subject?: string;
  date: Date;
  period?: number;
  teacher: string;
  records: IAttendanceRecord[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  isSubmitted: boolean;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: [true, "Attendance status is required"],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [200, "Remarks cannot exceed 200 characters"],
    },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    tenant: {
      type: String,
      required: [true, "Attendance must belong to a tenant"],
      index: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    period: {
      type: Number,
      min: [1, "Period must be at least 1"],
      max: [10, "Period cannot exceed 10"],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    records: [attendanceRecordSchema],
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    excusedCount: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: [0, "Attendance percentage cannot be negative"],
      max: [100, "Attendance percentage cannot exceed 100"],
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
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
attendanceSchema.index(
  { tenant: 1, class: 1, date: 1, period: 1 },
  { unique: true }
);
attendanceSchema.index({ tenant: 1, teacher: 1 });
attendanceSchema.index({ tenant: 1, subject: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ isSubmitted: 1 });

// Pre-save middleware to calculate statistics
attendanceSchema.pre("save", function (next) {
  this.totalStudents = this.records.length;
  this.presentCount = this.records.filter((r) => r.status === "present").length;
  this.absentCount = this.records.filter((r) => r.status === "absent").length;
  this.lateCount = this.records.filter((r) => r.status === "late").length;
  this.excusedCount = this.records.filter((r) => r.status === "excused").length;

  if (this.totalStudents > 0) {
    this.attendancePercentage = Math.round(
      ((this.presentCount + this.lateCount) / this.totalStudents) * 100
    );
  }

  next();
});

export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);
