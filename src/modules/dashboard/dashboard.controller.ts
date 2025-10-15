import { Request, Response, NextFunction } from "express";
import dashboardService from "./dashboard.service";
import catchAsync from "../../utils/catchAsync";
import { sendSuccessResponse } from "../../utils/response";

class DashboardController {
  getAdminDashboard = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const dashboard = await dashboardService.getAdminDashboard(req.tenant);

      sendSuccessResponse(
        res,
        "Admin dashboard data retrieved successfully",
        dashboard
      );
    }
  );

  getTeacherDashboard = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const dashboard = await dashboardService.getTeacherDashboard(
        req.tenant,
        req.user.id
      );

      sendSuccessResponse(
        res,
        "Teacher dashboard data retrieved successfully",
        dashboard
      );
    }
  );

  getStudentDashboard = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // For student dashboard, we need to find the student record first
      const { Student } = require("../students/student.model");
      const student = await Student.findOne({
        tenant: req.tenant,
        user: req.user.id,
      });

      if (!student) {
        return sendSuccessResponse(res, "Student record not found", null, 404);
      }

      const dashboard = await dashboardService.getStudentDashboard(
        req.tenant,
        student._id.toString()
      );

      sendSuccessResponse(
        res,
        "Student dashboard data retrieved successfully",
        dashboard
      );
    }
  );

  getDashboard = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const userRole = req.user.role;

      let dashboard;

      switch (userRole) {
        case "admin":
        case "tenant_admin":
          dashboard = await dashboardService.getAdminDashboard(req.tenant);
          break;
        case "teacher":
          dashboard = await dashboardService.getTeacherDashboard(
            req.tenant,
            req.user.id
          );
          break;
        case "student":
          const { Student } = require("../students/student.model");
          const student = await Student.findOne({
            tenant: req.tenant,
            user: req.user.id,
          });

          if (student) {
            dashboard = await dashboardService.getStudentDashboard(
              req.tenant,
              student._id.toString()
            );
          } else {
            dashboard = null;
          }
          break;
        default:
          dashboard = null;
      }

      sendSuccessResponse(
        res,
        "Dashboard data retrieved successfully",
        dashboard
      );
    }
  );
}

export default new DashboardController();
