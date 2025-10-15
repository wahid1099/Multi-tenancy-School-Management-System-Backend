import { Request, Response, NextFunction } from "express";
import examService from "./exam.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class ExamController {
  createExam = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await examService.createExam(
        req.tenant,
        req.user.id,
        req.body
      );

      sendSuccessResponse(res, "Exam created successfully", exam, 201);
    }
  );

  getAllExams = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await examService.getAllExams(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Exams retrieved successfully",
        result.exams,
        200,
        result.pagination
      );
    }
  );

  getExamById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await examService.getExamById(req.params.id, req.tenant);

      sendSuccessResponse(res, "Exam retrieved successfully", exam);
    }
  );

  updateExam = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await examService.updateExam(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Exam updated successfully", exam);
    }
  );

  publishExam = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const exam = await examService.publishExam(req.params.id, req.tenant);

      sendSuccessResponse(res, "Exam published successfully", exam);
    }
  );

  deleteExam = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await examService.deleteExam(req.params.id, req.tenant);

      sendSuccessResponse(res, "Exam deleted successfully");
    }
  );

  getUpcomingExams = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { class: classId, limit } = req.query;
      const exams = await examService.getUpcomingExams(
        req.tenant,
        classId as string,
        parseInt(limit as string) || 10
      );

      sendSuccessResponse(res, "Upcoming exams retrieved successfully", exams);
    }
  );

  getExamStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await examService.getExamStats(req.tenant);

      sendSuccessResponse(res, "Exam statistics retrieved successfully", stats);
    }
  );

  getExamsByType = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await examService.getExamsByType(req.tenant);

      sendSuccessResponse(
        res,
        "Exam type statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new ExamController();
