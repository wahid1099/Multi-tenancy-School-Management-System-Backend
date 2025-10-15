import { User, IUser } from "../modules/users/user.model";
import { AuditLog } from "../modules/audit/audit.model";
import { DEFAULT_PERMISSIONS } from "../modules/permissions/permission.model";
import AppError from "../utils/AppError";

export type UserRole =
  | "super_admin"
  | "manager"
  | "admin"
  | "tenant_admin"
  | "teacher"
  | "student"
  | "parent";

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  tenant?: string;
  managedTenants?: string[];
}

export class RoleManagementService {
  private static readonly ROLE_LEVELS: Record<UserRole, number> = {
    student: 0,
    parent: 0,
    teacher: 1,
    admin: 2,
    tenant_admin: 3,
    manager: 4,
    super_admin: 5,
  };

  private static readonly ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
    super_admin: [
      "manager",
      "admin",
      "tenant_admin",
      "teacher",
      "student",
      "parent",
    ],
    manager: ["admin", "tenant_admin", "teacher", "student", "parent"],
    admin: ["teacher", "student", "parent"],
    tenant_admin: ["admin", "teacher", "student", "parent"],
    teacher: ["student", "parent"],
    student: [],
    parent: [],
  };

  /**
   * Check if a creator role can create a target role
   */
  static canCreateRole(
    creatorRole: UserRole,
    targetRole: UserRole,
    tenantScope?: string
  ): boolean {
    const creatorLevel = this.ROLE_LEVELS[creatorRole];
    const targetLevel = this.ROLE_LEVELS[targetRole];

    // Super admin can create anyone
    if (creatorRole === "super_admin") {
      return true;
    }

    // Manager can create roles below them, but not other managers or super admins
    if (creatorRole === "manager") {
      return targetLevel < creatorLevel && targetRole !== "manager";
    }

    // Tenant admin can create admins, teachers, students, parents within their tenant
    if (creatorRole === "tenant_admin") {
      return this.ROLE_HIERARCHY[creatorRole].includes(targetRole);
    }

    // Admin can create teachers, students, parents within their scope
    if (creatorRole === "admin") {
      return this.ROLE_HIERARCHY[creatorRole].includes(targetRole);
    }

    // Teachers and below cannot create users
    return false;
  }

  /**
   * Validate role hierarchy for user creation
   */
  static async validateRoleHierarchy(
    creatorId: string,
    targetRole: UserRole
  ): Promise<boolean> {
    try {
      const creator = await User.findById(creatorId).select(
        "role roleLevel tenant managedTenants"
      );
      if (!creator) {
        throw new AppError("Creator user not found", 404);
      }

      return this.canCreateRole(creator.role as UserRole, targetRole);
    } catch (error) {
      throw new AppError("Failed to validate role hierarchy", 500);
    }
  }

  /**
   * Get available roles that a user can create
   */
  static async getAvailableRoles(userId: string): Promise<UserRole[]> {
    try {
      const user = await User.findById(userId).select(
        "role roleLevel tenant managedTenants"
      );
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const userRole = user.role as UserRole;
      return this.ROLE_HIERARCHY[userRole] || [];
    } catch (error) {
      throw new AppError("Failed to get available roles", 500);
    }
  }

  /**
   * Create user with role validation
   */
  static async createUserWithRole(
    creatorId: string,
    userData: CreateUserData
  ): Promise<IUser> {
    try {
      const creator = await User.findById(creatorId).select(
        "role roleLevel tenant managedTenants"
      );
      if (!creator) {
        throw new AppError("Creator user not found", 404);
      }

      // Validate role hierarchy
      if (!this.canCreateRole(creator.role as UserRole, userData.role)) {
        throw new AppError(
          `Insufficient permissions. ${creator.role} cannot create ${userData.role}`,
          403
        );
      }

      // Validate tenant scope
      let assignedTenant = userData.tenant;
      if (!assignedTenant) {
        // Auto-assign tenant based on creator's scope
        if (creator.roleScope === "global" && creator.role === "super_admin") {
          throw new AppError("Tenant must be specified for user creation", 400);
        }
        assignedTenant = creator.tenant;
      }

      // Validate creator can assign to this tenant
      if (creator.roleScope === "tenant" && assignedTenant !== creator.tenant) {
        throw new AppError("Cannot create users in other tenants", 403);
      }

      if (
        creator.roleScope === "limited" &&
        !creator.managedTenants.includes(assignedTenant)
      ) {
        throw new AppError("Cannot create users in unmanaged tenants", 403);
      }

      // Set default permissions based on role
      const rolePermissions = DEFAULT_PERMISSIONS[userData.role] || [];
      const defaultPermissions = rolePermissions.map((p) => ({
        resource: p.resource,
        actions: [...p.actions],
        scope: p.scope as "global" | "tenant" | "own",
        conditions: (p as any).conditions,
      }));

      // Create the user
      const newUser = new User({
        ...userData,
        tenant: assignedTenant,
        createdBy: creatorId,
        permissions: defaultPermissions,
        roleScope: this.determineRoleScope(userData.role),
        managedTenants: userData.managedTenants || [],
      });

      await newUser.save();

      // Log the user creation
      await this.logUserCreation(
        creatorId,
        (newUser._id as string).toString(),
        userData.role,
        assignedTenant
      );

      return newUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create user", 500);
    }
  }

  /**
   * Update user role with validation
   */
  static async updateUserRole(
    updaterId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<IUser> {
    try {
      const updater = await User.findById(updaterId).select(
        "role roleLevel tenant managedTenants"
      );
      const targetUser = await User.findById(targetUserId).select(
        "role roleLevel tenant"
      );

      if (!updater || !targetUser) {
        throw new AppError("User not found", 404);
      }

      const oldRole = targetUser.role as UserRole;

      // Validate updater can modify this role
      if (!this.canCreateRole(updater.role as UserRole, newRole)) {
        throw new AppError(
          `Insufficient permissions. ${updater.role} cannot assign ${newRole}`,
          403
        );
      }

      // Validate tenant scope
      if (
        updater.roleScope === "tenant" &&
        targetUser.tenant !== updater.tenant
      ) {
        throw new AppError("Cannot modify users in other tenants", 403);
      }

      // Update the role
      targetUser.role = newRole;
      targetUser.roleScope = this.determineRoleScope(newRole);
      const rolePermissions = DEFAULT_PERMISSIONS[newRole] || [];
      targetUser.permissions = rolePermissions.map((p) => ({
        resource: p.resource,
        actions: [...p.actions],
        scope: p.scope as "global" | "tenant" | "own",
        conditions: (p as any).conditions,
      }));

      await targetUser.save();

      // Log the role change
      await this.logRoleChange(
        updaterId,
        targetUserId,
        oldRole,
        newRole,
        targetUser.tenant
      );

      return targetUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update user role", 500);
    }
  }

  /**
   * Get users created by a specific user
   */
  static async getUsersByCreator(creatorId: string): Promise<IUser[]> {
    try {
      const users = await User.find({ createdBy: creatorId })
        .select("-password")
        .populate("createdBy", "firstName lastName email role")
        .sort({ createdAt: -1 });

      return users;
    } catch (error) {
      throw new AppError("Failed to get users by creator", 500);
    }
  }

  /**
   * Determine role scope based on role type
   */
  private static determineRoleScope(
    role: UserRole
  ): "global" | "tenant" | "limited" {
    switch (role) {
      case "super_admin":
        return "global";
      case "manager":
        return "limited"; // Can manage specific tenants
      case "admin":
        return "tenant"; // Can be global or tenant-specific
      case "tenant_admin":
      case "teacher":
      case "student":
      case "parent":
        return "tenant";
      default:
        return "tenant";
    }
  }

  /**
   * Log user creation for audit trail
   */
  private static async logUserCreation(
    creatorId: string,
    newUserId: string,
    role: UserRole,
    tenant: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: creatorId,
        action: "create_user",
        target: newUserId,
        resource: "user",
        details: {
          newRole: role,
          tenant: tenant,
        },
        tenant: tenant,
        severity:
          role === "super_admin" || role === "manager" ? "high" : "medium",
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error("Failed to log user creation:", error);
    }
  }

  /**
   * Log role change for audit trail
   */
  private static async logRoleChange(
    updaterId: string,
    targetUserId: string,
    oldRole: UserRole,
    newRole: UserRole,
    tenant: string
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: updaterId,
        action: "update_role",
        target: targetUserId,
        resource: "role",
        details: {
          oldRole: oldRole,
          newRole: newRole,
        },
        tenant: tenant,
        severity:
          newRole === "super_admin" || newRole === "manager"
            ? "critical"
            : "high",
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error("Failed to log role change:", error);
    }
  }
}
