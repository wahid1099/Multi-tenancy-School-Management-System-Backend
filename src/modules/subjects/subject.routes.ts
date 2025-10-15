import { Router } from "express";
import subjectController from "./subject.controller";
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
  createSubjectSchema,
  updateSubjectSchema,
  subjectQuerySchema,
  subjectParamsSchema,
} from "./subject.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Subject:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - category
 *         - credits
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [core, elective, extracurricular]
 *         credits:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *         department:
 *           type: string
 *         prerequisites:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/subjects/stats:
 *   get:
 *     summary: Get subject statistics
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subject statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  subjectController.getSubjectStats
);

/**
 * @swagger
 * /api/v1/subjects/category/{category}:
 *   get:
 *     summary: Get subjects by category
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [core, elective, extracurricular]
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 */
router.get("/category/:category", subjectController.getSubjectsByCategory);

/**
 * @swagger
 * /api/v1/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Subject'
 *     responses:
 *       201:
 *         description: Subject created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createSubjectSchema),
  subjectController.createSubject
);

/**
 * @swagger
 * /api/v1/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [core, elective, extracurricular]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subjects retrieved successfully
 */
router.get(
  "/",
  validateQuery(subjectQuerySchema),
  subjectController.getAllSubjects
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   get:
 *     summary: Get subject by ID
 *     tags: [Subjects]
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
 *         description: Subject retrieved successfully
 */
router.get(
  "/:id",
  validateParams(subjectParamsSchema),
  subjectController.getSubjectById
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   patch:
 *     summary: Update subject
 *     tags: [Subjects]
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
 *         description: Subject updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(subjectParamsSchema),
  validate(updateSubjectSchema),
  subjectController.updateSubject
);

/**
 * @swagger
 * /api/v1/subjects/{id}/toggle-status:
 *   patch:
 *     summary: Toggle subject status
 *     tags: [Subjects]
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
 *         description: Subject status toggled successfully
 */
router.patch(
  "/:id/toggle-status",
  authorize("admin", "tenant_admin"),
  validateParams(subjectParamsSchema),
  subjectController.toggleSubjectStatus
);

/**
 * @swagger
 * /api/v1/subjects/{id}:
 *   delete:
 *     summary: Delete subject
 *     tags: [Subjects]
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
 *         description: Subject deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(subjectParamsSchema),
  subjectController.deleteSubject
);

export default router;
