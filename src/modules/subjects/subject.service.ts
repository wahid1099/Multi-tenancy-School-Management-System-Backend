import { Subject, ISubject } from "./subject.model";
import AppError from "../../utils/AppError";

export interface CreateSubjectData {
  name: string;
  code: string;
  description?: string;
  category: "core" | "elective" | "extracurricular";
  credits: number;
  department?: string;
  prerequisites?: string[];
}

export interface UpdateSubjectData extends Partial<CreateSubjectData> {
  isActive?: boolean;
}

export interface SubjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: "core" | "elective" | "extracurricular";
  department?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class SubjectService {
  async createSubject(
    tenant: string,
    subjectData: CreateSubjectData
  ): Promise<ISubject> {
    const existingSubject = await Subject.findOne({
      tenant,
      $or: [{ code: subjectData.code }, { name: subjectData.name }],
    });

    if (existingSubject) {
      throw new AppError("Subject with this code or name already exists", 400);
    }

    // Validate prerequisites exist
    if (subjectData.prerequisites && subjectData.prerequisites.length > 0) {
      const prerequisiteCount = await Subject.countDocuments({
        tenant,
        _id: { $in: subjectData.prerequisites },
        isActive: true,
      });

      if (prerequisiteCount !== subjectData.prerequisites.length) {
        throw new AppError("One or more prerequisite subjects not found", 400);
      }
    }

    const subject = new Subject({
      ...subjectData,
      tenant,
    });

    await subject.save();
    return subject.populate("prerequisites", "name code");
  }

  async getAllSubjects(tenant: string, query: SubjectQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      department,
      isActive,
      sortBy = "name",
      sortOrder = "asc",
    } = query;

    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (department) {
      filter.department = { $regex: department, $options: "i" };
    }

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .populate("prerequisites", "name code")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Subject.countDocuments(filter),
    ]);

    return {
      subjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubjectById(id: string, tenant: string): Promise<ISubject> {
    const subject = await Subject.findOne({ _id: id, tenant }).populate(
      "prerequisites",
      "name code"
    );

    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    return subject;
  }

  async updateSubject(
    id: string,
    tenant: string,
    updateData: UpdateSubjectData
  ): Promise<ISubject> {
    const subject = await Subject.findOne({ _id: id, tenant });
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    // Check for duplicate code or name if being updated
    if (updateData.code || updateData.name) {
      const duplicateFilter: any = { tenant, _id: { $ne: id } };
      const orConditions = [];

      if (updateData.code) orConditions.push({ code: updateData.code });
      if (updateData.name) orConditions.push({ name: updateData.name });

      if (orConditions.length > 0) {
        duplicateFilter.$or = orConditions;
        const existingSubject = await Subject.findOne(duplicateFilter);
        if (existingSubject) {
          throw new AppError(
            "Subject with this code or name already exists",
            400
          );
        }
      }
    }

    // Validate prerequisites exist
    if (updateData.prerequisites && updateData.prerequisites.length > 0) {
      const prerequisiteCount = await Subject.countDocuments({
        tenant,
        _id: { $in: updateData.prerequisites },
        isActive: true,
      });

      if (prerequisiteCount !== updateData.prerequisites.length) {
        throw new AppError("One or more prerequisite subjects not found", 400);
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("prerequisites", "name code");

    return updatedSubject!;
  }

  async deleteSubject(id: string, tenant: string): Promise<void> {
    const subject = await Subject.findOne({ _id: id, tenant });
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    // Check if subject is used as prerequisite
    const dependentSubjects = await Subject.countDocuments({
      tenant,
      prerequisites: id,
    });

    if (dependentSubjects > 0) {
      throw new AppError(
        "Cannot delete subject that is used as prerequisite for other subjects",
        400
      );
    }

    await Subject.findByIdAndDelete(id);
  }

  async toggleSubjectStatus(id: string, tenant: string): Promise<ISubject> {
    const subject = await Subject.findOne({ _id: id, tenant });
    if (!subject) {
      throw new AppError("Subject not found", 404);
    }

    subject.isActive = !subject.isActive;
    await subject.save();

    return subject.populate("prerequisites", "name code");
  }

  async getSubjectsByCategory(tenant: string, category: string) {
    const subjects = await Subject.find({
      tenant,
      category,
      isActive: true,
    })
      .populate("prerequisites", "name code")
      .sort({ name: 1 })
      .lean();

    return subjects;
  }

  async getSubjectStats(tenant: string) {
    const stats = await Subject.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalSubjects: { $sum: 1 },
          activeSubjects: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          coreSubjects: {
            $sum: { $cond: [{ $eq: ["$category", "core"] }, 1, 0] },
          },
          electiveSubjects: {
            $sum: { $cond: [{ $eq: ["$category", "elective"] }, 1, 0] },
          },
          extracurricularSubjects: {
            $sum: { $cond: [{ $eq: ["$category", "extracurricular"] }, 1, 0] },
          },
          totalCredits: { $sum: "$credits" },
        },
      },
    ]);

    return (
      stats[0] || {
        totalSubjects: 0,
        activeSubjects: 0,
        coreSubjects: 0,
        electiveSubjects: 0,
        extracurricularSubjects: 0,
        totalCredits: 0,
      }
    );
  }
}

export default new SubjectService();
