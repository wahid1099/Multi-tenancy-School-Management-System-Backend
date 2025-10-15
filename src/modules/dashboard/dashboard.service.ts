import { User } from "../users/user.model";
import { Student } from "../students/student.model";
import { Class } from "../classes/class.model";
import { Subject } from "../subjects/subject.model";
import { Attendance } from "../attendance/attendance.model";
import { Exam } from "../exams/exam.model";
import { Grade } from "../grades/grade.model";
import { FeeRecord } from "../fees/fee.model";
import { Timetable } from "../timetable/timetable.model";

export interface DashboardStats {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
  };
  attendance: {
    todayAttendance: number;
    weeklyAttendance: number;
    monthlyAttendance: number;
  };
  academics: {
    upcomingExams: number;
    pendingGrades: number;
    activeExams: number;
  };
  fees: {
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    overdueCount: number;
  };
  recentActivities: any[];
}

export interface AdminDashboard extends DashboardStats {
  tenantStats: {
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    activeConnections: number;
  };
}

export interface TeacherDashboard {
  overview: {
    myClasses: number;
    mySubjects: number;
    totalStudents: number;
  };
  todaySchedule: any[];
  upcomingExams: any[];
  pendingGrades: any[];
  recentAttendance: any[];
}

export interface StudentDashboard {
  overview: {
    mySubjects: number;
    attendanceRate: number;
    averageGrade: string;
  };
  todaySchedule: any[];
  upcomingExams: any[];
  recentGrades: any[];
  feeStatus: {
    totalDue: number;
    overdue: number;
    nextDueDate: Date | null;
  };
}

