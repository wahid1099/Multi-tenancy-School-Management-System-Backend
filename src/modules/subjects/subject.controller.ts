import { Request, Response, NextFunction } from "express";
import subjectService from "./subject.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class SubjectController {
  createSubject = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const subject = await subjectService.createSubject(req.tenant, req.body);

      sendSuccessResponse(res, "Subject created successfully", subject, 201);
    }
  );

  getAllSubjects = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await subjectService.getAllSubjects(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Subjects retrieved successfully",
        result.subjects,
        200,
        result.pagination
      );
    }
  );

  getSubjectById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const subject = await subjectService.getSubjectById(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(res, "Subject retrieved successfully", subject);
    }
  );

  updateSubject = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const subject = await subjectService.updateSubject(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Subject updated successfully", subject);
    }
  );

  deleteSubject = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await subjectService.deleteSubject(req.params.id, req.tenant);

      sendSuccessResponse(res, "Subject deleted successfully");
    }
  );

  toggleSubjectStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const subject = await subjectService.toggleSubjectStatus(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(
        res,
        `Subject ${
          subject.isActive ? "activated" : "deactivated"
        } successfully`,
        subject
      );
    }
  );

  getSubjectsByCategory = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const subjects = await subjectService.getSubjectsByCategory(
        req.tenant,
        req.params.category
      );

      sendSuccessResponse(res, "Subjects retrieved successfully", subjects);
    }
  );

  getSubjectStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await subjectService.getSubjectStats(req.tenant);

      sendSuccessResponse(
        res,
        "Subject statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new SubjectController();
