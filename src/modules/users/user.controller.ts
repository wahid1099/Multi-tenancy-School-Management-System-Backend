import { Request, Response, NextFunction } from "express";
import userService from "./user.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import { getUserId } from "../../utils/authHelpers";
import { RoleManagementService } from "../../services/roleManagement.service";
import { UserRole } from "../../utils/roleUtils";
import AppError from "../../utils/AppError";

/**
 * User Controller Class
 */
class UserController {
  /**
   * Register a new user
   * @route POST /api/v1/users/register
   * @access Public
   */
  register = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { user, token, refreshToken } = await userService.registerUser(
        req.body
      );

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      sendSuccessResponse(
        res,
        "User registered successfully",
        { user, token },
        201
      );
    }
  );

  /**
   * Create a new user with role hierarchy validation
   * @route POST /api/v1/users
   * @access Private (Admin and above)
   */
  createUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const creatorId = req.user._id;
      const userData = req.body;

      // Use RoleManagementService for role hierarchy validation
      const user = await RoleManagementService.createUserWithRole(
        creatorId,
        userData
      );

      sendSuccessResponse(res, "User created successfully", user, 201);
    }
  );

  /**
   * Login user
   * @route POST /api/v1/users/login
   * @access Public
   */
  login = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { user, token, refreshToken } = await userService.loginUser(
        req.body
      );

      // Set refresh token as httpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      sendSuccessResponse(res, "Login successful", { user, token });
    }
  );

  /**
   * Logout user
   * @route POST /api/v1/users/logout
   * @access Private
   */
  logout = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      res.clearCookie("refreshToken");

      sendSuccessResponse(res, "Logout successful");
    }
  );

  /**
   * Get current user profile
   * @route GET /api/v1/users/me
   * @access Private
   */
  getMe = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(getUserId(req), req.tenant);

      sendSuccessResponse(res, "User profile retrieved successfully", user);
    }
  );

  /**
   * Update current user profile
   * @route PATCH /api/v1/users/me
   * @access Private
   */
  updateMe = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.updateUser(
        getUserId(req),
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Profile updated successfully", user);
    }
  );

  /**
   * Change password
   * @route PATCH /api/v1/users/change-password
   * @access Private
   */
  changePassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(
        getUserId(req),
        req.tenant,
        currentPassword,
        newPassword
      );

      sendSuccessResponse(res, "Password changed successfully");
    }
  );

  /**
   * Forgot password
   * @route POST /api/v1/users/forgot-password
   * @access Public
   */
  forgotPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email, tenant } = req.body;

      const resetToken = await userService.forgotPassword(email, tenant);

      // In a real application, you would send this token via email
      // For demo purposes, we're returning it in the response
      sendSuccessResponse(
        res,
        "Password reset token generated successfully. Check your email.",
        { resetToken } // Remove this in production
      );
    }
  );

  /**
   * Reset password
   * @route POST /api/v1/users/reset-password
   * @access Public
   */
  resetPassword = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { token, password } = req.body;

      const user = await userService.resetPassword(token, password);

      sendSuccessResponse(res, "Password reset successfully", { user });
    }
  );

  /**
   * Get all users with role-based filtering
   * @route GET /api/v1/users
   * @access Private (Admin/Tenant Admin)
   */
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      // Filter users based on creator's scope and permissions
      let filterOptions = { ...req.query };

      // Super admin can see all users
      if (req.user.role !== "super_admin") {
        // Tenant-scoped users can only see users in their tenant
        if (req.user.roleScope === "tenant") {
          filterOptions.tenant = req.user.tenant;
        }
        // Limited scope users can see users in managed tenants
        else if (req.user.roleScope === "limited") {
          filterOptions.tenant = { $in: req.user.managedTenants };
        }
      }

      const result = await userService.getAllUsers(req.tenant, filterOptions);

      sendSuccessResponse(
        res,
        "Users retrieved successfully",
        result.users,
        200,
        result.pagination
      );
    }
  );

  /**
   * Get user by ID
   * @route GET /api/v1/users/:id
   * @access Private (Admin/Tenant Admin)
   */
  getUserById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.getUserById(req.params.id, req.tenant);

      sendSuccessResponse(res, "User retrieved successfully", user);
    }
  );

  /**
   * Update user
   * @route PATCH /api/v1/users/:id
   * @access Private (Admin/Tenant Admin)
   */
  updateUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.updateUser(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "User updated successfully", user);
    }
  );

  /**
   * Update user role with hierarchy validation
   * @route PATCH /api/v1/users/:id/role
   * @access Private (Admin/Tenant Admin)
   */
  updateUserRole = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const { role } = req.body;
      const updaterId = req.user._id;
      const targetUserId = req.params.id;

      // Use RoleManagementService for role hierarchy validation
      const user = await RoleManagementService.updateUserRole(
        updaterId,
        targetUserId,
        role as UserRole
      );

      sendSuccessResponse(res, "User role updated successfully", user);
    }
  );

  /**
   * Delete user (soft delete)
   * @route DELETE /api/v1/users/:id
   * @access Private (Admin/Tenant Admin)
   */
  deleteUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await userService.deleteUser(req.params.id, req.tenant);

      sendSuccessResponse(res, "User deleted successfully");
    }
  );

  /**
   * Toggle user status
   * @route PATCH /api/v1/users/:id/toggle-status
   * @access Private (Admin/Tenant Admin)
   */
  toggleUserStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = await userService.toggleUserStatus(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(
        res,
        `User ${user.isActive ? "activated" : "deactivated"} successfully`,
        user
      );
    }
  );

  /**
   * Get user statistics
   * @route GET /api/v1/users/stats
   * @access Private (Admin/Tenant Admin)
   */
  getUserStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await userService.getUserStats(req.tenant);

      sendSuccessResponse(res, "User statistics retrieved successfully", stats);
    }
  );

  /**
   * Get available roles for user creation
   * @route GET /api/v1/users/available-roles
   * @access Private
   */
  getAvailableRoles = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const availableRoles = await RoleManagementService.getAvailableRoles(
        req.user._id
      );

      sendSuccessResponse(res, "Available roles retrieved successfully", {
        roles: availableRoles,
      });
    }
  );

  /**
   * Get users created by current user
   * @route GET /api/v1/users/my-created-users
   * @access Private
   */
  getMyCreatedUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const users = await RoleManagementService.getUsersByCreator(req.user._id);

      sendSuccessResponse(res, "Created users retrieved successfully", users);
    }
  );

  /**
   * Bulk create users
   * @route POST /api/v1/users/bulk-create
   * @access Private (Admin and above)
   */
  bulkCreateUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const { users } = req.body;
      const creatorId = req.user._id;

      if (!Array.isArray(users) || users.length === 0) {
        return next(new AppError("Users array is required", 400));
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < users.length; i++) {
        try {
          const user = await RoleManagementService.createUserWithRole(
            creatorId,
            users[i]
          );
          results.push({ index: i, user, success: true });
        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : "Unknown error",
            userData: users[i],
            success: false,
          });
        }
      }

      sendSuccessResponse(
        res,
        `Bulk user creation completed. ${results.length} successful, ${errors.length} failed.`,
        {
          successful: results,
          failed: errors,
          summary: {
            total: users.length,
            successful: results.length,
            failed: errors.length,
          },
        }
      );
    }
  );

  /**
   * Get role hierarchy information
   * @route GET /api/v1/users/role-hierarchy
   * @access Private
   */
  getRoleHierarchy = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const hierarchy = {
        currentUser: {
          role: req.user.role,
          roleLevel: req.user.roleLevel,
          roleScope: req.user.roleScope,
          managedTenants: req.user.managedTenants,
        },
        availableRoles: await RoleManagementService.getAvailableRoles(
          req.user._id
        ),
        roleDescriptions: {
          super_admin: "Full system access across all tenants and users",
          manager: "Manages specific tenants and their users",
          admin: "Manages users within assigned scope (global or tenant)",
          tenant_admin: "Manages all aspects of their school/tenant",
          teacher: "Manages classes, attendance, and grades",
          student: "Access to own academic information",
          parent: "Access to child's academic information",
        },
      };

      sendSuccessResponse(
        res,
        "Role hierarchy information retrieved successfully",
        hierarchy
      );
    }
  );
}

export default new UserController();
