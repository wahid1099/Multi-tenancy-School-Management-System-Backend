import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  tenant: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role:
    | "super_admin"
    | "manager"
    | "admin"
    | "tenant_admin"
    | "teacher"
    | "student"
    | "parent";
  roleLevel: number;
  createdBy?: string;
  managedTenants: string[];
  permissions: {
    resource: string;
    actions: string[];
    scope: "global" | "tenant" | "own";
    conditions?: Record<string, any>;
  }[];
  roleScope: "global" | "tenant" | "limited";
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  checkIsLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    tenant: {
      type: String,
      required: [true, "User must belong to a tenant"],
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "manager",
        "admin",
        "tenant_admin",
        "teacher",
        "student",
        "parent",
      ],
      default: "student",
    },
    roleLevel: {
      type: Number,
      default: 0, // 0: student/parent, 1: teacher, 2: admin, 3: tenant_admin, 4: manager, 5: super_admin
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function (this: IUser) {
        return this.role !== "super_admin";
      },
    },
    managedTenants: [
      {
        type: String,
        index: true,
      },
    ],
    permissions: [
      {
        resource: {
          type: String,
          required: true,
        },
        actions: [
          {
            type: String,
            required: true,
          },
        ],
        scope: {
          type: String,
          enum: ["global", "tenant", "own"],
          default: "own",
        },
        conditions: Schema.Types.Mixed,
      },
    ],
    roleScope: {
      type: String,
      enum: ["global", "tenant", "limited"],
      default: "tenant",
    },
    avatar: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
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
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ tenant: 1, email: 1 }, { unique: true });
userSchema.index({ tenant: 1, role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ roleLevel: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ managedTenants: 1 });
userSchema.index({ roleScope: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Pre-save middleware to set passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Pre-save middleware to set roleLevel based on role
userSchema.pre("save", function (next) {
  if (!this.isModified("role")) return next();

  const roleLevels: Record<string, number> = {
    student: 0,
    parent: 0,
    teacher: 1,
    admin: 2,
    tenant_admin: 3,
    manager: 4,
    super_admin: 5,
  };

  this.roleLevel = roleLevels[this.role] || 0;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString(),
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  this.passwordResetToken = bcrypt.hashSync(resetToken, 12);
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return resetToken;
};

// Instance method to check if account is locked
userSchema.methods.checkIsLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.checkIsLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

export const User = mongoose.model<IUser>("User", userSchema);
