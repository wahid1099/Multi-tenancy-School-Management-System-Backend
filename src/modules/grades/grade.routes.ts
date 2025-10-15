import { Router } from "express";
import gradeController from "./grade.controller";
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
  createGradeSchema,
  updateGradeSchema,
  publishGradeSchema,
  gradeQuerySchema,
  studentGradeQuerySchema,
  gradeReportSchema,
  gradeParamsSchema,
} from "./grade.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - exam
 *         - academicYear
 *         - grades
 *       properties:
 *         id:
 *           type: string
 *         exam:
 *           type: string
 *         class:
 *           type: string
 *         subject:
 *           type: string
 *         teacher:
 *           type: string
 *         academicYear:
 *           type: string
 *           pattern: '^\d{4}-\d{4}$'
 *         gradingScale:
 *           type: object
 *           properties:
 *             A:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *             B:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *             C:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *             D:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *             F:
 *               type: object
 *               properties:
 *                 min:
 *                   type: number
 *                 max:
 *                   type: number
 *         grades:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               student:
 *                 type: string
 *               marksObtained:
 *                 type: number
 *               grade:
 *                 type: string
 *                 enum: [A, B, C, D, F]
 *               percentage:
 *                 type: number
 *               remarks:
 *                 type: string
 *               isAbsent:
 *                 type: boolean
 *         totalStudents:
 *           type: number
 *         averageMarks:
 *           type: number
 *         averagePercentage:
 *           type: number
 *         passCount:
 *           type: number
 *         failCount:
 *           type: number
 *         isPublished:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/grades/stats:
 *   get:
 *     summary: Get grade statistics
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grade statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  gradeController.getGradeStats
);

/**
 * @swagger
 * /api/v1/grades/student:
 *   get:
 *     summary: Get student grades
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student grades retrieved successfully
 */
router.get(
  "/student",
  validateQuery(studentGradeQuerySchema),
  gradeController.getStudentGrades
);

/**
 * @swagger
 * /api/v1/grades/report:
 *   get:
 *     summary: Get grade report
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [summary, detailed, transcript]
 *     responses:
 *       200:
 *         description: Grade report generated successfully
 */
router.get(
  "/report",
  authorize("admin", "tenant_admin", "teacher"),
  validateQuery(gradeReportSchema),
  gradeController.getGradeReport
);

/**
 * @swagger
 * /api/v1/grades:
 *   post:
 *     summary: Create grade record
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Grade created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin", "teacher"),
  validate(createGradeSchema),
  gradeController.createGrade
);

/**
 * @swagger
 * /api/v1/grades:
 *   get:
 *     summary: Get all grades
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Grades retrieved successfully
 */
router.get("/", validateQuery(gradeQuerySchema), gradeController.getAllGrades);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   get:
 *     summary: Get grade by ID
 *     tags: [Grades]
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
 *         description: Grade retrieved successfully
 */
router.get(
  "/:id",
  validateParams(gradeParamsSchema),
  gradeController.getGradeById
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   patch:
 *     summary: Update grade
 *     tags: [Grades]
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
 *         description: Grade updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(gradeParamsSchema),
  validate(updateGradeSchema),
  gradeController.updateGrade
);

/**
 * @swagger
 * /api/v1/grades/{id}/publish:
 *   patch:
 *     summary: Publish grade
 *     tags: [Grades]
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
 *         description: Grade published successfully
 */
router.patch(
  "/:id/publish",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(gradeParamsSchema),
  gradeController.publishGrade
);

/**
 * @swagger
 * /api/v1/grades/{id}:
 *   delete:
 *     summary: Delete grade
 *     tags: [Grades]
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
 *         description: Grade deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(gradeParamsSchema),
  gradeController.deleteGrade
);

export default router;
