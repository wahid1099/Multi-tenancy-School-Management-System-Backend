import { Request, Response, NextFunction } from "express";
import { User } from "../modules/users/user.model";
import { AuditLog } from "../modules/audit/audit.model";
import AppError from "../utils/AppError";
import { UserRole, getRoleLevel, canManageRole } from "../utils/roleUtils";

// Import the AuthenticatedUser type
import { AuthenticatedUser } from "../types/express";

/**
 * Middleware to validate role-based access
 */
export const validateRoleAccess = (
  requiredRole: UserRole,
  requiredScope?: "global" | "tenant" | "own"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const userRole = req.user.role;
      const userRoleLevel = getRoleLevel(userRole);
      const requiredRoleLevel = getRoleLevel(requiredRole);

      // Check if user has sufficient role level
      if (userRoleLevel < requiredRoleLevel) {
        await logPermissionDenied(
          req.user._id,
          "role_access",
          `Required: ${requiredRole}, User: ${userRole}`,
          req.user.tenant,
          req.ip || "",
          req.get("User-Agent") || ""
        );
        return next(
          new AppError(
            `Insufficient permissions. Required role: ${requiredRole}`,
            403
          )
        );
      }

      // Check scope if specified
      if (requiredScope) {
        if (requiredScope === "global" && req.user.roleScope !== "global") {
          await logPermissionDenied(
            req.user._id,
            "scope_access",
            `Required: global scope, User: ${req.user.roleScope}`,
            req.user.tenant,
            req.ip || "",
            req.get("User-Agent") || ""
          );
          return next(new AppError("Global access required", 403));
        }
      }

      next();
    } catch (error) {
      next(new AppError("Permission validation failed", 500));
    }
  };
};

/**
 * Middleware to validate resource-specific permissions
 */
export const validateResourceAccess = (
  resource: string,
  action: string,
  scope?: "global" | "tenant" | "own"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Check if user has permission for this resource and action
      const hasPermission = req.user.permissions.some((permission) => {
        const resourceMatch =
          permission.resource === resource || permission.resource === "system";
        const actionMatch =
          permission.actions.includes(action) ||
          permission.actions.includes("manage");
        const scopeMatch =
          !scope || permission.scope === scope || permission.scope === "global";

        return resourceMatch && actionMatch && scopeMatch;
      });

      if (!hasPermission) {
        await logPermissionDenied(
          req.user._id,
          "resource_access",
          `Resource: ${resource}, Action: ${action}, Scope: ${scope}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError(
            `Insufficient permissions for ${action} on ${resource}`,
            403
          )
        );
      }

      next();
    } catch (error) {
      next(new AppError("Resource permission validation failed", 500));
    }
  };
};

/**
 * Middleware to validate tenant access
 */
export const validateTenantAccess = (tenantParam?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Get tenant from parameter, body, or query
      const targetTenant = tenantParam
        ? req.params[tenantParam]
        : req.body.tenant || req.query.tenant || req.headers["x-tenant-id"];

      // Super admin has access to all tenants
      if (req.user.role === "super_admin") {
        return next();
      }

      // Global scope users can access any tenant
      if (req.user.roleScope === "global") {
        return next();
      }

      // Limited scope users can only access managed tenants
      if (req.user.roleScope === "limited") {
        if (!req.user.managedTenants.includes(targetTenant)) {
          await logPermissionDenied(
            req.user._id,
            "tenant_access",
            `Target tenant: ${targetTenant}, Managed tenants: ${req.user.managedTenants.join(
              ", "
            )}`,
            req.user.tenant,
            req.ip,
            req.get("User-Agent")
          );
          return next(new AppError("Access denied to this tenant", 403));
        }
        return next();
      }

      // Tenant scope users can only access their own tenant
      if (req.user.roleScope === "tenant") {
        if (targetTenant && targetTenant !== req.user.tenant) {
          await logPermissionDenied(
            req.user._id,
            "tenant_access",
            `Target tenant: ${targetTenant}, User tenant: ${req.user.tenant}`,
            req.user.tenant,
            req.ip,
            req.get("User-Agent")
          );
          return next(new AppError("Access denied to other tenants", 403));
        }
        return next();
      }

      next();
    } catch (error) {
      next(new AppError("Tenant access validation failed", 500));
    }
  };
};

/**
 * Middleware to validate user creation permissions
 */
export const validateUserCreation = (targetRoleParam?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Get target role from parameter or body
      const targetRole = targetRoleParam
        ? req.params[targetRoleParam]
        : (req.body.role as UserRole);

      if (!targetRole) {
        return next(new AppError("Target role not specified", 400));
      }

      // Check if user can create this role
      if (!canManageRole(req.user.role, targetRole as UserRole)) {
        await logPermissionDenied(
          req.user._id,
          "user_creation",
          `Creator role: ${req.user.role}, Target role: ${targetRole}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError(`Cannot create users with role: ${targetRole}`, 403)
        );
      }

      // Special restrictions
      if (targetRole === "super_admin" && req.user.role !== "super_admin") {
        await logPermissionDenied(
          req.user._id,
          "user_creation",
          `Attempted to create super_admin with role: ${req.user.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError("Only super_admin can create super_admin users", 403)
        );
      }

      if (targetRole === "manager" && req.user.role !== "super_admin") {
        await logPermissionDenied(
          req.user._id,
          "user_creation",
          `Attempted to create manager with role: ${req.user.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError("Only super_admin can create manager users", 403)
        );
      }

      next();
    } catch (error) {
      next(new AppError("User creation validation failed", 500));
    }
  };
};

