import { Attendance, IAttendance, IAttendanceRecord } from "./attendance.model";
import { Class } from "../classes/class.model";
import { Student } from "../students/student.model";
import { User } from "../users/user.model";
import { Subject } from "../subjects/subject.model";
import AppError from "../../utils/AppError";

export interface CreateAttendanceData {
  class: string;
  subject?: string;
  date: Date;
  period?: number;
  records: IAttendanceRecord[];
}

export interface UpdateAttendanceData {
  subject?: string;
  date?: Date;
  period?: number;
  records?: IAttendanceRecord[];
}

export interface AttendanceQuery {
  page?: number;
  limit?: number;
  class?: string;
  subject?: string;
  teacher?: string;
  dateFrom?: Date;
  dateTo?: Date;
  isSubmitted?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AttendanceReportQuery {
  class?: string;
  student?: string;
  subject?: string;
  dateFrom: Date;
  dateTo: Date;
  reportType?: "summary" | "detailed" | "student";
}

class AttendanceService {
  async createAttendance(
    tenant: string,
    teacherId: string,
    attendanceData: CreateAttendanceData
  ): Promise<IAttendance> {
    // Validate class exists
    const classDoc = await Class.findOne({
      _id: attendanceData.class,
      tenant,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found or not active", 400);
    }

    // Validate subject if provided
    if (attendanceData.subject) {
      const subject = await Subject.findOne({
        _id: attendanceData.subject,
        tenant,
        isActive: true,
      });

      if (!subject) {
        throw new AppError("Subject not found or not active", 400);
      }
    }

    // Check if attendance already exists for the same class, date, and period
    const existingAttendance = await Attendance.findOne({
      tenant,
      class: attendanceData.class,
      date: attendanceData.date,
      period: attendanceData.period || null,
    });

    if (existingAttendance) {
      throw new AppError(
        "Attendance already exists for this class, date, and period",
        400
      );
    }

    // Validate all students belong to the class
    const studentIds = attendanceData.records.map((r) => r.student);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      tenant,
      class: attendanceData.class,
      status: "active",
    });

    if (validStudents.length !== studentIds.length) {
      throw new AppError(
        "One or more students do not belong to this class or are not active",
        400
      );
    }

    const attendance = new Attendance({
      ...attendanceData,
      tenant,
      teacher: teacherId,
    });

    await attendance.save();

    return attendance.populate([
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "records.student",
        select: "studentId",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);
  }

  async getAllAttendance(tenant: string, query: AttendanceQuery) {
    const {
      page = 1,
      limit = 10,
      class: classId,
      subject,
      teacher,
      dateFrom,
      dateTo,
      isSubmitted,
      sortBy = "date",
      sortOrder = "desc",
    } = query;

    const filter: any = { tenant };

    if (classId) {
      filter.class = classId;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (teacher) {
      filter.teacher = teacher;
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    if (typeof isSubmitted === "boolean") {
      filter.isSubmitted = isSubmitted;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .populate([
          { path: "class", select: "name section grade" },
          { path: "subject", select: "name code" },
          { path: "teacher", select: "firstName lastName" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    return {
      attendanceRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttendanceById(id: string, tenant: string): Promise<IAttendance> {
    const attendance = await Attendance.findOne({ _id: id, tenant }).populate([
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "records.student",
        select: "studentId rollNumber",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);

    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    return attendance;
  }

  async updateAttendance(
    id: string,
    tenant: string,
    updateData: UpdateAttendanceData
  ): Promise<IAttendance> {
    const attendance = await Attendance.findOne({ _id: id, tenant });
    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    if (attendance.isSubmitted) {
      throw new AppError("Cannot update submitted attendance", 400);
    }

    // Validate subject if being updated
    if (updateData.subject) {
      const subject = await Subject.findOne({
        _id: updateData.subject,
        tenant,
        isActive: true,
      });

      if (!subject) {
        throw new AppError("Subject not found or not active", 400);
      }
    }

    // Validate students if records are being updated
    if (updateData.records) {
      const studentIds = updateData.records.map((r) => r.student);
      const validStudents = await Student.find({
        _id: { $in: studentIds },
        tenant,
        class: attendance.class,
        status: "active",
      });

      if (validStudents.length !== studentIds.length) {
        throw new AppError(
          "One or more students do not belong to this class or are not active",
          400
        );
      }
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "records.student",
        select: "studentId rollNumber",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);

    return updatedAttendance!;
  }

  async submitAttendance(id: string, tenant: string): Promise<IAttendance> {
    const attendance = await Attendance.findOne({ _id: id, tenant });
    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    if (attendance.isSubmitted) {
      throw new AppError("Attendance is already submitted", 400);
    }

    attendance.isSubmitted = true;
    attendance.submittedAt = new Date();
    await attendance.save();

    return attendance.populate([
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
    ]);
  }

  async deleteAttendance(id: string, tenant: string): Promise<void> {
    const attendance = await Attendance.findOne({ _id: id, tenant });
    if (!attendance) {
      throw new AppError("Attendance record not found", 404);
    }

    if (attendance.isSubmitted) {
      throw new AppError("Cannot delete submitted attendance", 400);
    }

    await Attendance.findByIdAndDelete(id);
  }

  async getAttendanceReport(tenant: string, query: AttendanceReportQuery) {
    const {
      class: classId,
      student,
      subject,
      dateFrom,
      dateTo,
      reportType = "summary",
    } = query;

    const filter: any = {
      tenant,
      date: { $gte: dateFrom, $lte: dateTo },
      isSubmitted: true,
    };

    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;

    if (reportType === "student" && student) {
      // Student-specific report
      const attendanceRecords = await Attendance.find(filter)
        .populate([
          { path: "class", select: "name section grade" },
          { path: "subject", select: "name code" },
        ])
        .lean();

      const studentAttendance = attendanceRecords.map((record) => {
        const studentRecord = record.records.find(
          (r) => r.student.toString() === student
        );
        return {
          date: record.date,
          class: record.class,
          subject: record.subject,
          period: record.period,
          status: studentRecord?.status || "absent",
          remarks: studentRecord?.remarks,
        };
      });

      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        student,
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage,
        records: studentAttendance,
      };
    }

    // Class/Subject summary report
    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalStudents: { $sum: "$totalStudents" },
          totalPresent: { $sum: "$presentCount" },
          totalAbsent: { $sum: "$absentCount" },
          totalLate: { $sum: "$lateCount" },
          totalExcused: { $sum: "$excusedCount" },
          averageAttendance: { $avg: "$attendancePercentage" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalRecords: 0,
        totalStudents: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalExcused: 0,
        averageAttendance: 0,
      }
    );
  }

  async getAttendanceStats(tenant: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await Attendance.aggregate([
      { $match: { tenant, date: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          submittedRecords: {
            $sum: { $cond: [{ $eq: ["$isSubmitted", true] }, 1, 0] },
          },
          averageAttendance: { $avg: "$attendancePercentage" },
          totalStudentsMarked: { $sum: "$totalStudents" },
          totalPresent: { $sum: "$presentCount" },
          totalAbsent: { $sum: "$absentCount" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalRecords: 0,
        submittedRecords: 0,
        averageAttendance: 0,
        totalStudentsMarked: 0,
        totalPresent: 0,
        totalAbsent: 0,
      }
    );
  }
}

export default new AttendanceService();
