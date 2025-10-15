import { Router } from "express";
import classController from "./class.controller";
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
  createClassSchema,
  updateClassSchema,
  addStudentSchema,
  removeStudentSchema,
  classQuerySchema,
  classParamsSchema,
} from "./class.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - name
 *         - section
 *         - grade
 *         - academicYear
 *         - classTeacher
 *         - capacity
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         section:
 *           type: string
 *         grade:
 *           type: string
 *         academicYear:
 *           type: string
 *           pattern: '^\d{4}-\d{4}$'
 *         classTeacher:
 *           type: string
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *         students:
 *           type: array
 *           items:
 *             type: string
 *         capacity:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *         room:
 *           type: string
 *         schedule:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               day:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               subject:
 *                 type: string
 *               teacher:
 *                 type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/classes/stats:
 *   get:
 *     summary: Get class statistics
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  classController.getClassStats
);

/**
 * @swagger
 * /api/v1/classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: Class created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createClassSchema),
  classController.createClass
);

/**
 * @swagger
 * /api/v1/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: classTeacher
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Classes retrieved successfully
 */
router.get("/", validateQuery(classQuerySchema), classController.getAllClasses);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
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
 *         description: Class retrieved successfully
 */
router.get(
  "/:id",
  validateParams(classParamsSchema),
  classController.getClassById
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   patch:
 *     summary: Update class
 *     tags: [Classes]
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
 *         description: Class updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(classParamsSchema),
  validate(updateClassSchema),
  classController.updateClass
);

/**
 * @swagger
 * /api/v1/classes/{id}/students:
 *   post:
 *     summary: Add student to class
 *     tags: [Classes]
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
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student added to class successfully
 */
router.post(
  "/:id/students",
  authorize("admin", "tenant_admin"),
  validateParams(classParamsSchema),
  validate(addStudentSchema),
  classController.addStudent
);

/**
 * @swagger
 * /api/v1/classes/{id}/students:
 *   delete:
 *     summary: Remove student from class
 *     tags: [Classes]
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
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student removed from class successfully
 */
router.delete(
  "/:id/students",
  authorize("admin", "tenant_admin"),
  validateParams(classParamsSchema),
  validate(removeStudentSchema),
  classController.removeStudent
);

/**
 * @swagger
 * /api/v1/classes/{id}:
 *   delete:
 *     summary: Delete class
 *     tags: [Classes]
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
 *         description: Class deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(classParamsSchema),
  classController.deleteClass
);

export default router;
