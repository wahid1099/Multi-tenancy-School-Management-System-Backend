import mongoose from "mongoose";
import { Grade, IGrade, IGradeItem } from "./grade.model";
import { Exam } from "../exams/exam.model";
import { Student } from "../students/student.model";
import AppError from "../../utils/AppError";

export interface CreateGradeData {
  exam: string;
  academicYear: string;
  gradingScale?: {
    A: { min: number; max: number };
    B: { min: number; max: number };
    C: { min: number; max: number };
    D: { min: number; max: number };
    F: { min: number; max: number };
  };
  grades: {
    student: string;
    marksObtained: number;
    remarks?: string;
    isAbsent?: boolean;
  }[];
}

export interface UpdateGradeData {
  gradingScale?: {
    A: { min: number; max: number };
    B: { min: number; max: number };
    C: { min: number; max: number };
    D: { min: number; max: number };
    F: { min: number; max: number };
  };
  grades?: {
    student: string;
    marksObtained: number;
    remarks?: string;
    isAbsent?: boolean;
  }[];
}

export interface GradeQuery {
  page?: number;
  limit?: number;
  class?: string;
  subject?: string;
  teacher?: string;
  academicYear?: string;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StudentGradeQuery {
  student: string;
  academicYear?: string;
  subject?: string;
}

export interface GradeReportQuery {
  class?: string;
  subject?: string;
  academicYear: string;
  reportType?: "summary" | "detailed" | "transcript";
}

class GradeService {
  async createGrade(
    tenant: string,
    teacherId: string,
    gradeData: CreateGradeData
  ): Promise<IGrade> {
    // Validate exam exists and is published
    const exam = await Exam.findOne({
      _id: gradeData.exam,
      tenant,
      isPublished: true,
    }).populate(["class", "subject"]);

    if (!exam) {
      throw new AppError("Exam not found or not published", 400);
    }

    // Check if grades already exist for this exam
    const existingGrade = await Grade.findOne({
      tenant,
      exam: gradeData.exam,
    });

    if (existingGrade) {
      throw new AppError("Grades already exist for this exam", 400);
    }

    // Validate all students belong to the exam's class
    const studentIds = gradeData.grades.map((g) => g.student);
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      tenant,
      class: (exam.class as any)._id || exam.class,
      status: "active",
    });

    if (validStudents.length !== studentIds.length) {
      throw new AppError(
        "One or more students do not belong to this class or are not active",
        400
      );
    }

    // Calculate grades and percentages
    const processedGrades: IGradeItem[] = gradeData.grades.map((gradeItem) => {
      if (gradeItem.isAbsent) {
        return {
          student: gradeItem.student as any,
          marksObtained: 0,
          grade: "F",
          percentage: 0,
          remarks: gradeItem.remarks || "Absent",
          isAbsent: true,
        } as IGradeItem;
      }

      const percentage =
        Math.round((gradeItem.marksObtained / exam.totalMarks) * 100 * 100) /
        100;
      const grade = this.calculateGrade(percentage, gradeData.gradingScale);

      return {
        student: gradeItem.student as any,
        marksObtained: gradeItem.marksObtained,
        grade,
        percentage,
        remarks: gradeItem.remarks,
        isAbsent: false,
      } as IGradeItem;
    });

    const newGrade = new Grade({
      tenant,
      exam: gradeData.exam,
      class: (exam.class as any)._id || exam.class,
      subject: (exam.subject as any)._id || exam.subject,
      teacher: teacherId,
      academicYear: gradeData.academicYear,
      gradingScale: gradeData.gradingScale,
      grades: processedGrades,
    });

    await newGrade.save();

    return newGrade.populate([
      { path: "exam", select: "title totalMarks" },
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "grades.student",
        select: "studentId",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);
  }

  private calculateGrade(percentage: number, gradingScale?: any): string {
    const scale = gradingScale || {
      A: { min: 90, max: 100 },
      B: { min: 80, max: 89 },
      C: { min: 70, max: 79 },
      D: { min: 60, max: 69 },
      F: { min: 0, max: 59 },
    };

    if (percentage >= scale.A.min) return "A";
    if (percentage >= scale.B.min) return "B";
    if (percentage >= scale.C.min) return "C";
    if (percentage >= scale.D.min) return "D";
    return "F";
  }

