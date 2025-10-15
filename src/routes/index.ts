import { Router } from "express";
import tenantRoutes from "../modules/tenants/tenant.routes";
import userRoutes from "../modules/users/user.routes";
import roleRoutes from "../modules/roles/role.routes";
import subjectRoutes from "../modules/subjects/subject.routes";
import classRoutes from "../modules/classes/class.routes";
import studentRoutes from "../modules/students/student.routes";
import attendanceRoutes from "../modules/attendance/attendance.routes";
import examRoutes from "../modules/exams/exam.routes";
import gradeRoutes from "../modules/grades/grade.routes";
import timetableRoutes from "../modules/timetable/timetable.routes";
import feeRoutes from "../modules/fees/fee.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";

const router = Router();

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
router.use("/tenants", tenantRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/subjects", subjectRoutes);
router.use("/classes", classRoutes);
router.use("/students", studentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/exams", examRoutes);
router.use("/grades", gradeRoutes);
router.use("/timetables", timetableRoutes);
router.use("/fees", feeRoutes);
router.use("/dashboard", dashboardRoutes);

// 404 handler for API routes
router.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router;
