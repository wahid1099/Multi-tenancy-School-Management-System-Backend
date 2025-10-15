import { Router } from "express";
import dashboardController from "./dashboard.controller";
import {
  authenticate,
  authorize,
  extractTenant,
  validateTenant,
} from "../../middlewares/auth.middleware";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalStudents:
 *               type: number
 *             totalTeachers:
 *               type: number
 *             totalClasses:
 *               type: number
 *             totalSubjects:
 *               type: number
 *         attendance:
 *           type: object
 *           properties:
 *             todayAttendance:
 *               type: number
 *             weeklyAttendance:
 *               type: number
 *             monthlyAttendance:
 *               type: number
 *         academics:
 *           type: object
 *           properties:
 *             upcomingExams:
 *               type: number
 *             pendingGrades:
 *               type: number
 *             activeExams:
 *               type: number
 *         fees:
 *           type: object
 *           properties:
 *             totalCollected:
 *               type: number
 *             totalPending:
 *               type: number
 *             collectionRate:
 *               type: number
 *             overdueCount:
 *               type: number
 *         tenantStats:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: number
 *             activeUsers:
 *               type: number
 *             newRegistrations:
 *               type: number
 *         systemHealth:
 *           type: object
 *           properties:
 *             uptime:
 *               type: number
 *             memoryUsage:
 *               type: number
 *             activeConnections:
 *               type: number
 *         recentActivities:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               message:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     TeacherDashboard:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             myClasses:
 *               type: number
 *             mySubjects:
 *               type: number
 *             totalStudents:
 *               type: number
 *         todaySchedule:
 *           type: array
 *           items:
 *             type: object
 *         upcomingExams:
 *           type: array
 *           items:
 *             type: object
 *         pendingGrades:
 *           type: array
 *           items:
 *             type: object
 *         recentAttendance:
 *           type: array
 *           items:
 *             type: object
 *     StudentDashboard:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             mySubjects:
 *               type: number
 *             attendanceRate:
 *               type: number
 *             averageGrade:
 *               type: string
 *         todaySchedule:
 *           type: array
 *           items:
 *             type: object
 *         upcomingExams:
 *           type: array
 *           items:
 *             type: object
 *         recentGrades:
 *           type: array
 *           items:
 *             type: object
 *         feeStatus:
 *           type: object
 *           properties:
 *             totalDue:
 *               type: number
 *             overdue:
 *               type: number
 *             nextDueDate:
 *               type: string
 *               format: date
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard data based on user role
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/AdminDashboard'
 *                 - $ref: '#/components/schemas/TeacherDashboard'
 *                 - $ref: '#/components/schemas/StudentDashboard'
 */
router.get("/", dashboardController.getDashboard);

/**
 * @swagger
 * /api/v1/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminDashboard'
 */
router.get(
  "/admin",
  authorize("admin", "tenant_admin"),
  dashboardController.getAdminDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/teacher:
 *   get:
 *     summary: Get teacher dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherDashboard'
 */
router.get(
  "/teacher",
  authorize("teacher"),
  dashboardController.getTeacherDashboard
);

/**
 * @swagger
 * /api/v1/dashboard/student:
 *   get:
 *     summary: Get student dashboard data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentDashboard'
 */
router.get(
  "/student",
  authorize("student"),
  dashboardController.getStudentDashboard
);

export default router;
