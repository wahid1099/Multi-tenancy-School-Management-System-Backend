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

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select("+active");
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

    // Grant access to protected route
    req.user = currentUser;
    req.tenant = currentUser.tenant;
    next();
  }
);

/**
 * Authorize user based on roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
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
 * Middleware to ensure user belongs to the tenant
 */
export const validateTenant = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.tenant !== req.tenant) {
    return next(new AppError("You do not have access to this tenant", 403));
  }
  next();
};
