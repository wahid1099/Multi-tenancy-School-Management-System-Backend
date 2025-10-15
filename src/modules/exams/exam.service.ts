import { Exam, IExam, IExamQuestion } from "./exam.model";
import { Subject } from "../subjects/subject.model";
import { Class } from "../classes/class.model";
import AppError from "../../utils/AppError";

export interface CreateExamData {
  title: string;
  description?: string;
  subject: string;
  class: string;
  examType: "quiz" | "unit_test" | "midterm" | "final" | "assignment";
  totalMarks: number;
  passingMarks: number;
  duration: number;
  startDate: Date;
  endDate: Date;
  instructions?: string;
  questions?: IExamQuestion[];
  allowRetake?: boolean;
  maxAttempts?: number;
  showResults?: boolean;
  randomizeQuestions?: boolean;
}

export interface UpdateExamData extends Partial<CreateExamData> {
  isActive?: boolean;
}

export interface ExamQuery {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string;
  class?: string;
  examType?: "quiz" | "unit_test" | "midterm" | "final" | "assignment";
  isPublished?: boolean;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class ExamService {
  async createExam(
    tenant: string,
    createdBy: string,
    examData: CreateExamData
  ): Promise<IExam> {
    // Validate subject exists
    const subject = await Subject.findOne({
      _id: examData.subject,
      tenant,
      isActive: true,
    });

    if (!subject) {
      throw new AppError("Subject not found or not active", 400);
    }

    // Validate class exists
    const classDoc = await Class.findOne({
      _id: examData.class,
      tenant,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found or not active", 400);
    }

    // Check for overlapping exams
    const overlappingExam = await Exam.findOne({
      tenant,
      class: examData.class,
      subject: examData.subject,
      isActive: true,
      $or: [
        {
          startDate: { $lte: examData.endDate },
          endDate: { $gte: examData.startDate },
        },
      ],
    });

    if (overlappingExam) {
      throw new AppError(
        "Another exam is scheduled during this time period",
        400
      );
    }

    const exam = new Exam({
      ...examData,
      tenant,
      createdBy,
    });

    await exam.save();

    return exam.populate([
      { path: "subject", select: "name code" },
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);
  }

  async getAllExams(tenant: string, query: ExamQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      subject,
      class: classId,
      examType,
      isPublished,
      isActive,
      dateFrom,
      dateTo,
      sortBy = "startDate",
      sortOrder = "desc",
    } = query;

    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (subject) {
      filter.subject = subject;
    }

    if (classId) {
      filter.class = classId;
    }

    if (examType) {
      filter.examType = examType;
    }

    if (typeof isPublished === "boolean") {
      filter.isPublished = isPublished;
    }

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    if (dateFrom || dateTo) {
      filter.startDate = {};
      if (dateFrom) filter.startDate.$gte = dateFrom;
      if (dateTo) filter.startDate.$lte = dateTo;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate([
          { path: "subject", select: "name code" },
          { path: "class", select: "name section grade" },
          { path: "createdBy", select: "firstName lastName" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter),
    ]);

    return {
      exams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExamById(id: string, tenant: string): Promise<IExam> {
    const exam = await Exam.findOne({ _id: id, tenant }).populate([
      { path: "subject", select: "name code description" },
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    return exam;
  }

  async updateExam(
    id: string,
    tenant: string,
    updateData: UpdateExamData
  ): Promise<IExam> {
    const exam = await Exam.findOne({ _id: id, tenant });
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    if (exam.isPublished) {
      throw new AppError("Cannot update published exam", 400);
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

    // Validate class if being updated
    if (updateData.class) {
      const classDoc = await Class.findOne({
        _id: updateData.class,
        tenant,
        isActive: true,
      });

      if (!classDoc) {
        throw new AppError("Class not found or not active", 400);
      }
    }

    // Check for overlapping exams if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || exam.startDate;
      const endDate = updateData.endDate || exam.endDate;

      const overlappingExam = await Exam.findOne({
        tenant,
        _id: { $ne: id },
        class: updateData.class || exam.class,
        subject: updateData.subject || exam.subject,
        isActive: true,
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate },
          },
        ],
      });

      if (overlappingExam) {
        throw new AppError(
          "Another exam is scheduled during this time period",
          400
        );
      }
    }

    const updatedExam = await Exam.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "subject", select: "name code" },
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    return updatedExam!;
  }

  async publishExam(id: string, tenant: string): Promise<IExam> {
    const exam = await Exam.findOne({ _id: id, tenant });
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    if (exam.isPublished) {
      throw new AppError("Exam is already published", 400);
    }

    if (exam.questions.length === 0) {
      throw new AppError("Cannot publish exam without questions", 400);
    }

    if (new Date() > exam.startDate) {
      throw new AppError("Cannot publish exam after start date", 400);
    }

    exam.isPublished = true;
    await exam.save();

    return exam.populate([
      { path: "subject", select: "name code" },
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);
  }

  async deleteExam(id: string, tenant: string): Promise<void> {
    const exam = await Exam.findOne({ _id: id, tenant });
    if (!exam) {
      throw new AppError("Exam not found", 404);
    }

    if (exam.isPublished) {
      throw new AppError("Cannot delete published exam", 400);
    }

    await Exam.findByIdAndDelete(id);
  }

  async getUpcomingExams(tenant: string, classId?: string, limit: number = 10) {
    const filter: any = {
      tenant,
      isPublished: true,
      isActive: true,
      startDate: { $gte: new Date() },
    };

    if (classId) {
      filter.class = classId;
    }

    const exams = await Exam.find(filter)
      .populate([
        { path: "subject", select: "name code" },
        { path: "class", select: "name section grade" },
      ])
      .sort({ startDate: 1 })
      .limit(limit)
      .lean();

    return exams;
  }

  async getExamStats(tenant: string) {
    const stats = await Exam.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          publishedExams: {
            $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] },
          },
          draftExams: {
            $sum: { $cond: [{ $eq: ["$isPublished", false] }, 1, 0] },
          },
          upcomingExams: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isPublished", true] },
                    { $gte: ["$startDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completedExams: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isPublished", true] },
                    { $lt: ["$endDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          averageDuration: { $avg: "$duration" },
          averageMarks: { $avg: "$totalMarks" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalExams: 0,
        publishedExams: 0,
        draftExams: 0,
        upcomingExams: 0,
        completedExams: 0,
        averageDuration: 0,
        averageMarks: 0,
      }
    );
  }

  async getExamsByType(tenant: string) {
    const stats = await Exam.aggregate([
      { $match: { tenant, isActive: true } },
      {
        $group: {
          _id: "$examType",
          count: { $sum: 1 },
          totalMarks: { $sum: "$totalMarks" },
          averageMarks: { $avg: "$totalMarks" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }
}

export default new ExamService();