class DashboardService {
  async getAdminDashboard(tenant: string): Promise<AdminDashboard> {
    const [
      overview,
      attendance,
      academics,
      fees,
      tenantStats,
      recentActivities,
    ] = await Promise.all([
      this.getOverviewStats(tenant),
      this.getAttendanceStats(tenant),
      this.getAcademicStats(tenant),
      this.getFeeStats(tenant),
      this.getTenantStats(tenant),
      this.getRecentActivities(tenant),
    ]);

    return {
      overview,
      attendance,
      academics,
      fees,
      tenantStats,
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        activeConnections: 0, // This would come from your connection pool
      },
      recentActivities,
    };
  }

  async getTeacherDashboard(
    tenant: string,
    teacherId: string
  ): Promise<TeacherDashboard> {
    const [
      overview,
      todaySchedule,
      upcomingExams,
      pendingGrades,
      recentAttendance,
    ] = await Promise.all([
      this.getTeacherOverview(tenant, teacherId),
      this.getTeacherTodaySchedule(tenant, teacherId),
      this.getTeacherUpcomingExams(tenant, teacherId),
      this.getTeacherPendingGrades(tenant, teacherId),
      this.getTeacherRecentAttendance(tenant, teacherId),
    ]);

    return {
      overview,
      todaySchedule,
      upcomingExams,
      pendingGrades,
      recentAttendance,
    };
  }

  async getStudentDashboard(
    tenant: string,
    studentId: string
  ): Promise<StudentDashboard> {
    const [overview, todaySchedule, upcomingExams, recentGrades, feeStatus] =
      await Promise.all([
        this.getStudentOverview(tenant, studentId),
        this.getStudentTodaySchedule(tenant, studentId),
        this.getStudentUpcomingExams(tenant, studentId),
        this.getStudentRecentGrades(tenant, studentId),
        this.getStudentFeeStatus(tenant, studentId),
      ]);

    return {
      overview,
      todaySchedule,
      upcomingExams,
      recentGrades,
      feeStatus,
    };
  }

  private async getOverviewStats(tenant: string) {
    const [totalStudents, totalTeachers, totalClasses, totalSubjects] =
      await Promise.all([
        Student.countDocuments({ tenant, status: "active" }),
        User.countDocuments({ tenant, role: "teacher", isActive: true }),
        Class.countDocuments({ tenant, isActive: true }),
        Subject.countDocuments({ tenant, isActive: true }),
      ]);

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
    };
  }

  private async getAttendanceStats(tenant: string) {
    const today = new Date();
    const startOfWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay()
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayStats, weeklyStats, monthlyStats] = await Promise.all([
      Attendance.aggregate([
        {
          $match: {
            tenant,
            date: {
              $gte: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
              ),
              $lt: new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate() + 1
              ),
            },
          },
        },
        {
          $group: {
            _id: null,
            averageAttendance: { $avg: "$attendancePercentage" },
          },
        },
      ]),
      Attendance.aggregate([
        {
          $match: {
            tenant,
            date: { $gte: startOfWeek, $lte: today },
          },
        },
        {
          $group: {
            _id: null,
            averageAttendance: { $avg: "$attendancePercentage" },
          },
        },
      ]),
      Attendance.aggregate([
        {
          $match: {
            tenant,
            date: { $gte: startOfMonth, $lte: today },
          },
        },
        {
          $group: {
            _id: null,
            averageAttendance: { $avg: "$attendancePercentage" },
          },
        },
      ]),
    ]);

    return {
      todayAttendance: todayStats[0]?.averageAttendance || 0,
      weeklyAttendance: weeklyStats[0]?.averageAttendance || 0,
      monthlyAttendance: monthlyStats[0]?.averageAttendance || 0,
    };
  }

  private async getAcademicStats(tenant: string) {
    const [upcomingExams, pendingGrades, activeExams] = await Promise.all([
      Exam.countDocuments({
        tenant,
        isPublished: true,
        startDate: { $gte: new Date() },
        isActive: true,
      }),
      Grade.countDocuments({
        tenant,
        isPublished: false,
      }),
      Exam.countDocuments({
        tenant,
        isPublished: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        isActive: true,
      }),
    ]);

    return {
      upcomingExams,
      pendingGrades,
      activeExams,
    };
  }

  private async getFeeStats(tenant: string) {
    const stats = await FeeRecord.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amountPaid" },
          totalPending: { $sum: "$balanceAmount" },
          overdueCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "overdue"] },
                    { $lt: ["$dueDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalAmount: { $sum: "$finalAmount" },
        },
      },
    ]);

    const result = stats[0] || {
      totalCollected: 0,
      totalPending: 0,
      overdueCount: 0,
      totalAmount: 0,
    };

    return {
      ...result,
      collectionRate:
        result.totalAmount > 0
          ? (result.totalCollected / result.totalAmount) * 100
          : 0,
    };
  }

  private async getTenantStats(tenant: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalUsers, activeUsers, newRegistrations] = await Promise.all([
      User.countDocuments({ tenant }),
      User.countDocuments({ tenant, isActive: true }),
      User.countDocuments({
        tenant,
        createdAt: { $gte: startOfMonth },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      newRegistrations,
    };
  }

  private async getRecentActivities(tenant: string, limit: number = 10) {
    // This would typically aggregate recent activities from various modules
    // For now, we'll return recent user registrations and exam creations
    const [recentUsers, recentExams] = await Promise.all([
      User.find({ tenant })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("firstName lastName role createdAt")
        .lean(),
      Exam.find({ tenant })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("subject", "name")
        .populate("class", "name section")
        .select("title subject class createdAt")
        .lean(),
    ]);

    const activities = [
      ...recentUsers.map((user) => ({
        type: "user_registration",
        message: `${user.firstName} ${user.lastName} registered as ${user.role}`,
        timestamp: user.createdAt,
      })),
      ...recentExams.map((exam) => ({
        type: "exam_created",
        message: `Exam "${exam.title}" created for ${exam.class.name} - ${exam.subject.name}`,
        timestamp: exam.createdAt,
      })),
    ];

    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }

  private async getTeacherOverview(tenant: string, teacherId: string) {
    const [myClasses, mySubjects, totalStudents] = await Promise.all([
      Class.countDocuments({ tenant, classTeacher: teacherId, isActive: true }),
      Timetable.aggregate([
        {
          $match: {
            tenant,
            "timeSlots.teacher": teacherId,
            isActive: true,
          },
        },
        {
          $unwind: "$timeSlots",
        },
        {
          $match: {
            "timeSlots.teacher": teacherId,
          },
        },
        {
          $group: {
            _id: "$timeSlots.subject",
          },
        },
        {
          $count: "uniqueSubjects",
        },
      ]),
      Student.countDocuments({
        tenant,
        status: "active",
        class: {
          $in: await Class.find({ tenant, classTeacher: teacherId }).distinct(
            "_id"
          ),
        },
      }),
    ]);

    return {
      myClasses,
      mySubjects: mySubjects[0]?.uniqueSubjects || 0,
      totalStudents,
    };
  }

  private async getTeacherTodaySchedule(tenant: string, teacherId: string) {
    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "lowercase" });

    const schedule = await Timetable.find({
      tenant,
      "timeSlots.teacher": teacherId,
      effectiveFrom: { $lte: today },
      effectiveTo: { $gte: today },
      isActive: true,
    })
      .populate("class", "name section grade")
      .populate("timeSlots.subject", "name code")
      .lean();

    const todaySlots = schedule.flatMap((timetable) =>
      timetable.timeSlots
        .filter(
          (slot) =>
            slot.day === dayName && slot.teacher.toString() === teacherId
        )
        .map((slot) => ({
          ...slot,
          class: timetable.class,
        }))
    );

    return todaySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private async getTeacherUpcomingExams(tenant: string, teacherId: string) {
    return Exam.find({
      tenant,
      createdBy: teacherId,
      startDate: { $gte: new Date() },
      isPublished: true,
      isActive: true,
    })
      .populate("subject", "name code")
      .populate("class", "name section grade")
      .sort({ startDate: 1 })
      .limit(5)
      .lean();
  }

  private async getTeacherPendingGrades(tenant: string, teacherId: string) {
    return Grade.find({
      tenant,
      teacher: teacherId,
      isPublished: false,
    })
      .populate("exam", "title")
      .populate("subject", "name code")
      .populate("class", "name section grade")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
  }

  private async getTeacherRecentAttendance(tenant: string, teacherId: string) {
    return Attendance.find({
      tenant,
      teacher: teacherId,
    })
      .populate("class", "name section grade")
      .populate("subject", "name code")
      .sort({ date: -1 })
      .limit(5)
      .lean();
  }

  private async getStudentOverview(tenant: string, studentId: string) {
    const student = await Student.findOne({ _id: studentId, tenant })
      .populate("class")
      .lean();

    if (!student) {
      return { mySubjects: 0, attendanceRate: 0, averageGrade: "N/A" };
    }

    const [subjectCount, attendanceRate, averageGrade] = await Promise.all([
      Subject.countDocuments({
        _id: { $in: student.class.subjects },
        isActive: true,
      }),
      this.getStudentAttendanceRate(tenant, studentId),
      this.getStudentAverageGrade(tenant, studentId),
    ]);

    return {
      mySubjects: subjectCount,
      attendanceRate,
      averageGrade,
    };
  }

  private async getStudentAttendanceRate(tenant: string, studentId: string) {
    const attendanceRecords = await Attendance.find({
      tenant,
      "records.student": studentId,
    }).lean();

    if (attendanceRecords.length === 0) return 0;

    let totalRecords = 0;
    let presentRecords = 0;

    attendanceRecords.forEach((record) => {
      const studentRecord = record.records.find(
        (r) => r.student.toString() === studentId
      );
      if (studentRecord) {
        totalRecords++;
        if (
          studentRecord.status === "present" ||
          studentRecord.status === "late"
        ) {
          presentRecords++;
        }
      }
    });

    return totalRecords > 0
      ? Math.round((presentRecords / totalRecords) * 100)
      : 0;
  }

  private async getStudentAverageGrade(tenant: string, studentId: string) {
    const grades = await Grade.find({
      tenant,
      "grades.student": studentId,
      isPublished: true,
    }).lean();

    if (grades.length === 0) return "N/A";

    let totalGrades = 0;
    let gradePoints = 0;

    grades.forEach((gradeRecord) => {
      const studentGrade = gradeRecord.grades.find(
        (g) => g.student.toString() === studentId
      );
      if (studentGrade && !studentGrade.isAbsent) {
        totalGrades++;
        // Convert grade to points (A=4, B=3, C=2, D=1, F=0)
        const points =
          { A: 4, B: 3, C: 2, D: 1, F: 0 }[studentGrade.grade] || 0;
        gradePoints += points;
      }
    });

    if (totalGrades === 0) return "N/A";

    const avgPoints = gradePoints / totalGrades;
    const gradeMap = { 4: "A", 3: "B", 2: "C", 1: "D", 0: "F" };
    return gradeMap[Math.round(avgPoints)] || "F";
  }

  private async getStudentTodaySchedule(tenant: string, studentId: string) {
    const student = await Student.findOne({ _id: studentId, tenant }).lean();
    if (!student) return [];

    const today = new Date();
    const dayName = today.toLocaleDateString("en-US", { weekday: "lowercase" });

    const schedule = await Timetable.findOne({
      tenant,
      class: student.class,
      effectiveFrom: { $lte: today },
      effectiveTo: { $gte: today },
      isActive: true,
    })
      .populate("timeSlots.subject", "name code")
      .populate("timeSlots.teacher", "firstName lastName")
      .lean();

    if (!schedule) return [];

    return schedule.timeSlots
      .filter((slot) => slot.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private async getStudentUpcomingExams(tenant: string, studentId: string) {
    const student = await Student.findOne({ _id: studentId, tenant }).lean();
    if (!student) return [];

    return Exam.find({
      tenant,
      class: student.class,
      startDate: { $gte: new Date() },
      isPublished: true,
      isActive: true,
    })
      .populate("subject", "name code")
      .sort({ startDate: 1 })
      .limit(5)
      .lean();
  }

  private async getStudentRecentGrades(tenant: string, studentId: string) {
    const grades = await Grade.find({
      tenant,
      "grades.student": studentId,
      isPublished: true,
    })
      .populate("exam", "title")
      .populate("subject", "name code")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return grades.map((gradeRecord) => {
      const studentGrade = gradeRecord.grades.find(
        (g) => g.student.toString() === studentId
      );
      return {
        exam: gradeRecord.exam,
        subject: gradeRecord.subject,
        grade: studentGrade?.grade,
        percentage: studentGrade?.percentage,
        marksObtained: studentGrade?.marksObtained,
        isAbsent: studentGrade?.isAbsent,
        createdAt: gradeRecord.createdAt,
      };
    });
  }

  private async getStudentFeeStatus(tenant: string, studentId: string) {
    const feeRecords = await FeeRecord.find({
      tenant,
      student: studentId,
      isActive: true,
    })
      .sort({ dueDate: 1 })
      .lean();

    const totalDue = feeRecords.reduce(
      (sum, record) => sum + record.balanceAmount,
      0
    );
    const overdue = feeRecords
      .filter(
        (record) => record.dueDate < new Date() && record.balanceAmount > 0
      )
      .reduce((sum, record) => sum + record.balanceAmount, 0);

    const nextDueRecord = feeRecords.find(
      (record) => record.balanceAmount > 0 && record.dueDate >= new Date()
    );

    return {
      totalDue,
      overdue,
      nextDueDate: nextDueRecord?.dueDate || null,
    };
  }
}

export default new DashboardService();
