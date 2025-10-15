import { Request, Response, NextFunction } from "express";
import tenantService from "./tenant.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

/**
 * Tenant Controller Class
 */
class TenantController {
  /**
   * Create a new tenant
   * @route POST /api/v1/tenants
   * @access Public
   */
  createTenant = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tenant = await tenantService.createTenant(req.body);

      sendSuccessResponse(res, "Tenant created successfully", tenant, 201);
    }
  );

  /**
   * Get all tenants
   * @route GET /api/v1/tenants
   * @access Private (Admin only)
   */
  getAllTenants = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await tenantService.getAllTenants(req.query);

      sendSuccessResponse(
        res,
        "Tenants retrieved successfully",
        result.tenants,
        200,
        result.pagination
      );
    }
  );

  /**
   * Get tenant by ID
   * @route GET /api/v1/tenants/:id
   * @access Private
   */
  getTenantById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tenant = await tenantService.getTenantById(req.params.id);

      sendSuccessResponse(res, "Tenant retrieved successfully", tenant);
    }
  );

  /**
   * Get tenant by subdomain
   * @route GET /api/v1/tenants/subdomain/:subdomain
   * @access Public
   */
  getTenantBySubdomain = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tenant = await tenantService.getTenantBySubdomain(
        req.params.subdomain
      );

      sendSuccessResponse(res, "Tenant retrieved successfully", tenant);
    }
  );

  /**
   * Update tenant
   * @route PATCH /api/v1/tenants/:id
   * @access Private (Admin or Tenant Admin)
   */
  updateTenant = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tenant = await tenantService.updateTenant(req.params.id, req.body);

      sendSuccessResponse(res, "Tenant updated successfully", tenant);
    }
  );

  /**
   * Delete tenant (soft delete)
   * @route DELETE /api/v1/tenants/:id
   * @access Private (Admin only)
   */
  deleteTenant = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await tenantService.deleteTenant(req.params.id);

      sendSuccessResponse(res, "Tenant deleted successfully");
    }
  );

  /**
   * Toggle tenant status
   * @route PATCH /api/v1/tenants/:id/toggle-status
   * @access Private (Admin only)
   */
  toggleTenantStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tenant = await tenantService.toggleTenantStatus(req.params.id);

      sendSuccessResponse(
        res,
        `Tenant ${tenant.isActive ? "activated" : "deactivated"} successfully`,
        tenant
      );
    }
  );

  /**
   * Get tenant statistics
   * @route GET /api/v1/tenants/stats
   * @access Private (Admin only)
   */
  getTenantStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await tenantService.getTenantStats();

      sendSuccessResponse(
        res,
        "Tenant statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new TenantController();
