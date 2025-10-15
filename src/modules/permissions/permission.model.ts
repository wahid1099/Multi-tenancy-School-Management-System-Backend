import mongoose, { Document, Schema } from "mongoose";

export interface IPermission extends Document {
  name: string; // Permission name (e.g., "create_user", "view_reports")
  resource: string; // Resource type (e.g., "user", "student", "report")
  actions: string[]; // Allowed actions (e.g., ["create", "read", "update", "delete"])
  scope: "global" | "tenant" | "own"; // Permission scope
  conditions?: Record<string, any>; // Additional conditions for permission
  description?: string; // Human-readable description
  isActive: boolean; // Whether permission is active
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      enum: [
        "user",
        "student",
        "teacher",
        "class",
        "subject",
        "attendance",
        "exam",
        "grade",
        "timetable",
        "fee",
        "tenant",
        "dashboard",
        "report",
        "audit",
        "system",
      ],
      index: true,
    },
    actions: [
      {
        type: String,
        required: true,
        enum: [
          "create",
          "read",
          "update",
          "delete",
          "manage",
          "view",
          "export",
        ],
      },
    ],
    scope: {
      type: String,
      enum: ["global", "tenant", "own"],
      required: true,
      index: true,
    },
    conditions: {
      type: Schema.Types.Mixed,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
permissionSchema.index({ resource: 1, scope: 1 });
permissionSchema.index({ isActive: 1, scope: 1 });

export const Permission = mongoose.model<IPermission>(
  "Permission",
  permissionSchema
);

// Default permissions for different roles
export const DEFAULT_PERMISSIONS = {
  super_admin: [
    {
      name: "manage_all",
      resource: "system",
      actions: ["create", "read", "update", "delete", "manage"],
      scope: "global",
    },
    {
      name: "manage_users",
      resource: "user",
      actions: ["create", "read", "update", "delete"],
      scope: "global",
    },
    {
      name: "manage_tenants",
      resource: "tenant",
      actions: ["create", "read", "update", "delete"],
      scope: "global",
    },
    {
      name: "view_audit_logs",
      resource: "audit",
      actions: ["read", "export"],
      scope: "global",
    },
  ],
  manager: [
    {
      name: "manage_assigned_tenants",
      resource: "tenant",
      actions: ["read", "update"],
      scope: "tenant",
    },
    {
      name: "manage_tenant_users",
      resource: "user",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "view_tenant_reports",
      resource: "report",
      actions: ["read", "export"],
      scope: "tenant",
    },
    {
      name: "view_tenant_audit",
      resource: "audit",
      actions: ["read"],
      scope: "tenant",
    },
  ],
  admin: [
    {
      name: "manage_tenant_users",
      resource: "user",
      actions: ["create", "read", "update"],
      scope: "tenant",
    },
    {
      name: "manage_students",
      resource: "student",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "manage_teachers",
      resource: "teacher",
      actions: ["create", "read", "update"],
      scope: "tenant",
    },
    {
      name: "manage_classes",
      resource: "class",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "view_reports",
      resource: "report",
      actions: ["read", "export"],
      scope: "tenant",
    },
  ],
  tenant_admin: [
    {
      name: "manage_tenant_admins",
      resource: "user",
      actions: ["create", "read", "update"],
      scope: "tenant",
    },
    {
      name: "manage_students",
      resource: "student",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "manage_teachers",
      resource: "teacher",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "manage_classes",
      resource: "class",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "manage_subjects",
      resource: "subject",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
    {
      name: "view_all_reports",
      resource: "report",
      actions: ["read", "export"],
      scope: "tenant",
    },
    {
      name: "manage_fees",
      resource: "fee",
      actions: ["create", "read", "update", "delete"],
      scope: "tenant",
    },
  ],
  teacher: [
    {
      name: "view_assigned_classes",
      resource: "class",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "manage_attendance",
      resource: "attendance",
      actions: ["create", "read", "update"],
      scope: "own",
    },
    {
      name: "manage_grades",
      resource: "grade",
      actions: ["create", "read", "update"],
      scope: "own",
    },
    {
      name: "view_students",
      resource: "student",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "manage_exams",
      resource: "exam",
      actions: ["create", "read", "update"],
      scope: "own",
    },
  ],
  student: [
    {
      name: "view_own_profile",
      resource: "user",
      actions: ["read", "update"],
      scope: "own",
    },
    {
      name: "view_own_grades",
      resource: "grade",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "view_own_attendance",
      resource: "attendance",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "view_timetable",
      resource: "timetable",
      actions: ["read"],
      scope: "own",
    },
    { name: "view_own_fees", resource: "fee", actions: ["read"], scope: "own" },
  ],
  parent: [
    {
      name: "view_child_profile",
      resource: "student",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "view_child_grades",
      resource: "grade",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "view_child_attendance",
      resource: "attendance",
      actions: ["read"],
      scope: "own",
    },
    {
      name: "view_child_fees",
      resource: "fee",
      actions: ["read"],
      scope: "own",
    },
  ],
} as const;
