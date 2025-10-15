import mongoose, { Document, Schema } from "mongoose";

export interface ITenant extends Document {
  name: string;
  subdomain: string;
  domain?: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  settings: {
    timezone: string;
    currency: string;
    language: string;
    academicYearStart: Date;
    academicYearEnd: Date;
  };
  subscription: {
    plan: "basic" | "premium" | "enterprise";
    status: "active" | "inactive" | "suspended";
    startDate: Date;
    endDate: Date;
    maxUsers: number;
    maxStudents: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
      maxlength: [100, "Tenant name cannot exceed 100 characters"],
    },
    subdomain: {
      type: String,
      required: [true, "Subdomain is required"],
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Subdomain can only contain lowercase letters, numbers, and hyphens",
      ],
      maxlength: [50, "Subdomain cannot exceed 50 characters"],
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
      },
    },
    contact: {
      email: {
        type: String,
        required: [true, "Contact email is required"],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      },
      phone: {
        type: String,
        required: [true, "Contact phone is required"],
        trim: true,
      },
      website: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    settings: {
      timezone: {
        type: String,
        default: "UTC",
        trim: true,
      },
      currency: {
        type: String,
        default: "USD",
        uppercase: true,
        trim: true,
      },
      language: {
        type: String,
        default: "en",
        lowercase: true,
        trim: true,
      },
      academicYearStart: {
        type: Date,
        required: [true, "Academic year start date is required"],
      },
      academicYearEnd: {
        type: Date,
        required: [true, "Academic year end date is required"],
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "premium", "enterprise"],
        default: "basic",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        required: [true, "Subscription end date is required"],
      },
      maxUsers: {
        type: Number,
        default: 50,
        min: [1, "Max users must be at least 1"],
      },
      maxStudents: {
        type: Number,
        default: 500,
        min: [1, "Max students must be at least 1"],
      },
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
tenantSchema.index({ subdomain: 1 }, { unique: true });
tenantSchema.index({ "contact.email": 1 });
tenantSchema.index({ isActive: 1 });

// Virtual for full domain
tenantSchema.virtual("fullDomain").get(function () {
  return this.domain || `${this.subdomain}.schoolmanagement.com`;
});

// Pre-save middleware
tenantSchema.pre("save", function (next) {
  // Validate academic year dates
  if (this.settings.academicYearStart >= this.settings.academicYearEnd) {
    next(new Error("Academic year start date must be before end date"));
  }
  next();
});

export const Tenant = mongoose.model<ITenant>("Tenant", tenantSchema);
