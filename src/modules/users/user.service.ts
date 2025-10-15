import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import { User, IUser } from "./user.model";
import { Tenant } from "../tenants/tenant.model";
import AppError from "../../utils/AppError";
import config from "../../config";

export interface RegisterUserData {
  tenant: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?:
    | "super_admin"
    | "manager"
    | "admin"
    | "tenant_admin"
    | "teacher"
    | "student"
    | "parent";
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface LoginUserData {
  email: string;
  password: string;
  tenant?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  avatar?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?:
    | "super_admin"
    | "manager"
    | "admin"
    | "tenant_admin"
    | "teacher"
    | "student"
    | "parent";
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * User Service Class
 */
class UserService {
  /**
   * Generate JWT token with role hierarchy data
   */
  private async generateToken(user: IUser): Promise<string> {
    const payload = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      role: user.role,
      roleLevel: user.roleLevel,
      tenant: user.tenant,
      roleScope: user.roleScope,
      managedTenants: user.managedTenants || [],
      permissions: user.permissions || [],
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(id: string): string {
    return jwt.sign({ id }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Register a new user
   */
  async registerUser(
    userData: RegisterUserData
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Check if tenant exists and is active
    const tenantQuery: any = { isActive: true };

    // Check if tenant value is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(userData.tenant)) {
      tenantQuery.$or = [
        { _id: userData.tenant },
        { subdomain: userData.tenant },
      ];
    } else {
      tenantQuery.subdomain = userData.tenant;
    }

    const tenant = await Tenant.findOne(tenantQuery);

    if (!tenant) {
      throw new AppError("Invalid or inactive tenant", 400);
    }

    // Check if user already exists in this tenant
    const existingUser = await User.findOne({
      email: userData.email,
      tenant: (tenant._id as mongoose.Types.ObjectId).toString(),
    });

    if (existingUser) {
      throw new AppError("User already exists in this tenant", 400);
    }

    // Create user
    const user = new User({
      ...userData,
      tenant: (tenant._id as mongoose.Types.ObjectId).toString(),
    });

    await user.save();

    // Generate tokens
    const token = await this.generateToken(user);
    const refreshToken = this.generateRefreshToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    // Remove password from output
    user.password = undefined as any;

    return { user, token, refreshToken };
  }

  /**
   * Login user - Simplified: only email and password required
   */
  async loginUser(
    loginData: LoginUserData
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    const { email, password } = loginData;

    // Find user by email only and select password
    const user = await User.findOne({ email }).select(
      "+password +loginAttempts +lockUntil +isActive"
    );
    console.log(user);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Validate that user's tenant exists and is active
    const userTenant = await Tenant.findById(user.tenant);
    if (!userTenant || !userTenant.isActive) {
      throw new AppError("User's tenant is inactive or not found", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError("Your account has been deactivated", 401);
    }

    // Check if account is locked
    if (user.checkIsLocked()) {
      throw new AppError(
        "Account temporarily locked due to too many failed login attempts",
        423
      );
    }

    // Check password
    const isPasswordCorrect = await user.correctPassword(
      password,
      user.password
    );
    console.log(isPasswordCorrect);

    if (!isPasswordCorrect) {
      await user.incLoginAttempts();
      throw new AppError("Invalid email or password", 401);
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = await this.generateToken(user);
    const refreshToken = this.generateRefreshToken(
      (user._id as mongoose.Types.ObjectId).toString()
    );

    // Remove sensitive data from output
    user.password = undefined as any;
    user.loginAttempts = undefined as any;
    user.lockUntil = undefined as any;

    return { user, token, refreshToken };
  }

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(tenant: string, query: UserQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Build filter object
    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    if (typeof isEmailVerified === "boolean") {
      filter.isEmailVerified = isEmailVerified;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string, tenant: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, tenant });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    tenant: string,
    updateData: UpdateUserData
  ): Promise<IUser> {
    const user = await User.findOneAndUpdate({ _id: id, tenant }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    id: string,
    tenant: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findOne({ _id: id, tenant }).select("+password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.correctPassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordCorrect) {
      throw new AppError("Current password is incorrect", 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Update user role
   */
  async updateUserRole(
    id: string,
    tenant: string,
    role: string
  ): Promise<IUser> {
    const user = await User.findOneAndUpdate(
      { _id: id, tenant },
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, tenant: string): Promise<void> {
    const user = await User.findOne({ _id: id, tenant });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await User.findByIdAndUpdate(id, { isActive: false });
  }

  /**
   * Toggle user status
   */
  async toggleUserStatus(id: string, tenant: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, tenant }).select("+isActive");
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return user;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string, tenant?: string): Promise<string> {
    // Build query
    const query: any = { email };
    if (tenant) {
      const tenantDoc = await Tenant.findOne({
        $or: [{ _id: tenant }, { subdomain: tenant }],
        isActive: true,
      });

      if (tenantDoc) {
        query.tenant = (tenantDoc._id as mongoose.Types.ObjectId).toString();
      }
    }

    const user = await User.findOne(query);
    if (!user) {
      throw new AppError("No user found with that email address", 404);
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    return resetToken;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<IUser> {
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      throw new AppError("Token is invalid or has expired", 400);
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return user;
  }

  /**
   * Get user statistics for a tenant
   */
  async getUserStats(tenant: string) {
    const stats = await User.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ["$isEmailVerified", true] }, 1, 0] },
          },
          unverifiedUsers: {
            $sum: { $cond: [{ $eq: ["$isEmailVerified", false] }, 1, 0] },
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
          },
          tenantAdminUsers: {
            $sum: { $cond: [{ $eq: ["$role", "tenant_admin"] }, 1, 0] },
          },
          teacherUsers: {
            $sum: { $cond: [{ $eq: ["$role", "teacher"] }, 1, 0] },
          },
          studentUsers: {
            $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] },
          },
          parentUsers: {
            $sum: { $cond: [{ $eq: ["$role", "parent"] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
        adminUsers: 0,
        tenantAdminUsers: 0,
        teacherUsers: 0,
        studentUsers: 0,
        parentUsers: 0,
      }
    );
  }
}

export default new UserService();
