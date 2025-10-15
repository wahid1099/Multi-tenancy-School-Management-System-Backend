import { Router } from "express";
import feeController from "./fee.controller";
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
  createFeeSchema,
  updateFeeSchema,
  recordPaymentSchema,
  feeQuerySchema,
  feeRecordQuerySchema,
  feeReportSchema,
  feeParamsSchema,
} from "./fee.dto";

const router = Router();

// Protected routes
router.use(authenticate);
router.use(extractTenant);
router.use(validateTenant);

/**
 * @swagger
 * components:
 *   schemas:
 *     Fee:
 *       type: object
 *       required:
 *         - class
 *         - academicYear
 *         - term
 *         - feeStructure
 *         - dueDate
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
 *         feeStructure:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *               isOptional:
 *                 type: boolean
 *         totalAmount:
 *           type: number
 *         dueDate:
 *           type: string
 *           format: date
 *         lateFeePenalty:
 *           type: number
 *         lateFeeAfterDays:
 *           type: number
 *         discounts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *               applicableFor:
 *                 type: array
 *                 items:
 *                   type: string
 *         isActive:
 *           type: boolean
 *     FeeRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         student:
 *           type: string
 *         fee:
 *           type: string
 *         totalAmount:
 *           type: number
 *         discountApplied:
 *           type: number
 *         finalAmount:
 *           type: number
 *         amountPaid:
 *           type: number
 *         balanceAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, partial, paid, overdue]
 *         dueDate:
 *           type: string
 *           format: date
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               feeStructure:
 *                 type: string
 *               amountPaid:
 *                 type: number
 *               paymentDate:
 *                 type: string
 *                 format: date
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, bank_transfer, cheque, online]
 *               receiptNumber:
 *                 type: string
 */

/**
 * @swagger
 * /api/v1/fees/stats:
 *   get:
 *     summary: Get fee statistics
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fee statistics retrieved successfully
 */
router.get(
  "/stats",
  authorize("admin", "tenant_admin"),
  feeController.getFeeStats
);

/**
 * @swagger
 * /api/v1/fees/records:
 *   get:
 *     summary: Get all fee records
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *       - in: query
 *         name: fee
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, partial, paid, overdue]
 *     responses:
 *       200:
 *         description: Fee records retrieved successfully
 */
router.get(
  "/records",
  validateQuery(feeRecordQuerySchema),
  feeController.getAllFeeRecords
);

/**
 * @swagger
 * /api/v1/fees/report:
 *   get:
 *     summary: Get fee report
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *           enum: [first, second, third, annual]
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           enum: [summary, detailed, defaulters]
 *     responses:
 *       200:
 *         description: Fee report generated successfully
 */
router.get(
  "/report",
  authorize("admin", "tenant_admin"),
  validateQuery(feeReportSchema),
  feeController.getFeeReport
);

/**
 * @swagger
 * /api/v1/fees:
 *   post:
 *     summary: Create fee structure
 *     tags: [Fees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Fee'
 *     responses:
 *       201:
 *         description: Fee structure created successfully
 */
router.post(
  "/",
  authorize("admin", "tenant_admin"),
  validate(createFeeSchema),
  feeController.createFee
);

/**
 * @swagger
 * /api/v1/fees:
 *   get:
 *     summary: Get all fee structures
 *     tags: [Fees]
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
 *     responses:
 *       200:
 *         description: Fee structures retrieved successfully
 */
router.get("/", validateQuery(feeQuerySchema), feeController.getAllFees);

/**
 * @swagger
 * /api/v1/fees/{id}:
 *   get:
 *     summary: Get fee structure by ID
 *     tags: [Fees]
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
 *         description: Fee structure retrieved successfully
 */
router.get("/:id", validateParams(feeParamsSchema), feeController.getFeeById);

/**
 * @swagger
 * /api/v1/fees/{id}:
 *   patch:
 *     summary: Update fee structure
 *     tags: [Fees]
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
 *         description: Fee structure updated successfully
 */
router.patch(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(feeParamsSchema),
  validate(updateFeeSchema),
  feeController.updateFee
);

/**
 * @swagger
 * /api/v1/fees/{id}/payment:
 *   post:
 *     summary: Record fee payment
 *     tags: [Fees]
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
 *               - student
 *               - payments
 *             properties:
 *               student:
 *                 type: string
 *               payments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 */
router.post(
  "/:id/payment",
  authorize("admin", "tenant_admin"),
  validateParams(feeParamsSchema),
  validate(recordPaymentSchema),
  feeController.recordPayment
);

/**
 * @swagger
 * /api/v1/fees/{id}:
 *   delete:
 *     summary: Delete fee structure
 *     tags: [Fees]
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
 *         description: Fee structure deleted successfully
 */
router.delete(
  "/:id",
  authorize("admin", "tenant_admin"),
  validateParams(feeParamsSchema),
  feeController.deleteFee
);

export default router;
