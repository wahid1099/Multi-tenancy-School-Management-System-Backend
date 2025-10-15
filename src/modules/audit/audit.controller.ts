import { Request, Response, NextFunction } from "express";
import { AuditService } from "../../services/audit.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import AppError from "../../utils/AppError";

/**
 * Audit Controller Class
 */
class AuditController {
  /**
   * Get audit logs with filtering and pagination
   * @route GET /api/v1/audit/logs
   * @access Private (Admin and above)
   */
  getAuditLogs = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        actor: req.query.actor as string,
        action: req.query.action as string,
        resource: req.query.resource as string,
        tenant: req.query.tenant as string,
        severity: req.query.severity as "low" | "medium" | "high" | "critical",
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 25,
      };

      // Filter by user's scope
      if (req.user.roleScope === "tenant") {
        filters.tenant = req.user.tenant;
      } else if (req.user.roleScope === "limited") {
        // For managers with limited scope, filter by managed tenants
        if (
          !filters.tenant ||
          !req.user.managedTenants.includes(filters.tenant)
        ) {
          filters.tenant = req.user.managedTenants[0] || req.user.tenant;
        }
      }

      const result = await AuditService.getAuditTrail(filters);

      sendSuccessResponse(
        res,
        "Audit logs retrieved successfully",
        result,
        200
      );
    }
  );

  /**
   * Get audit statistics
   * @route GET /api/v1/audit/stats
   * @access Private (Admin and above)
   */
  getAuditStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      let tenant: string | undefined;

      // Filter by user's scope
      if (req.user.roleScope === "tenant") {
        tenant = req.user.tenant;
      } else if (req.user.roleScope === "limited") {
        tenant = (req.query.tenant as string) || req.user.managedTenants[0];
      } else if (req.user.role !== "super_admin") {
        tenant = req.query.tenant as string;
      }

      const stats = await AuditService.getAuditStats(
        tenant,
        startDate,
        endDate
      );

      sendSuccessResponse(
        res,
        "Audit statistics retrieved successfully",
        stats,
        200
      );
    }
  );

  /**
   * Export audit logs to CSV
   * @route GET /api/v1/audit/export
   * @access Private (Super Admin and Manager only)
   */
  exportAuditLogs = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const filters = {
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        actor: req.query.actor as string,
        action: req.query.action as string,
        resource: req.query.resource as string,
        tenant: req.query.tenant as string,
        severity: req.query.severity as "low" | "medium" | "high" | "critical",
        limit: 10000, // Max export limit
      };

      // Filter by user's scope
      if (req.user.roleScope === "tenant") {
        filters.tenant = req.user.tenant;
      } else if (req.user.roleScope === "limited") {
        if (
          !filters.tenant ||
          !req.user.managedTenants.includes(filters.tenant)
        ) {
          filters.tenant = req.user.managedTenants[0] || req.user.tenant;
        }
      }

      const csvContent = await AuditService.exportAuditLogs(filters);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      res.send(csvContent);
    }
  );

  /**
   * Log a custom audit event
   * @route POST /api/v1/audit/log
   * @access Private (Admin and above)
   */
  logCustomEvent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const { action, resource, details, severity = "low" } = req.body;

      if (!action || !resource) {
        return next(new AppError("Action and resource are required", 400));
      }

      await AuditService.logSecurityEvent(
        req.user._id,
        action,
        resource,
        details || {},
        req.user.tenant,
        req.ip,
        req.get("User-Agent")
      );

      sendSuccessResponse(res, "Audit event logged successfully", null, 201);
    }
  );

  /**
   * Clean up old audit logs
   * @route DELETE /api/v1/audit/cleanup
   * @access Private (Super Admin only)
   */
  cleanupOldLogs = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const olderThanDays = parseInt(req.query.days as string) || 730; // Default 2 years

      const deletedCount = await AuditService.cleanupOldLogs(olderThanDays);

      sendSuccessResponse(
        res,
        `Cleanup completed. ${deletedCount} old audit logs removed.`,
        { deletedCount },
        200
      );
    }
  );

  /**
   * Get recent critical events
   * @route GET /api/v1/audit/critical
   * @access Private (Admin and above)
   */
  getCriticalEvents = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const limit = parseInt(req.query.limit as string) || 10;

      let tenant: string | undefined;

      // Filter by user's scope
      if (req.user.roleScope === "tenant") {
        tenant = req.user.tenant;
      } else if (req.user.roleScope === "limited") {
        tenant = (req.query.tenant as string) || req.user.managedTenants[0];
      }

      const filters = {
        severity: "critical" as const,
        tenant,
        limit,
        page: 1,
      };

      const result = await AuditService.getAuditTrail(filters);

      sendSuccessResponse(
        res,
        "Critical events retrieved successfully",
        result.entries,
        200
      );
    }
  );

  /**
   * Get user activity summary
   * @route GET /api/v1/audit/user-activity/:userId
   * @access Private (Admin and above)
   */
  getUserActivity = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const { userId } = req.params;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const filters = {
        actor: userId,
        startDate,
        endDate,
        limit: 100,
        page: 1,
      };

      const result = await AuditService.getAuditTrail(filters);

      sendSuccessResponse(
        res,
        "User activity retrieved successfully",
        result.entries,
        200
      );
    }
  );
}

export default new AuditController();
