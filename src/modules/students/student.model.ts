import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  tenant: string;
  user: mongoose.Types.ObjectId; // Reference to User model
  studentId: string;
  admissionNumber: string;
  admissionDate: Date;
  class: mongoose.Types.ObjectId; // Reference to Class model
  rollNumber?: string;
  academicYear: string;
  guardianInfo: {
    fatherName: string;
    motherName: string;
    guardianName?: string;
    guardianRelation?: string;
    guardianPhone: string;
    guardianEmail?: string;
    guardianAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  medicalInfo?: {
    bloodGroup?: string;
    allergies?: string[];
    medications?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  previousSchool?: {
    name: string;
    address: string;
    lastClass: string;
    tcNumber?: string;
    tcDate?: Date;
  };
  documents: {
    type:
      | "birth_certificate"
      | "transfer_certificate"
      | "photo"
      | "address_proof"
      | "other";
    name: string;
    url: string;
    uploadDate: Date;
  }[];
  status: "active" | "inactive" | "transferred" | "graduated" | "dropped";
  createdAt: Date;
  updatedAt: Date;
}

const guardianInfoSchema = new Schema(
  {
    fatherName: {
      type: String,
      required: [true, "Father name is required"],
      trim: true,
      maxlength: [100, "Father name cannot exceed 100 characters"],
    },
    motherName: {
      type: String,
      required: [true, "Mother name is required"],
      trim: true,
      maxlength: [100, "Mother name cannot exceed 100 characters"],
    },
    guardianName: {
      type: String,
      trim: true,
      maxlength: [100, "Guardian name cannot exceed 100 characters"],
    },
    guardianRelation: {
      type: String,
      trim: true,
      maxlength: [50, "Guardian relation cannot exceed 50 characters"],
    },
    guardianPhone: {
      type: String,
      required: [true, "Guardian phone is required"],
      trim: true,
    },
    guardianEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    guardianAddress: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
    },
  },
  { _id: false }
);

const medicalInfoSchema = new Schema(
  {
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      trim: true,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    medications: [
      {
        type: String,
        trim: true,
      },
    ],
    emergencyContact: {
      name: {
        type: String,
        required: [true, "Emergency contact name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Emergency contact phone is required"],
        trim: true,
      },
      relation: {
        type: String,
        required: [true, "Emergency contact relation is required"],
        trim: true,
      },
    },
  },
  { _id: false }
);

const previousSchoolSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Previous school name is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Previous school address is required"],
      trim: true,
    },
    lastClass: {
      type: String,
      required: [true, "Last class is required"],
      trim: true,
    },
    tcNumber: {
      type: String,
      trim: true,
    },
    tcDate: {
      type: Date,
    },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "birth_certificate",
        "transfer_certificate",
        "photo",
        "address_proof",
        "other",
      ],
      required: [true, "Document type is required"],
    },
    name: {
      type: String,
      required: [true, "Document name is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Document URL is required"],
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSchema = new Schema<IStudent>(
  {
    tenant: {
      type: String,
      required: [true, "Student must belong to a tenant"],
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "Student ID cannot exceed 20 characters"],
    },
    admissionNumber: {
      type: String,
      required: [true, "Admission number is required"],
      trim: true,
      maxlength: [20, "Admission number cannot exceed 20 characters"],
    },
    admissionDate: {
      type: Date,
      required: [true, "Admission date is required"],
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: [10, "Roll number cannot exceed 10 characters"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [/^\d{4}-\d{4}$/, "Academic year format should be YYYY-YYYY"],
    },
    guardianInfo: {
      type: guardianInfoSchema,
      required: [true, "Guardian information is required"],
    },
    medicalInfo: medicalInfoSchema,
    previousSchool: previousSchoolSchema,
    documents: [documentSchema],
    status: {
      type: String,
      enum: ["active", "inactive", "transferred", "graduated", "dropped"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
studentSchema.index({ tenant: 1, studentId: 1 }, { unique: true });
studentSchema.index({ tenant: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ tenant: 1, class: 1 });
studentSchema.index({ tenant: 1, academicYear: 1 });
studentSchema.index({ status: 1 });

export const Student = mongoose.model<IStudent>("Student", studentSchema);
