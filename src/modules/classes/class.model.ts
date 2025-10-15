import mongoose, { Document, Schema } from "mongoose";

export interface IClass extends Document {
  tenant: string;
  name: string;
  section: string;
  grade: string;
  academicYear: string;
  classTeacher: string;
  subjects: string[];
  students: string[];
  capacity: number;
  room?: string;
  schedule: {
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema(
  {
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      required: [true, "Day is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
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
  },
  { _id: false }
);

const classSchema = new Schema<IClass>(
  {
    tenant: {
      type: String,
      required: [true, "Class must belong to a tenant"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [50, "Class name cannot exceed 50 characters"],
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
      maxlength: [10, "Section cannot exceed 10 characters"],
    },
    grade: {
      type: String,
      required: [true, "Grade is required"],
      trim: true,
      maxlength: [20, "Grade cannot exceed 20 characters"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [/^\d{4}-\d{4}$/, "Academic year format should be YYYY-YYYY"],
    },
    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Class teacher is required"],
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    capacity: {
      type: Number,
      required: [true, "Class capacity is required"],
      min: [1, "Capacity must be at least 1"],
      max: [100, "Capacity cannot exceed 100"],
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, "Room cannot exceed 50 characters"],
    },
    schedule: [scheduleSchema],
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
classSchema.index(
  { tenant: 1, name: 1, section: 1, academicYear: 1 },
  { unique: true }
);
classSchema.index({ tenant: 1, grade: 1 });
classSchema.index({ classTeacher: 1 });
classSchema.index({ isActive: 1 });

// Virtual for current enrollment
classSchema.virtual("currentEnrollment").get(function () {
  return this.students.length;
});

// Virtual for available spots
classSchema.virtual("availableSpots").get(function () {
  return this.capacity - this.students.length;
});

export const Class = mongoose.model<IClass>("Class", classSchema);
