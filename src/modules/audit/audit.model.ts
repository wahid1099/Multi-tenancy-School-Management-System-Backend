import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId; // User who performed the action
  action: string; // Type of action performed
  target?: mongoose.Types.ObjectId; // Target user/resource affected
  resource?: string; // Resource type (user, role, etc.)
  details: Record<string, any>; // Additional action details
  tenant: string; // Tenant context
  ipAddress?: string; // IP address of the actor
  userAgent?: string; // User agent string
  timestamp: Date; // When the action occurred
  severity: "low" | "medium" | "high" | "critical"; // Security severity level
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "create_user",
        "update_role",
        "delete_user",
        "permission_denied",
        "login",
        "logout",
        "role_escalation_attempt",
        "unauthorized_access",
        "password_reset",
        "account_locked",
        "account_unlocked",
        "tenant_access_violation",
      ],
      index: true,
    },
    target: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    resource: {
      type: String,
      enum: ["user", "role", "tenant", "permission", "auth", "system"],
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    tenant: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
      index: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient querying
auditLogSchema.index({ tenant: 1, timestamp: -1 });
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ tenant: 1, action: 1, timestamp: -1 });

// TTL index to automatically delete old audit logs (optional - keep for 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
