import { Router } from "express";
import examController from "./exam.controller";
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
  createExamSchema,
  updateExamSchema,
  publishExamSchema,
  examQuerySchema,
  examParamsSchema,
} from "./exam.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Exam:
 *       type: object
 *       required:
 *         - title
 *         - subject
 *         - class
 *         - examType
 *         - totalMarks
 *         - passingMarks
 *         - duration
 *         - startDate
 *         - endDate
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         subject:
 *           type: string
 *         class:
 *           type: string
 *         examType:
 *           type: string
 *           enum: [quiz, unit_test, midterm, final, assignment]
 *         totalMarks:
 *           type: number
 *           minimum: 1
 *         passingMarks:
 *           type: number
 *           minimum: 0
 *         duration:
 *           type: number
 *           minimum: 1
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         instructions:
 *           type: string
 *         questions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer, essay]
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctAnswer:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               marks:
 *                 type: number
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *         isPublished:
 *           type: boolean
 *         allowRetake:
 *           type: boolean
 *         maxAttempts:
 *           type: number
 *         showResults:
 *           type: boolean
 *         randomizeQuestions:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/exams/stats:
 *   get:
 *     summary: Get exam statistics
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exam statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  examController.getExamStats
);

/**
 * @swagger
 * /api/v1/exams/types:
 *   get:
 *     summary: Get exam statistics by type
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Exam type statistics retrieved successfully
 */
router.get(
  "/types",
  authorize("admin", "tenant_admin", "teacher"),
  examController.getExamsByType
);

/**
 * @swagger
 * /api/v1/exams/upcoming:
 *   get:
 *     summary: Get upcoming exams
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Upcoming exams retrieved successfully
 */
router.get("/upcoming", examController.getUpcomingExams);

/**
 * @swagger
 * /api/v1/exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Exam'
 *     responses:
 *       201:
 *         description: Exam created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin", "teacher"),
  validate(createExamSchema),
  examController.createExam
);

/**
 * @swagger
 * /api/v1/exams:
 *   get:
 *     summary: Get all exams
 *     tags: [Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: examType
 *         schema:
 *           type: string
 *           enum: [quiz, unit_test, midterm, final, assignment]
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Exams retrieved successfully
 */
router.get("/", validateQuery(examQuerySchema), examController.getAllExams);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   get:
 *     summary: Get exam by ID
 *     tags: [Exams]
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
 *         description: Exam retrieved successfully
 */
router.get(
  "/:id",
  validateParams(examParamsSchema),
  examController.getExamById
);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   patch:
 *     summary: Update exam
 *     tags: [Exams]
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
 *         description: Exam updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(examParamsSchema),
  validate(updateExamSchema),
  examController.updateExam
);

/**
 * @swagger
 * /api/v1/exams/{id}/publish:
 *   patch:
 *     summary: Publish exam
 *     tags: [Exams]
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
 *         description: Exam published successfully
 */
router.patch(
  "/:id/publish",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(examParamsSchema),
  examController.publishExam
);

/**
 * @swagger
 * /api/v1/exams/{id}:
 *   delete:
 *     summary: Delete exam
 *     tags: [Exams]
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
 *         description: Exam deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(examParamsSchema),
  examController.deleteExam
);

export default router;
