import { Router } from "express";
import timetableController from "./timetable.controller";
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
  createTimetableSchema,
  updateTimetableSchema,
  timetableQuerySchema,
  teacherTimetableQuerySchema,
  timetableParamsSchema,
} from "./timetable.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Timetable:
 *       type: object
 *       required:
 *         - class
 *         - academicYear
 *         - term
 *         - effectiveFrom
 *         - effectiveTo
 *         - timeSlots
 *         - workingDays
 *       properties:
 *         id:
 *           type: string
 *         class:
 *           type: string
 *         academicYear:
 *           type: string
 *           pattern: '^\d{4}-\d{4}$'
 *         term:
 *           type: string
 *           enum: [first, second, third, annual]
 *         effectiveFrom:
 *           type: string
 *           format: date
 *         effectiveTo:
 *           type: string
 *           format: date
 *         timeSlots:
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
 *               room:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lecture, lab, tutorial, break, assembly]
 *         breakTimes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               days:
 *                 type: array
 *                 items:
 *                   type: string
 *         workingDays:
 *           type: array
 *           items:
 *             type: string
 *             enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/timetables/stats:
 *   get:
 *     summary: Get timetable statistics
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timetable statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  timetableController.getTimetableStats
);

/**
 * @swagger
 * /api/v1/timetables/teacher:
 *   get:
 *     summary: Get teacher timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: effectiveDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Teacher timetable retrieved successfully
 */
router.get(
  "/teacher",
  validateQuery(teacherTimetableQuerySchema),
  timetableController.getTeacherTimetable
);

/**
 * @swagger
 * /api/v1/timetables/current/{classId}:
 *   get:
 *     summary: Get current timetable for a class
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current timetable retrieved successfully
 */
router.get("/current/:classId", timetableController.getCurrentTimetable);

/**
 * @swagger
 * /api/v1/timetables:
 *   post:
 *     summary: Create a new timetable
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Timetable'
 *     responses:
 *       201:
 *         description: Timetable created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createTimetableSchema),
  timetableController.createTimetable
);

/**
 * @swagger
 * /api/v1/timetables:
 *   get:
 *     summary: Get all timetables
 *     tags: [Timetables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [first, second, third, annual]
 *       - in: query
 *         name: effectiveDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Timetables retrieved successfully
 */
router.get(
  "/",
  validateQuery(timetableQuerySchema),
  timetableController.getAllTimetables
);

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   get:
 *     summary: Get timetable by ID
 *     tags: [Timetables]
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
 *         description: Timetable retrieved successfully
 */
router.get(
  "/:id",
  validateParams(timetableParamsSchema),
  timetableController.getTimetableById
);

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   patch:
 *     summary: Update timetable
 *     tags: [Timetables]
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
 *         description: Timetable updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(timetableParamsSchema),
  validate(updateTimetableSchema),
  timetableController.updateTimetable
);

/**
 * @swagger
 * /api/v1/timetables/{id}:
 *   delete:
 *     summary: Delete timetable
 *     tags: [Timetables]
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
 *         description: Timetable deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(timetableParamsSchema),
  timetableController.deleteTimetable
);

export default router;
