export type UserRole =
  | "super_admin"
  | "manager"
  | "admin"
  | "tenant_admin"
  | "teacher"
  | "student"
  | "parent";

/**
 * Role hierarchy levels - higher number means higher authority
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  student: 0,
  parent: 0,
  teacher: 1,
  admin: 2,
  tenant_admin: 3,
  manager: 4,
  super_admin: 5,
};

/**
 * Get numeric level for a role
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_LEVELS[role] || 0;
}

/**
 * Compare two roles and return the relationship
 */
export function compareRoles(
  role1: UserRole,
  role2: UserRole
): "higher" | "lower" | "equal" {
  const level1 = getRoleLevel(role1);
  const level2 = getRoleLevel(role2);

  if (level1 > level2) return "higher";
  if (level1 < level2) return "lower";
  return "equal";
}

/**
 * Check if role1 is higher than role2 in hierarchy
 */
export function isHigherRole(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) > getRoleLevel(role2);
}

/**
 * Check if role1 is lower than role2 in hierarchy
 */
export function isLowerRole(role1: UserRole, role2: UserRole): boolean {
  return getRoleLevel(role1) < getRoleLevel(role2);
}

/**
 * Check if role1 can manage role2 (is higher or equal in hierarchy)
 */
export function canManageRole(
  managerRole: UserRole,
  targetRole: UserRole
): boolean {
  return getRoleLevel(managerRole) >= getRoleLevel(targetRole);
}

/**
 * Get all roles that are lower than the given role
 */
export function getLowerRoles(role: UserRole): UserRole[] {
  const currentLevel = getRoleLevel(role);
  return Object.entries(ROLE_LEVELS)
    .filter(([_, level]) => level < currentLevel)
    .map(([roleName, _]) => roleName as UserRole);
}

/**
 * Get all roles that are higher than the given role
 */
export function getHigherRoles(role: UserRole): UserRole[] {
  const currentLevel = getRoleLevel(role);
  return Object.entries(ROLE_LEVELS)
    .filter(([_, level]) => level > currentLevel)
    .map(([roleName, _]) => roleName as UserRole);
}

/**
 * Get roles at the same level as the given role
 */
export function getEqualRoles(role: UserRole): UserRole[] {
  const currentLevel = getRoleLevel(role);
  return Object.entries(ROLE_LEVELS)
    .filter(([_, level]) => level === currentLevel)
    .map(([roleName, _]) => roleName as UserRole);
}

/**
 * Check if a role is administrative (can manage other users)
 */
export function isAdministrativeRole(role: UserRole): boolean {
  return getRoleLevel(role) >= getRoleLevel("admin");
}

/**
 * Check if a role is a system-level role (super_admin, manager)
 */
export function isSystemRole(role: UserRole): boolean {
  return role === "super_admin" || role === "manager";
}

/**
 * Check if a role is tenant-specific
 */
export function isTenantRole(role: UserRole): boolean {
  return !isSystemRole(role);
}

/**
 * Get the maximum role level that a role can create
 */
export function getMaxCreatableLevel(creatorRole: UserRole): number {
  const creatorLevel = getRoleLevel(creatorRole);

  // Super admin can create anyone except other super admins
  if (creatorRole === "super_admin") {
    return getRoleLevel("manager");
  }

  // Manager can create roles below them
  if (creatorRole === "manager") {
    return getRoleLevel("tenant_admin");
  }

  // Others can create roles at least 1 level below them
  return Math.max(0, creatorLevel - 1);
}

/**
 * Get roles that can be created by the given role
 */
export function getCreatableRoles(creatorRole: UserRole): UserRole[] {
  const maxLevel = getMaxCreatableLevel(creatorRole);

  return Object.entries(ROLE_LEVELS)
    .filter(([roleName, level]) => {
      // Special case: super_admin cannot create other super_admins
      if (creatorRole === "super_admin" && roleName === "super_admin") {
        return false;
      }

      // Manager cannot create other managers
      if (creatorRole === "manager" && roleName === "manager") {
        return false;
      }

      return level <= maxLevel;
    })
    .map(([roleName, _]) => roleName as UserRole)
    .sort((a, b) => getRoleLevel(b) - getRoleLevel(a)); // Sort by level descending
}

/**
 * Validate role transition (for role updates)
 */
export function isValidRoleTransition(
  updaterRole: UserRole,
  currentRole: UserRole,
  newRole: UserRole
): { valid: boolean; reason?: string } {
  // Updater must be able to manage both current and new roles
  if (!canManageRole(updaterRole, currentRole)) {
    return {
      valid: false,
      reason: `${updaterRole} cannot manage users with role ${currentRole}`,
    };
  }

  if (!canManageRole(updaterRole, newRole)) {
    return {
      valid: false,
      reason: `${updaterRole} cannot assign role ${newRole}`,
    };
  }

  // Special restrictions
  if (newRole === "super_admin" && updaterRole !== "super_admin") {
    return {
      valid: false,
      reason: "Only super_admin can create other super_admins",
    };
  }

  if (newRole === "manager" && updaterRole !== "super_admin") {
    return {
      valid: false,
      reason: "Only super_admin can create managers",
    };
  }

  return { valid: true };
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    super_admin: "Super Administrator",
    manager: "Manager",
    admin: "Administrator",
    tenant_admin: "School Administrator",
    teacher: "Teacher",
    student: "Student",
    parent: "Parent",
  };

  return displayNames[role] || role;
}

/**
 * Get role description for UI
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    super_admin: "Full system access across all tenants and users",
    manager: "Manages specific tenants and their users",
    admin: "Manages users within assigned scope (global or tenant)",
    tenant_admin: "Manages all aspects of their school/tenant",
    teacher: "Manages classes, attendance, and grades",
    student: "Access to own academic information",
    parent: "Access to child's academic information",
  };

  return descriptions[role] || "No description available";
}
