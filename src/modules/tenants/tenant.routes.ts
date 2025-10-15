import { Router } from "express";
import tenantController from "./tenant.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import {
  validate,
  validateQuery,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  createTenantSchema,
  updateTenantSchema,
  tenantQuerySchema,
  tenantParamsSchema,
} from "./tenant.dto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       required:
 *         - name
 *         - subdomain
 *         - address
 *         - contact
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the tenant
 *         name:
 *           type: string
 *           description: The name of the tenant organization
 *         subdomain:
 *           type: string
 *           description: The unique subdomain for the tenant
 *         domain:
 *           type: string
 *           description: Custom domain (optional)
 *         logo:
 *           type: string
 *           description: URL to the tenant's logo
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
 *         contact:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
 *             website:
 *               type: string
 *         settings:
 *           type: object
 *           properties:
 *             timezone:
 *               type: string
 *             currency:
 *               type: string
 *             language:
 *               type: string
 *             academicYearStart:
 *               type: string
 *               format: date
 *             academicYearEnd:
 *               type: string
 *               format: date
 *         subscription:
 *           type: object
 *           properties:
 *             plan:
 *               type: string
 *               enum: [basic, premium, enterprise]
 *             status:
 *               type: string
 *               enum: [active, inactive, suspended]
 *             startDate:
 *               type: string
 *               format: date
 *             endDate:
 *               type: string
 *               format: date
 *             maxUsers:
 *               type: number
 *             maxStudents:
 *               type: number
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tenant'
 *       400:
 *         description: Bad request
 */
router.post("/", validate(createTenantSchema), tenantController.createTenant);

/**
 * @swagger
 * /api/v1/tenants/stats:
 *   get:
 *     summary: Get tenant statistics
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant statistics retrieved successfully
 */
router.get(
  "/stats",
  authenticate,
  authorize("admin"),
  tenantController.getTenantStats
);

/**
 * @swagger
 * /api/v1/tenants/subdomain/{subdomain}:
 *   get:
 *     summary: Get tenant by subdomain
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: subdomain
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant subdomain
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *       404:
 *         description: Tenant not found
 */
router.get("/subdomain/:subdomain", tenantController.getTenantBySubdomain);

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     summary: Get all tenants with pagination and filtering
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by subscription status
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [basic, premium, enterprise]
 *         description: Filter by subscription plan
 *     responses:
 *       200:
 *         description: Tenants retrieved successfully
 */
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(tenantQuerySchema),
  tenantController.getAllTenants
);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *       404:
 *         description: Tenant not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(tenantParamsSchema),
  tenantController.getTenantById
);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   patch:
 *     summary: Update tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tenant'
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 */
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "tenant_admin"),
  validateParams(tenantParamsSchema),
  validate(updateTenantSchema),
  tenantController.updateTenant
);

/**
 * @swagger
 * /api/v1/tenants/{id}/toggle-status:
 *   patch:
 *     summary: Toggle tenant status (activate/deactivate)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant status toggled successfully
 *       404:
 *         description: Tenant not found
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("admin"),
  validateParams(tenantParamsSchema),
  tenantController.toggleTenantStatus
);

/**
 * @swagger
 * /api/v1/tenants/{id}:
 *   delete:
 *     summary: Delete tenant (soft delete)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The tenant ID
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(tenantParamsSchema),
  tenantController.deleteTenant
);

export default router;
