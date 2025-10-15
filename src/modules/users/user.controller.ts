import { Request, Response, NextFunction } from "express";
import userService from "./user.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

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
      const user = await userService.getUserById(req.user.id, req.tenant);

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
        req.user.id,
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
        req.user.id,
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
   * Get all users (Admin/Tenant Admin only)
   * @route GET /api/v1/users
   * @access Private (Admin/Tenant Admin)
   */
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await userService.getAllUsers(req.tenant, req.query);

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
   * Update user role
   * @route PATCH /api/v1/users/:id/role
   * @access Private (Admin/Tenant Admin)
   */
  updateUserRole = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { role } = req.body;
      const user = await userService.updateUserRole(
        req.params.id,
        req.tenant,
        role
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
}

export default new UserController();
