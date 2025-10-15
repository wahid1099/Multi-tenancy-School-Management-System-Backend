import { Router } from "express";
import attendanceController from "./attendance.controller";
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
  createAttendanceSchema,
  updateAttendanceSchema,
  submitAttendanceSchema,
  attendanceQuerySchema,
  attendanceReportSchema,
  attendanceParamsSchema,
} from "./attendance.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - class
 *         - date
 *         - records
 *       properties:
 *         id:
 *           type: string
 *         class:
 *           type: string
 *         subject:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         period:
 *           type: number
 *           minimum: 1
 *           maximum: 10
 *         teacher:
 *           type: string
 *         records:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               student:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *               remarks:
 *                 type: string
 *         totalStudents:
 *           type: number
 *         presentCount:
 *           type: number
 *         absentCount:
 *           type: number
 *         attendancePercentage:
 *           type: number
 *         isSubmitted:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  attendanceController.getAttendanceStats
);

/**
 * @swagger
 * /api/v1/attendance/report:
 *   get:
 *     summary: Get attendance report
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [summary, detailed, student]
 *     responses:
 *       200:
 *         description: Attendance report generated successfully
 */
router.get(
  "/report",
  authorize("admin", "tenant_admin", "teacher"),
  validateQuery(attendanceReportSchema),
  attendanceController.getAttendanceReport
);

/**
 * @swagger
 * /api/v1/attendance:
 *   post:
 *     summary: Create attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Attendance created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin", "teacher"),
  validate(createAttendanceSchema),
  attendanceController.createAttendance
);

/**
 * @swagger
 * /api/v1/attendance:
 *   get:
 *     summary: Get all attendance records
 *     tags: [Attendance]
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
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isSubmitted
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get(
  "/",
  validateQuery(attendanceQuerySchema),
  attendanceController.getAllAttendance
);

/**
 * @swagger
 * /api/v1/attendance/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     tags: [Attendance]
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
 *         description: Attendance record retrieved successfully
 */
router.get(
  "/:id",
  validateParams(attendanceParamsSchema),
  attendanceController.getAttendanceById
);

/**
 * @swagger
 * /api/v1/attendance/{id}:
 *   patch:
 *     summary: Update attendance record
 *     tags: [Attendance]
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
 *         description: Attendance updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(attendanceParamsSchema),
  validate(updateAttendanceSchema),
  attendanceController.updateAttendance
);

/**
 * @swagger
 * /api/v1/attendance/{id}/submit:
 *   patch:
 *     summary: Submit attendance record
 *     tags: [Attendance]
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
 *         description: Attendance submitted successfully
 */
router.patch(
  "/:id/submit",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(attendanceParamsSchema),
  attendanceController.submitAttendance
);

/**
 * @swagger
 * /api/v1/attendance/{id}:
 *   delete:
 *     summary: Delete attendance record
 *     tags: [Attendance]
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
 *         description: Attendance deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin", "teacher"),
  validateParams(attendanceParamsSchema),
  attendanceController.deleteAttendance
);

export default router;
