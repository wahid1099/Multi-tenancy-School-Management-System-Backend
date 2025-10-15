import { Request, Response, NextFunction } from "express";
import studentService from "./student.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class StudentController {
  createStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const student = await studentService.createStudent(req.tenant, req.body);

      sendSuccessResponse(res, "Student created successfully", student, 201);
    }
  );

  getAllStudents = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await studentService.getAllStudents(req.tenant, req.query);

      sendSuccessResponse(
        res,
        "Students retrieved successfully",
        result.students,
        200,
        result.pagination
      );
    }
  );

  getStudentById = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const student = await studentService.getStudentById(
        req.params.id,
        req.tenant
      );

      sendSuccessResponse(res, "Student retrieved successfully", student);
    }
  );

  updateStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const student = await studentService.updateStudent(
        req.params.id,
        req.tenant,
        req.body
      );

      sendSuccessResponse(res, "Student updated successfully", student);
    }
  );

  deleteStudent = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await studentService.deleteStudent(req.params.id, req.tenant);

      sendSuccessResponse(res, "Student deleted successfully");
    }
  );

  updateStudentStatus = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status } = req.body;
      const student = await studentService.updateStudentStatus(
        req.params.id,
        req.tenant,
        status
      );

      sendSuccessResponse(res, "Student status updated successfully", student);
    }
  );

  getStudentsByClass = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const students = await studentService.getStudentsByClass(
        req.params.classId,
        req.tenant
      );

      sendSuccessResponse(res, "Students retrieved successfully", students);
    }
  );

  getStudentStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await studentService.getStudentStats(req.tenant);

      sendSuccessResponse(
        res,
        "Student statistics retrieved successfully",
        stats
      );
    }
  );
}

export default new StudentController();
