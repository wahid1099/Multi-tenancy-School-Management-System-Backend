import { Request, Response, NextFunction } from "express";
import feeService from "./fee.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class FeeController {
  createFee = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const fee = await feeService.createFee(req.tenant, req.user.id, req.body);

      sendSuccessResponse(res, "Fee structure created successfully", fee, 201);
    }
  );

  getAllFees = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await feeService.getAllFees(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Fee structures retrieved successfully",
        result.fees,
        200,
        result.pagination
      );
    }
  );

  getFeeById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const fee = await feeService.getFeeById(req.params.id, req.tenant);

      sendSuccessResponse(res, "Fee structure retrieved successfully", fee);
    }
  );

  updateFee = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const fee = await feeService.updateFee(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Fee structure updated successfully", fee);
    }
  );

  deleteFee = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await feeService.deleteFee(req.params.id, req.tenant);

      sendSuccessResponse(res, "Fee structure deleted successfully");
    }
  );

  recordPayment = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const feeRecord = await feeService.recordPayment(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Payment recorded successfully", feeRecord);
    }
  );

  getAllFeeRecords = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await feeService.getAllFeeRecords(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Fee records retrieved successfully",
        result.feeRecords,
        200,
        result.pagination
      );
    }
  );

  getFeeReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const report = await feeService.getFeeReport(req.tenant, req.query);

      sendSuccessResponse(res, "Fee report generated successfully", report);
    }
  );

  getFeeStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await feeService.getFeeStats(req.tenant);

      sendSuccessResponse(res, "Fee statistics retrieved successfully", stats);
    }
  );
}

export default new FeeController();
