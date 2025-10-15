import mongoose, { Document, Schema } from "mongoose";

export interface IPermission {
  resource: string;
  actions: string[];
}

export interface IRole extends Document {
  tenant: string;
  name: string;
  description?: string;
  permissions: IPermission[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    resource: {
      type: String,
      required: [true, "Resource is required"],
      trim: true,
    },
    actions: [
      {
        type: String,
        required: [true, "Action is required"],
        trim: true,
      },
    ],
  },
  { _id: false }
);

const roleSchema = new Schema<IRole>(
  {
    tenant: {
      type: String,
      required: [true, "Role must belong to a tenant"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      maxlength: [50, "Role name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    permissions: [permissionSchema],
    isSystem: {
      type: Boolean,
      default: false,
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
roleSchema.index({ tenant: 1, name: 1 }, { unique: true });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isSystem: 1 });

export const Role = mongoose.model<IRole>("Role", roleSchema);
