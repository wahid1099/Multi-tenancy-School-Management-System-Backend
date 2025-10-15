import { Router } from "express";
import roleController from "./role.controller";
import {
  authenticate,
  authorize,
  extractTenant,
  validateTenant,
} from "../../middlewares/auth.middleware";
import {
  validate,
  validateQuery,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  createRoleSchema,
  updateRoleSchema,
  roleQuerySchema,
  roleParamsSchema,
} from "./role.dto";

const router = Router();

// Protected routes - require authentication
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               resource:
 *                 type: string
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *         isSystem:
 *           type: boolean
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Role'
 *     responses:
 *       201:
 *         description: Role created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createRoleSchema),
  roleController.createRole
);

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 */
router.get(
  "/",
  authorize("admin", "tenant_admin"),
  validateQuery(roleQuerySchema),
  roleController.getAllRoles
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
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
 *         description: Role retrieved successfully
 */
router.get(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(roleParamsSchema),
  roleController.getRoleById
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   patch:
 *     summary: Update role
 *     tags: [Roles]
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
 *         description: Role updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(roleParamsSchema),
  validate(updateRoleSchema),
  roleController.updateRole
);

/**
 * @swagger
 * /api/v1/roles/{id}/toggle-status:
 *   patch:
 *     summary: Toggle role status
 *     tags: [Roles]
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
 *         description: Role status toggled successfully
 */
router.patch(
  "/:id/toggle-status",
  authorize("admin", "tenant_admin"),
  validateParams(roleParamsSchema),
  roleController.toggleRoleStatus
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
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
 *         description: Role deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(roleParamsSchema),
  roleController.deleteRole
);

export default router;