/**
 * Middleware to validate role update permissions
 */
export const validateRoleUpdate = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const targetUserId = req.params.userId || req.params.id;
      const newRole = req.body.role as UserRole;

      if (!targetUserId || !newRole) {
        return next(new AppError("Target user ID and new role required", 400));
      }

      // Get target user
      const targetUser = await User.findById(targetUserId).select(
        "role tenant"
      );
      if (!targetUser) {
        return next(new AppError("Target user not found", 404));
      }

      // Check if user can manage both current and new roles
      if (!canManageRole(req.user.role, targetUser.role as UserRole)) {
        await logPermissionDenied(
          req.user._id,
          "role_update",
          `Cannot manage user with role: ${targetUser.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError(`Cannot manage users with role: ${targetUser.role}`, 403)
        );
      }

      if (!canManageRole(req.user.role, newRole)) {
        await logPermissionDenied(
          req.user._id,
          "role_update",
          `Cannot assign role: ${newRole}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(new AppError(`Cannot assign role: ${newRole}`, 403));
      }

      // Validate tenant access
      if (
        req.user.roleScope === "tenant" &&
        targetUser.tenant !== req.user.tenant
      ) {
        await logPermissionDenied(
          req.user._id,
          "role_update",
          `Cross-tenant role update attempted`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(new AppError("Cannot update users in other tenants", 403));
      }

      next();
    } catch (error) {
      next(new AppError("Role update validation failed", 500));
    }
  };
};

/**
 * Helper function to log permission denied events
 */
async function logPermissionDenied(
  userId: string,
  resource: string,
  details: string,
  tenant: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await AuditLog.create({
      actor: userId,
      action: "permission_denied",
      resource: "permission",
      details: {
        resource,
        reason: details,
      },
      tenant,
      ipAddress,
      userAgent,
      severity: "medium",
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to log permission denied event:", error);
  }
}

/**
 * Helper function to safely log permission denied with request context
 */
async function logPermissionDeniedFromRequest(
  req: Request,
  resource: string,
  details: string
): Promise<void> {
  if (req.user) {
    await logPermissionDenied(
      req.user._id,
      resource,
      details,
      req.user.tenant,
      req.ip || "",
      req.get("User-Agent") || ""
    );
  }
}

/**
 * Middleware to validate bulk operations
 */
export const validateBulkOperation = (operation: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Only admin level and above can perform bulk operations
      if (getRoleLevel(req.user.role) < getRoleLevel("admin")) {
        await logPermissionDenied(
          req.user._id,
          "bulk_operation",
          `Bulk ${operation} attempted with insufficient role: ${req.user.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError("Insufficient permissions for bulk operations", 403)
        );
      }

      next();
    } catch (error) {
      next(new AppError("Bulk operation validation failed", 500));
    }
  };
};

/**
 * Middleware to validate data export permissions
 */
export const validateDataExport = (dataType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Check if user has export permission for this data type
      const hasExportPermission = req.user.permissions.some((permission) => {
        return (
          (permission.resource === dataType ||
            permission.resource === "system") &&
          (permission.actions.includes("export") ||
            permission.actions.includes("manage"))
        );
      });

      if (!hasExportPermission) {
        await logPermissionDenied(
          req.user._id,
          "data_export",
          `Export ${dataType} attempted without permission`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(new AppError(`No permission to export ${dataType}`, 403));
      }

      next();
    } catch (error) {
      next(new AppError("Data export validation failed", 500));
    }
  };
};

/**
 * Middleware to validate system administration access
 */
export const validateSystemAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Only super_admin and manager can access system administration
      if (!["super_admin", "manager"].includes(req.user.role)) {
        await logPermissionDenied(
          req.user._id,
          "system_admin",
          `System admin access attempted with role: ${req.user.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(new AppError("System administration access denied", 403));
      }

      next();
    } catch (error) {
      next(new AppError("System admin validation failed", 500));
    }
  };
};

/**
 * Middleware to validate audit log access
 */
export const validateAuditAccess = (scope?: "own" | "tenant" | "global") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const requestedScope = scope || req.query.scope || "own";

      // Super admin can access all audit logs
      if (req.user.role === "super_admin") {
        return next();
      }

      // Manager can access tenant-level audit logs for managed tenants
      if (req.user.role === "manager") {
        if (requestedScope === "global") {
          await logPermissionDenied(
            req.user._id,
            "audit_access",
            "Global audit access denied for manager",
            req.user.tenant,
            req.ip,
            req.get("User-Agent")
          );
          return next(new AppError("Global audit access denied", 403));
        }
        return next();
      }

      // Tenant admin and admin can access their tenant's audit logs
      if (["tenant_admin", "admin"].includes(req.user.role)) {
        if (requestedScope === "global") {
          await logPermissionDenied(
            req.user._id,
            "audit_access",
            "Global audit access denied",
            req.user.tenant,
            req.ip,
            req.get("User-Agent")
          );
          return next(new AppError("Global audit access denied", 403));
        }
        return next();
      }

      // Others can only access their own audit logs
      if (requestedScope !== "own") {
        await logPermissionDenied(
          req.user._id,
          "audit_access",
          `Scope ${requestedScope} denied for role ${req.user.role}`,
          req.user.tenant,
          req.ip,
          req.get("User-Agent")
        );
        return next(
          new AppError("Insufficient permissions for audit access", 403)
        );
      }

      next();
    } catch (error) {
      next(new AppError("Audit access validation failed", 500));
    }
  };
};
