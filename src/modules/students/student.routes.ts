import { Router } from "express";
import studentController from "./student.controller";
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
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
  studentParamsSchema,
} from "./student.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - user
 *         - studentId
 *         - admissionNumber
 *         - admissionDate
 *         - class
 *         - academicYear
 *         - guardianInfo
 *       properties:
 *         id:
 *           type: string
 *         user:
 *           type: string
 *         studentId:
 *           type: string
 *         admissionNumber:
 *           type: string
 *         admissionDate:
 *           type: string
 *           format: date
 *         class:
 *           type: string
 *         rollNumber:
 *           type: string
 *         academicYear:
 *           type: string
 *           pattern: '^\d{4}-\d{4}$'
 *         guardianInfo:
 *           type: object
 *           properties:
 *             fatherName:
 *               type: string
 *             motherName:
 *               type: string
 *             guardianName:
 *               type: string
 *             guardianPhone:
 *               type: string
 *             guardianEmail:
 *               type: string
 *               format: email
 *         medicalInfo:
 *           type: object
 *           properties:
 *             bloodGroup:
 *               type: string
 *               enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *             allergies:
 *               type: array
 *               items:
 *                 type: string
 *             emergencyContact:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 relation:
 *                   type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, transferred, graduated, dropped]
 */

/**
 * @swagger
 * /api/v1/students/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin", "teacher"),
  studentController.getStudentStats
);

/**
 * @swagger
 * /api/v1/students/class/{classId}:
 *   get:
 *     summary: Get students by class
 *     tags: [Students]
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
 *         description: Students retrieved successfully
 */
router.get("/class/:classId", studentController.getStudentsByClass);

/**
 * @swagger
 * /api/v1/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createStudentSchema),
  studentController.createStudent
);

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, transferred, graduated, dropped]
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.get(
  "/",
  validateQuery(studentQuerySchema),
  studentController.getAllStudents
);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
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
 *         description: Student retrieved successfully
 */
router.get(
  "/:id",
  validateParams(studentParamsSchema),
  studentController.getStudentById
);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   patch:
 *     summary: Update student
 *     tags: [Students]
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
 *         description: Student updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(studentParamsSchema),
  validate(updateStudentSchema),
  studentController.updateStudent
);

/**
 * @swagger
 * /api/v1/students/{id}/status:
 *   patch:
 *     summary: Update student status
 *     tags: [Students]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, transferred, graduated, dropped]
 *     responses:
 *       200:
 *         description: Student status updated successfully
 */
router.patch(
  "/:id/status",
  authorize("admin", "tenant_admin"),
  validateParams(studentParamsSchema),
  studentController.updateStudentStatus
);

/**
 * @swagger
 * /api/v1/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Students]
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
 *         description: Student deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(studentParamsSchema),
  studentController.deleteStudent
);

export default router;
