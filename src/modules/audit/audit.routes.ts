import { Router } from "express";
import auditController from "./audit.controller";
import {
  authenticate,
  authorize,
  extractTenant,
  validateTenant,
} from "../../middlewares/auth.middleware";
import {
  validateRoleAccess,
  validateAuditAccess,
  validateSystemAdmin,
} from "../../middlewares/permission.middleware";

const router = Router();

// All audit routes require authentication
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the audit log
 *         actor:
 *           type: object
 *           description: User who performed the action
 *           properties:
 *             _id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *         action:
 *           type: string
 *           description: Type of action performed
 *           enum: [create_user, update_role, delete_user, permission_denied, login, logout, role_escalation_attempt, unauthorized_access, password_reset, account_locked, account_unlocked, tenant_access_violation]
 *         target:
 *           type: object
 *           description: Target user/resource affected (optional)
 *         resource:
 *           type: string
 *           description: Resource type
 *           enum: [user, role, tenant, permission, auth, system]
 *         details:
 *           type: object
 *           description: Additional action details
 *         tenant:
 *           type: string
 *           description: Tenant context
 *         ipAddress:
 *           type: string
 *           description: IP address of the actor
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the action occurred
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Security severity level
 */

/**
 * @swagger
 * /api/v1/audit/logs:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: actor
 *         schema:
 *           type: string
 *         description: Filter by actor user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity level
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
 *           default: 25
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AuditLog'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/logs",
  validateRoleAccess("admin"),
  validateAuditAccess(),
  auditController.getAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/stats:
 *   get:
 *     summary: Get audit statistics
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for statistics
 *       - in: query
 *         name: tenant
 *         schema:
 *           type: string
 *         description: Filter by tenant (Super Admin only)
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/stats",
  validateRoleAccess("admin"),
  validateAuditAccess(),
  auditController.getAuditStats
);

/**
 * @swagger
 * /api/v1/audit/export:
 *   get:
 *     summary: Export audit logs to CSV
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/export",
  validateRoleAccess("manager"),
  validateAuditAccess("global"),
  auditController.exportAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/critical:
 *   get:
 *     summary: Get recent critical events
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: tenant
 *         schema:
 *           type: string
 *         description: Filter by tenant (Super Admin only)
 *     responses:
 *       200:
 *         description: Critical events retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/critical",
  validateRoleAccess("admin"),
  validateAuditAccess(),
  auditController.getCriticalEvents
);

/**
 * @swagger
 * /api/v1/audit/user-activity/{userId}:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get activity for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  "/user-activity/:userId",
  validateRoleAccess("admin"),
  validateAuditAccess(),
  auditController.getUserActivity
);

/**
 * @swagger
 * /api/v1/audit/log:
 *   post:
 *     summary: Log a custom audit event
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - resource
 *             properties:
 *               action:
 *                 type: string
 *                 description: Action type
 *               resource:
 *                 type: string
 *                 description: Resource type
 *               details:
 *                 type: object
 *                 description: Additional details
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: low
 *     responses:
 *       201:
 *         description: Audit event logged successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  "/log",
  validateRoleAccess("admin"),
  auditController.logCustomEvent
);

/**
 * @swagger
 * /api/v1/audit/cleanup:
 *   delete:
 *     summary: Clean up old audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 30
 *           default: 730
 *         description: Delete logs older than this many days
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *       403:
 *         description: Insufficient permissions (Super Admin only)
 */
router.delete(
  "/cleanup",
  validateSystemAdmin(),
  auditController.cleanupOldLogs
);

export default router;
