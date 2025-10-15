import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../modules/users/user.model";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import config from "../config";

// Type declarations are now in src/types/express.d.ts

/**
 * Verify JWT token and authenticate user
 */
export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // 2) Verification token
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;

    // 3) Check if user still exists and get fresh data
    const currentUser = await User.findById(decoded.id).select("+isActive");
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    // 4) Check if user is active
    if (!currentUser.isActive) {
      return next(new AppError("Your account has been deactivated.", 401));
    }

    // 5) Check if user changed password after the token was issued
    if (
      currentUser.changedPasswordAfter &&
      currentUser.changedPasswordAfter(decoded.iat)
    ) {
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401
        )
      );
    }

    // Grant access to protected route with enhanced user data
    req.user = {
      _id: (currentUser._id as any).toString(),
      role: currentUser.role as
        | "super_admin"
        | "manager"
        | "admin"
        | "tenant_admin"
        | "teacher"
        | "student"
        | "parent",
      roleLevel: currentUser.roleLevel,
      tenant: currentUser.tenant,
      managedTenants: currentUser.managedTenants || [],
      roleScope: currentUser.roleScope,
      permissions: currentUser.permissions || [],
    };
    req.tenant = currentUser.tenant;
    next();
  }
);

/**
 * Authorize user based on roles with hierarchy support
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Check if user has any of the required roles
    const hasRequiredRole = roles.includes(req.user.role);

    // Super admin has access to everything
    const isSuperAdmin = req.user.role === "super_admin";

    if (!hasRequiredRole && !isSuperAdmin) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

/**
 * Middleware to extract tenant from request
 */
export const extractTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract tenant from subdomain, header, or query parameter
  let tenant =
    (req.headers["x-tenant-id"] as string) ||
    (req.query.tenant as string) ||
    req.subdomains[0];

  if (!tenant && req.user) {
    tenant = req.user.tenant;
  }

  if (!tenant) {
    return next(new AppError("Tenant information is required", 400));
  }

  req.tenant = tenant;
  next();
};

/**
 * Middleware to ensure user belongs to the tenant with role scope validation
 */
export const validateTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin has access to all tenants
  if (req.user.role === "super_admin") {
    return next();
  }

  // Global scope users can access any tenant
  if (req.user.roleScope === "global") {
    return next();
  }

  // Limited scope users can access managed tenants
  if (req.user.roleScope === "limited") {
    if (req.user.managedTenants.includes(req.tenant)) {
      return next();
    }
    return next(new AppError("You do not have access to this tenant", 403));
  }

  // Tenant scope users can only access their own tenant
  if (req.user.roleScope === "tenant") {
    if (req.user.tenant === req.tenant) {
      return next();
    }
    return next(new AppError("You do not have access to this tenant", 403));
  }

  return next(new AppError("Invalid role scope", 403));
};
