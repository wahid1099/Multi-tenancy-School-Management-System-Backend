import mongoose, { Document, Schema } from "mongoose";

export interface ISubject extends Document {
  tenant: string;
  name: string;
  code: string;
  description?: string;
  category: "core" | "elective" | "extracurricular";
  credits: number;
  department?: string;
  prerequisites: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    tenant: {
      type: String,
      required: [true, "Subject must belong to a tenant"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: [100, "Subject name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "Subject code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: ["core", "elective", "extracurricular"],
      required: [true, "Subject category is required"],
    },
    credits: {
      type: Number,
      required: [true, "Credits are required"],
      min: [0, "Credits cannot be negative"],
      max: [10, "Credits cannot exceed 10"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    prerequisites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
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
subjectSchema.index({ tenant: 1, code: 1 }, { unique: true });
subjectSchema.index({ tenant: 1, name: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ isActive: 1 });

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema);
