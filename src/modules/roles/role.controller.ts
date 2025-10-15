import { Request, Response, NextFunction } from "express";
import roleService from "./role.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class RoleController {
  createRole = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.createRole(req.tenant, req.body);

      sendSuccessResponse(res, "Role created successfully", role, 201);
    }
  );

  getAllRoles = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await roleService.getAllRoles(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Roles retrieved successfully",
        result.roles,
        200,
        result.pagination
      );
    }
  );

  getRoleById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.getRoleById(req.params.id, req.tenant);

      sendSuccessResponse(res, "Role retrieved successfully", role);
    }
  );

  updateRole = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.updateRole(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Role updated successfully", role);
    }
  );

  deleteRole = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await roleService.deleteRole(req.params.id, req.tenant);

      sendSuccessResponse(res, "Role deleted successfully");
    }
  );

  toggleRoleStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const role = await roleService.toggleRoleStatus(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(
        res,
        `Role ${role.isActive ? "activated" : "deactivated"} successfully`,
        role
      );
    }
  );
}

export default new RoleController();
