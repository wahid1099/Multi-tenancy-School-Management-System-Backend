import { Request, Response, NextFunction } from "express";
import gradeService from "./grade.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";
import { getUserId } from "../../utils/authHelpers";

class GradeController {
  createGrade = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const grade = await gradeService.createGrade(
        req.tenant,
        getUserId(req),
        req.body
      );

      sendSuccessResponse(res, "Grade created successfully", grade, 201);
    }
  );

  getAllGrades = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await gradeService.getAllGrades(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Grades retrieved successfully",
        result.grades,
        200,
        result.pagination
      );
    }
  );

  getGradeById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const grade = await gradeService.getGradeById(req.params.id, req.tenant);

      sendSuccessResponse(res, "Grade retrieved successfully", grade);
    }
  );

  updateGrade = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const grade = await gradeService.updateGrade(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Grade updated successfully", grade);
    }
  );

  publishGrade = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const grade = await gradeService.publishGrade(req.params.id, req.tenant);

      sendSuccessResponse(res, "Grade published successfully", grade);
    }
  );

  deleteGrade = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await gradeService.deleteGrade(req.params.id, req.tenant);

      sendSuccessResponse(res, "Grade deleted successfully");
    }
  );

  getStudentGrades = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const grades = await gradeService.getStudentGrades(
        req.tenant,
        req.query as any
      );

      sendSuccessResponse(res, "Student grades retrieved successfully", grades);
    }
  );

  getGradeReport = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const report = await gradeService.getGradeReport(
        req.tenant,
        req.query as any
      );

      sendSuccessResponse(res, "Grade report generated successfully", report);
    }
  );

  getGradeStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await gradeService.getGradeStats(req.tenant);

      sendSuccessResponse(
        res,
        "Grade statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new GradeController();
