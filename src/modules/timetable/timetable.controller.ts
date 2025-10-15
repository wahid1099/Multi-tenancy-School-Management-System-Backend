import { Request, Response, NextFunction } from "express";
import timetableService from "./timetable.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import { getUserId } from "../../utils/authHelpers";

class TimetableController {
  createTimetable = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const timetable = await timetableService.createTimetable(
        req.tenant,
        getUserId(req),
        req.body
      );

      sendSuccessResponse(
        res,
        "Timetable created successfully",
        timetable,
        201
      );
    }
  );

  getAllTimetables = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await timetableService.getAllTimetables(
        req.tenant,
        req.query
      );

      sendSuccessResponse(
        res,
        "Timetables retrieved successfully",
        result.timetables,
        200,
        result.pagination
      );
    }
  );

  getTimetableById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const timetable = await timetableService.getTimetableById(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(res, "Timetable retrieved successfully", timetable);
    }
  );

  updateTimetable = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const timetable = await timetableService.updateTimetable(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Timetable updated successfully", timetable);
    }
  );

  deleteTimetable = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await timetableService.deleteTimetable(req.params.id, req.tenant);

      sendSuccessResponse(res, "Timetable deleted successfully");
    }
  );

  getTeacherTimetable = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const timetable = await timetableService.getTeacherTimetable(
        req.tenant,
        req.query as any
      );

      sendSuccessResponse(
        res,
        "Teacher timetable retrieved successfully",
        timetable
      );
    }
  );

  getCurrentTimetable = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { classId } = req.params;
      const timetable = await timetableService.getCurrentTimetable(
        req.tenant,
        classId
      );

      sendSuccessResponse(
        res,
        "Current timetable retrieved successfully",
        timetable
      );
    }
  );

  getTimetableStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await timetableService.getTimetableStats(req.tenant);

      sendSuccessResponse(
        res,
        "Timetable statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new TimetableController();
