import { Request, Response, NextFunction } from "express";
import attendanceService from "./attendance.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class AttendanceController {
  createAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const attendance = await attendanceService.createAttendance(
        req.tenant,
        req.user.id,
        req.body
      );

      sendSuccessResponse(
        res,
        "Attendance created successfully",
        attendance,
        201
      );
    }
  );

  getAllAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await attendanceService.getAllAttendance(
        req.tenant,
        req.query
      );

      sendSuccessResponse(
        res,
        "Attendance records retrieved successfully",
        result.attendanceRecords,
        200,
        result.pagination
      );
    }
  );

  getAttendanceById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const attendance = await attendanceService.getAttendanceById(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(
        res,
        "Attendance record retrieved successfully",
        attendance
      );
    }
  );

  updateAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const attendance = await attendanceService.updateAttendance(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Attendance updated successfully", attendance);
    }
  );

  submitAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const attendance = await attendanceService.submitAttendance(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(res, "Attendance submitted successfully", attendance);
    }
  );

  deleteAttendance = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await attendanceService.deleteAttendance(req.params.id, req.tenant);

      sendSuccessResponse(res, "Attendance deleted successfully");
    }
  );

  getAttendanceReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const report = await attendanceService.getAttendanceReport(
        req.tenant,
        req.query
      );

      sendSuccessResponse(
        res,
        "Attendance report generated successfully",
        report
      );
    }
  );

  getAttendanceStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await attendanceService.getAttendanceStats(req.tenant);

      sendSuccessResponse(
        res,
        "Attendance statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new AttendanceController();
