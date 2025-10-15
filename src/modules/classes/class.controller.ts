import { Request, Response, NextFunction } from "express";
import classService from "./class.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class ClassController {
  createClass = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const classDoc = await classService.createClass(req.tenant, req.body);

      sendSuccessResponse(res, "Class created successfully", classDoc, 201);
    }
  );

  getAllClasses = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await classService.getAllClasses(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Classes retrieved successfully",
        result.classes,
        200,
        result.pagination
      );
    }
  );

  getClassById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const classDoc = await classService.getClassById(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(res, "Class retrieved successfully", classDoc);
    }
  );

  updateClass = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const classDoc = await classService.updateClass(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Class updated successfully", classDoc);
    }
  );

  deleteClass = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await classService.deleteClass(req.params.id, req.tenant);

      sendSuccessResponse(res, "Class deleted successfully");
    }
  );

  addStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { studentId } = req.body;
      const classDoc = await classService.addStudent(
        req.params.id,
        studentId,
        req.tenant
      );

      sendSuccessResponse(res, "Student added to class successfully", classDoc);
    }
  );

  removeStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { studentId } = req.body;
      const classDoc = await classService.removeStudent(
        req.params.id,
        studentId,
        req.tenant
      );

      sendSuccessResponse(
        res,
        "Student removed from class successfully",
        classDoc
      );
    }
  );

  getClassStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await classService.getClassStats(req.tenant);

      sendSuccessResponse(
        res,
        "Class statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new ClassController();
