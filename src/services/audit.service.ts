import { AuditLog, IAuditLog } from "../modules/audit/audit.model";
import { UserRole } from "../utils/roleUtils";
import AppError from "../utils/AppError";
import mongoose from "mongoose";

export interface AuditFilters {
  startDate?: Date;
  endDate?: Date;
  actor?: string;
  action?: string;
  resource?: string;
  tenant?: string;
  severity?: "low" | "medium" | "high" | "critical";
  page?: number;
  limit?: number;
}

export interface AuditEntry {
  _id: string;
  actor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  action: string;
  target?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  resource?: string;
  details: Record<string, any>;
  tenant: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
}

export class AuditService {
  /**
   * Log role change event
   */
  static async logRoleChange(
    actorId: string,
    targetUserId: string,
    oldRole: UserRole,
    newRole: UserRole,
    tenant: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(actorId),
        action: "update_role",
        target: new mongoose.Types.ObjectId(targetUserId),
        resource: "role",
        details: {
          oldRole,
          newRole,
          roleChange: `${oldRole} → ${newRole}`,
        },
        tenant,
        ipAddress,
        userAgent,
        severity: this.determineSeverity("update_role", { newRole, oldRole }),
      });
    } catch (error) {
      console.error("Failed to log role change:", error);
      throw new AppError("Failed to log role change", 500);
    }
  }

  /**
   * Log user creation event
   */
  static async logUserCreation(
    creatorId: string,
    newUserId: string,
    role: UserRole,
    tenant: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(creatorId),
        action: "create_user",
        target: new mongoose.Types.ObjectId(newUserId),
        resource: "user",
        details: {
          role,
          tenant,
        },
        tenant,
        ipAddress,
        userAgent,
        severity: this.determineSeverity("create_user", { role }),
      });
    } catch (error) {
      console.error("Failed to log user creation:", error);
      throw new AppError("Failed to log user creation", 500);
    }
  }

  /**
   * Log permission denied event
   */
  static async logPermissionDenied(
    userId: string,
    resource: string,
    action: string,
    reason: string,
    tenant: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(userId),
        action: "permission_denied",
        resource: "permission",
        details: {
          deniedResource: resource,
          deniedAction: action,
          reason,
        },
        tenant,
        ipAddress,
        userAgent,
        severity: "medium",
      });
    } catch (error) {
      console.error("Failed to log permission denied:", error);
      // Don't throw error for permission denied logging to avoid cascading failures
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    userId: string,
    action:
      | "login"
      | "logout"
      | "password_reset"
      | "account_locked"
      | "account_unlocked",
    tenant: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(userId),
        action,
        resource: "auth",
        details: details || {},
        tenant,
        ipAddress,
        userAgent,
        severity: this.determineSeverity(action, details),
      });
    } catch (error) {
      console.error("Failed to log auth event:", error);
      // Don't throw error for auth logging to avoid disrupting auth flow
    }
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    userId: string,
    action:
      | "role_escalation_attempt"
      | "unauthorized_access"
      | "tenant_access_violation",
    resource: string,
    details: Record<string, any>,
    tenant: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(userId),
        action,
        resource,
        details,
        tenant,
        ipAddress,
        userAgent,
        severity: "critical",
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
      throw new AppError("Failed to log security event", 500);
    }
  }

  /**
   * Log user deletion event
   */
  static async logUserDeletion(
    actorId: string,
    targetUserId: string,
    targetRole: UserRole,
    tenant: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: new mongoose.Types.ObjectId(actorId),
        action: "delete_user",
        target: new mongoose.Types.ObjectId(targetUserId),
        resource: "user",
        details: {
          deletedRole: targetRole,
        },
        tenant,
        ipAddress,
        userAgent,
        severity: this.determineSeverity("delete_user", { role: targetRole }),
      });
    } catch (error) {
      console.error("Failed to log user deletion:", error);
      throw new AppError("Failed to log user deletion", 500);
    }
  }

  /**
   * Get audit trail with filtering and pagination
   */
  static async getAuditTrail(filters: AuditFilters): Promise<{
    entries: AuditEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const {
        startDate,
        endDate,
        actor,
        action,
        resource,
        tenant,
        severity,
        page = 1,
        limit = 50,
      } = filters;

      // Build query
      const query: any = {};

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      if (actor) query.actor = new mongoose.Types.ObjectId(actor);
      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (tenant) query.tenant = tenant;
      if (severity) query.severity = severity;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [entries, total] = await Promise.all([
        AuditLog.find(query)
          .populate("actor", "firstName lastName email role")
          .populate("target", "firstName lastName email role")
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      return {
        entries: entries as unknown as AuditEntry[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Failed to get audit trail:", error);
      throw new AppError("Failed to retrieve audit trail", 500);
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(
    tenant?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentCriticalEvents: AuditEntry[];
    topActors: Array<{ actor: any; count: number }>;
  }> {
    try {
      const query: any = {};
      if (tenant) query.tenant = tenant;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = startDate;
        if (endDate) query.timestamp.$lte = endDate;
      }

      const [
        totalEvents,
        eventsByAction,
        eventsBySeverity,
        recentCriticalEvents,
        topActors,
      ] = await Promise.all([
        // Total events count
        AuditLog.countDocuments(query),

        // Events by action
        AuditLog.aggregate([
          { $match: query },
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Events by severity
        AuditLog.aggregate([
          { $match: query },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Recent critical events
        AuditLog.find({ ...query, severity: "critical" })
          .populate("actor", "firstName lastName email role")
          .populate("target", "firstName lastName email role")
          .sort({ timestamp: -1 })
          .limit(10)
          .lean(),

        // Top actors by activity
        AuditLog.aggregate([
          { $match: query },
          { $group: { _id: "$actor", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "actor",
              pipeline: [
                { $project: { firstName: 1, lastName: 1, email: 1, role: 1 } },
              ],
            },
          },
          { $unwind: "$actor" },
        ]),
      ]);

      return {
        totalEvents,
        eventsByAction: eventsByAction.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {}
        ),
        eventsBySeverity: eventsBySeverity.reduce(
          (acc, item) => ({ ...acc, [item._id]: item.count }),
          {}
        ),
        recentCriticalEvents: recentCriticalEvents as unknown as AuditEntry[],
        topActors,
      };
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      throw new AppError("Failed to retrieve audit statistics", 500);
    }
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportAuditLogs(filters: AuditFilters): Promise<string> {
    try {
      const { entries } = await this.getAuditTrail({
        ...filters,
        limit: 10000,
      });

      const csvHeaders = [
        "Timestamp",
        "Actor",
        "Action",
        "Target",
        "Resource",
        "Severity",
        "Details",
        "Tenant",
        "IP Address",
      ];

      const csvRows = entries.map((entry) => [
        entry.timestamp.toISOString(),
        entry.actor
          ? `${entry.actor.firstName} ${entry.actor.lastName} (${entry.actor.email})`
          : "N/A",
        entry.action,
        entry.target
          ? `${entry.target.firstName} ${entry.target.lastName} (${entry.target.email})`
          : "N/A",
        entry.resource || "N/A",
        entry.severity,
        JSON.stringify(entry.details),
        entry.tenant,
        entry.ipAddress || "N/A",
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      return csvContent;
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      throw new AppError("Failed to export audit logs", 500);
    }
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  static async cleanupOldLogs(olderThanDays: number = 730): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate },
        severity: { $in: ["low", "medium"] }, // Keep high and critical events longer
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
      throw new AppError("Failed to cleanup old audit logs", 500);
    }
  }

  /**
   * Determine severity level based on action and context
   */
  private static determineSeverity(
    action: string,
    context?: Record<string, any>
  ): "low" | "medium" | "high" | "critical" {
    // Critical severity events
    if (
      [
        "role_escalation_attempt",
        "unauthorized_access",
        "tenant_access_violation",
      ].includes(action)
    ) {
      return "critical";
    }

    // High severity events
    if (action === "update_role") {
      const { newRole, oldRole } = context || {};
      if (newRole === "super_admin" || oldRole === "super_admin") {
        return "critical";
      }
      if (["manager", "admin", "tenant_admin"].includes(newRole)) {
        return "high";
      }
      return "medium";
    }

    if (action === "create_user") {
      const { role } = context || {};
      if (role === "super_admin") return "critical";
      if (["manager", "admin", "tenant_admin"].includes(role)) return "high";
      return "medium";
    }

    if (action === "delete_user") {
      const { role } = context || {};
      if (["super_admin", "manager", "admin", "tenant_admin"].includes(role)) {
        return "high";
      }
      return "medium";
    }

    if (["account_locked", "password_reset"].includes(action)) {
      return "medium";
    }

    // Default to low severity
    return "low";
  }
}