  async getAllGrades(tenant: string, query: GradeQuery) {
    const {
      page = 1,
      limit = 10,
      class: classId,
      subject,
      teacher,
      academicYear,
      isPublished,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter: any = { tenant };

    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;
    if (teacher) filter.teacher = teacher;
    if (academicYear) filter.academicYear = academicYear;
    if (typeof isPublished === "boolean") filter.isPublished = isPublished;

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [grades, total] = await Promise.all([
      Grade.find(filter)
        .populate([
          { path: "exam", select: "title totalMarks examType" },
          { path: "class", select: "name section grade" },
          { path: "subject", select: "name code" },
          { path: "teacher", select: "firstName lastName" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Grade.countDocuments(filter),
    ]);

    return {
      grades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGradeById(id: string, tenant: string): Promise<IGrade> {
    const grade = await Grade.findOne({ _id: id, tenant }).populate([
      { path: "exam", select: "title totalMarks examType duration" },
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code description" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "grades.student",
        select: "studentId rollNumber",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);

    if (!grade) {
      throw new AppError("Grade record not found", 404);
    }

    return grade;
  }

  async updateGrade(
    id: string,
    tenant: string,
    updateData: UpdateGradeData
  ): Promise<IGrade> {
    const grade = await Grade.findOne({ _id: id, tenant }).populate("exam");
    if (!grade) {
      throw new AppError("Grade record not found", 404);
    }

    if (grade.isPublished) {
      throw new AppError("Cannot update published grades", 400);
    }

    // Process updated grades if provided
    if (updateData.grades) {
      const exam = grade.exam as any;
      const processedGrades: IGradeItem[] = updateData.grades.map(
        (gradeItem) => {
          if (gradeItem.isAbsent) {
            return {
              student: gradeItem.student as any,
              marksObtained: 0,
              grade: "F",
              percentage: 0,
              remarks: gradeItem.remarks || "Absent",
              isAbsent: true,
            } as IGradeItem;
          }

          const percentage =
            Math.round(
              (gradeItem.marksObtained / exam.totalMarks) * 100 * 100
            ) / 100;
          const gradeValue = this.calculateGrade(
            percentage,
            updateData.gradingScale || grade.gradingScale
          );

          return {
            student: gradeItem.student as any,
            marksObtained: gradeItem.marksObtained,
            grade: gradeValue,
            percentage,
            remarks: gradeItem.remarks,
            isAbsent: false,
          } as IGradeItem;
        }
      );

      updateData.grades = processedGrades as any;
    }

    const updatedGrade = await Grade.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "exam", select: "title totalMarks" },
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
      {
        path: "grades.student",
        select: "studentId",
        populate: { path: "user", select: "firstName lastName" },
      },
    ]);

    return updatedGrade!;
  }

  async publishGrade(id: string, tenant: string): Promise<IGrade> {
    const grade = await Grade.findOne({ _id: id, tenant });
    if (!grade) {
      throw new AppError("Grade record not found", 404);
    }

    if (grade.isPublished) {
      throw new AppError("Grades are already published", 400);
    }

    grade.isPublished = true;
    grade.publishedAt = new Date();
    await grade.save();

    return grade.populate([
      { path: "exam", select: "title totalMarks" },
      { path: "class", select: "name section grade" },
      { path: "subject", select: "name code" },
      { path: "teacher", select: "firstName lastName" },
    ]);
  }

  async deleteGrade(id: string, tenant: string): Promise<void> {
    const grade = await Grade.findOne({ _id: id, tenant });
    if (!grade) {
      throw new AppError("Grade record not found", 404);
    }

    if (grade.isPublished) {
      throw new AppError("Cannot delete published grades", 400);
    }

    await Grade.findByIdAndDelete(id);
  }

  async getStudentGrades(tenant: string, query: StudentGradeQuery) {
    const { student, academicYear, subject } = query;

    const filter: any = {
      tenant,
      "grades.student": student,
      isPublished: true,
    };

    if (academicYear) filter.academicYear = academicYear;
    if (subject) filter.subject = subject;

    const grades = await Grade.find(filter)
      .populate([
        { path: "exam", select: "title totalMarks examType" },
        { path: "subject", select: "name code" },
        { path: "class", select: "name section grade" },
      ])
      .sort({ createdAt: -1 })
      .lean();

    // Extract student-specific grades
    const studentGrades = grades.map((grade) => {
      const studentGrade = grade.grades.find(
        (g) => g.student.toString() === student
      );
      return {
        exam: grade.exam,
        subject: grade.subject,
        class: grade.class,
        academicYear: grade.academicYear,
        marksObtained: studentGrade?.marksObtained || 0,
        grade: studentGrade?.grade || "F",
        percentage: studentGrade?.percentage || 0,
        remarks: studentGrade?.remarks,
        isAbsent: studentGrade?.isAbsent || false,
        createdAt: grade.createdAt,
      };
    });

    return studentGrades;
  }

  async getGradeReport(tenant: string, query: GradeReportQuery) {
    const {
      class: classId,
      subject,
      academicYear,
      reportType = "summary",
    } = query;

    const filter: any = {
      tenant,
      academicYear,
      isPublished: true,
    };

    if (classId) filter.class = classId;
    if (subject) filter.subject = subject;

    if (reportType === "summary") {
      const stats = await Grade.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalExams: { $sum: 1 },
            averageMarks: { $avg: "$averageMarks" },
            averagePercentage: { $avg: "$averagePercentage" },
            totalPassCount: { $sum: "$passCount" },
            totalFailCount: { $sum: "$failCount" },
            totalAbsentCount: { $sum: "$absentCount" },
            highestMarks: { $max: "$highestMarks" },
            lowestMarks: { $min: "$lowestMarks" },
          },
        },
      ]);

      return (
        stats[0] || {
          totalExams: 0,
          averageMarks: 0,
          averagePercentage: 0,
          totalPassCount: 0,
          totalFailCount: 0,
          totalAbsentCount: 0,
          highestMarks: 0,
          lowestMarks: 0,
        }
      );
    }

    // Detailed report
    const grades = await Grade.find(filter)
      .populate([
        { path: "exam", select: "title totalMarks examType" },
        { path: "subject", select: "name code" },
        { path: "class", select: "name section grade" },
        {
          path: "grades.student",
          select: "studentId",
          populate: { path: "user", select: "firstName lastName" },
        },
      ])
      .sort({ createdAt: -1 })
      .lean();

    return grades;
  }

  async getGradeStats(tenant: string) {
    const stats = await Grade.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalGradeRecords: { $sum: 1 },
          publishedRecords: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
          averageClassPerformance: { $avg: "$averagePercentage" },
          totalStudentsGraded: { $sum: "$totalStudents" },
          overallPassRate: {
            $avg: {
              $cond: [
                { $gt: ["$totalStudents", 0] },
                {
                  $multiply: [
                    { $divide: ["$passCount", "$totalStudents"] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalGradeRecords: 0,
        publishedRecords: 0,
        averageClassPerformance: 0,
        totalStudentsGraded: 0,
        overallPassRate: 0,
      }
    );
  }
}

export default new GradeService();
