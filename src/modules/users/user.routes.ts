import { Router } from "express";
import userController from "./user.controller";
import {
  authenticate,
  authorize,
  extractTenant,
  validateTenant,
} from "../../middlewares/auth.middleware";
import {
  validateRoleAccess,
  validateResourceAccess,
  validateTenantAccess,
  validateUserCreation,
  validateRoleUpdate,
} from "../../middlewares/permission.middleware";
import {
  validate,
  validateQuery,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userQuerySchema,
  userParamsSchema,
  updateUserRoleSchema,
} from "./user.dto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - tenant
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         tenant:
 *           type: string
 *           description: The tenant ID the user belongs to
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [admin, tenant_admin, teacher, student, parent]
 *           description: User's role in the system
 *         avatar:
 *           type: string
 *           description: URL to user's avatar image
 *         phone:
 *           type: string
 *           description: User's phone number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: User's date of birth
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: User's gender
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: User's last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Public routes
/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenant
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               tenant:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, tenant_admin, teacher, student, parent]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", validate(registerUserSchema), userController.register);

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               tenant:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate(loginUserSchema), userController.login);

/**
 * @swagger
 * /api/v1/users/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               tenant:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset token sent
 *       404:
 *         description: User not found
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  userController.forgotPassword
);

/**
 * @swagger
 * /api/v1/users/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  userController.resetPassword
);

// Protected routes - require authentication
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", userController.logout);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get("/me", userController.getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.patch("/me", validate(updateUserSchema), userController.updateMe);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 */
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  userController.changePassword
);

// Role hierarchy management routes
/**
 * @swagger
 * /api/v1/users/available-roles:
 *   get:
 *     summary: Get available roles for user creation
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available roles retrieved successfully
 */
router.get(
  "/available-roles",
  validateRoleAccess("admin"),
  userController.getAvailableRoles
);

/**
 * @swagger
 * /api/v1/users/my-created-users:
 *   get:
 *     summary: Get users created by current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Created users retrieved successfully
 */
router.get(
  "/my-created-users",
  validateRoleAccess("admin"),
  userController.getMyCreatedUsers
);

/**
 * @swagger
 * /api/v1/users/role-hierarchy:
 *   get:
 *     summary: Get role hierarchy information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role hierarchy information retrieved successfully
 */
router.get("/role-hierarchy", userController.getRoleHierarchy);

/**
 * @swagger
 * /api/v1/users/bulk-create:
 *   post:
 *     summary: Bulk create users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Bulk user creation completed
 */
router.post(
  "/bulk-create",
  validateRoleAccess("admin"),
  validateResourceAccess("user", "create"),
  userController.bulkCreateUsers
);

// Admin/Tenant Admin only routes
/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin"),
  userController.getUserStats
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users with pagination and filtering
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, manager, admin, tenant_admin, teacher, student, parent]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get(
  "/",
  authorize("admin", "tenant_admin"),
  validateQuery(userQuerySchema),
  userController.getAllUsers
);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user with role hierarchy validation
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               role:
 *                 type: string
 *                 enum: [super_admin, manager, admin, tenant_admin, teacher, student, parent]
 *               tenant:
 *                 type: string
 *               managedTenants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/",
  validateRoleAccess("admin"),
  validateUserCreation(),
  validateResourceAccess("user", "create"),
  userController.createUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(userParamsSchema),
  userController.getUserById
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(userParamsSchema),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     summary: Update user role with hierarchy validation
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [super_admin, manager, admin, tenant_admin, teacher, student, parent]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/role",
  authorize("admin", "tenant_admin"),
  validateParams(userParamsSchema),
  validate(updateUserRoleSchema),
  validateRoleUpdate(),
  userController.updateUserRole
);

/**
 * @swagger
 * /api/v1/users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle user status (activate/deactivate)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       404:
 *         description: User not found
 */
router.patch(
  "/:id/toggle-status",
  authorize("admin", "tenant_admin"),
  validateParams(userParamsSchema),
  userController.toggleUserStatus
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(userParamsSchema),
  userController.deleteUser
);

export default router;
