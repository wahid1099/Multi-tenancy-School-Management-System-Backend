import { Class, IClass } from "./class.model";
import { User } from "../users/user.model";
import { Subject } from "../subjects/subject.model";
import AppError from "../../utils/AppError";

export interface CreateClassData {
  name: string;
  section: string;
  grade: string;
  academicYear: string;
  classTeacher: string;
  subjects?: string[];
  capacity: number;
  room?: string;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
  }[];
}

export interface UpdateClassData extends Partial<CreateClassData> {
  isActive?: boolean;
}

export interface ClassQuery {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  academicYear?: string;
  classTeacher?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class ClassService {
  async createClass(
    tenant: string,
    classData: CreateClassData
  ): Promise<IClass> {
    // Check if class with same name, section, and academic year exists
    const existingClass = await Class.findOne({
      tenant,
      name: classData.name,
      section: classData.section,
      academicYear: classData.academicYear,
    });

    if (existingClass) {
      throw new AppError(
        "Class with this name and section already exists for the academic year",
        400
      );
    }

    // Validate class teacher exists and is a teacher
    const classTeacher = await User.findOne({
      _id: classData.classTeacher,
      tenant,
      role: "teacher",
      isActive: true,
    });

    if (!classTeacher) {
      throw new AppError("Class teacher not found or not active", 400);
    }

    // Validate subjects exist
    if (classData.subjects && classData.subjects.length > 0) {
      const subjectCount = await Subject.countDocuments({
        tenant,
        _id: { $in: classData.subjects },
        isActive: true,
      });

      if (subjectCount !== classData.subjects.length) {
        throw new AppError("One or more subjects not found", 400);
      }
    }

    // Validate schedule teachers if provided
    if (classData.schedule && classData.schedule.length > 0) {
      const teacherIds = classData.schedule.map((s) => s.teacher);
      const teacherCount = await User.countDocuments({
        tenant,
        _id: { $in: teacherIds },
        role: "teacher",
        isActive: true,
      });

      if (teacherCount !== teacherIds.length) {
        throw new AppError("One or more schedule teachers not found", 400);
      }
    }

    const newClass = new Class({
      ...classData,
      tenant,
      students: [],
    });

    await newClass.save();
    return newClass.populate([
      { path: "classTeacher", select: "firstName lastName email" },
      { path: "subjects", select: "name code" },
      { path: "students", select: "firstName lastName email" },
      { path: "schedule.subject", select: "name code" },
      { path: "schedule.teacher", select: "firstName lastName" },
    ]);
  }

  async getAllClasses(tenant: string, query: ClassQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      grade,
      academicYear,
      classTeacher,
      isActive,
      sortBy = "name",
      sortOrder = "asc",
    } = query;

    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { section: { $regex: search, $options: "i" } },
        { grade: { $regex: search, $options: "i" } },
      ];
    }

    if (grade) {
      filter.grade = { $regex: grade, $options: "i" };
    }

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (classTeacher) {
      filter.classTeacher = classTeacher;
    }

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate([
          { path: "classTeacher", select: "firstName lastName email" },
          { path: "subjects", select: "name code" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(filter),
    ]);

    return {
      classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClassById(id: string, tenant: string): Promise<IClass> {
    const classDoc = await Class.findOne({ _id: id, tenant }).populate([
      { path: "classTeacher", select: "firstName lastName email phone" },
      { path: "subjects", select: "name code description" },
      { path: "students", select: "firstName lastName email phone" },
      { path: "schedule.subject", select: "name code" },
      { path: "schedule.teacher", select: "firstName lastName" },
    ]);

    if (!classDoc) {
      throw new AppError("Class not found", 404);
    }

    return classDoc;
  }

  async updateClass(
    id: string,
    tenant: string,
    updateData: UpdateClassData
  ): Promise<IClass> {
    const classDoc = await Class.findOne({ _id: id, tenant });
    if (!classDoc) {
      throw new AppError("Class not found", 404);
    }

    // Check for duplicate if name, section, or academic year is being updated
    if (updateData.name || updateData.section || updateData.academicYear) {
      const duplicateFilter: any = {
        tenant,
        _id: { $ne: id },
        name: updateData.name || classDoc.name,
        section: updateData.section || classDoc.section,
        academicYear: updateData.academicYear || classDoc.academicYear,
      };

      const existingClass = await Class.findOne(duplicateFilter);
      if (existingClass) {
        throw new AppError(
          "Class with this name and section already exists for the academic year",
          400
        );
      }
    }

    // Validate class teacher if being updated
    if (updateData.classTeacher) {
      const classTeacher = await User.findOne({
        _id: updateData.classTeacher,
        tenant,
        role: "teacher",
        isActive: true,
      });

      if (!classTeacher) {
        throw new AppError("Class teacher not found or not active", 400);
      }
    }

    // Validate subjects if being updated
    if (updateData.subjects && updateData.subjects.length > 0) {
      const subjectCount = await Subject.countDocuments({
        tenant,
        _id: { $in: updateData.subjects },
        isActive: true,
      });

      if (subjectCount !== updateData.subjects.length) {
        throw new AppError("One or more subjects not found", 400);
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "classTeacher", select: "firstName lastName email" },
      { path: "subjects", select: "name code" },
      { path: "students", select: "firstName lastName email" },
      { path: "schedule.subject", select: "name code" },
      { path: "schedule.teacher", select: "firstName lastName" },
    ]);

    return updatedClass!;
  }

  async deleteClass(id: string, tenant: string): Promise<void> {
    const classDoc = await Class.findOne({ _id: id, tenant });
    if (!classDoc) {
      throw new AppError("Class not found", 404);
    }

    if (classDoc.students.length > 0) {
      throw new AppError("Cannot delete class with enrolled students", 400);
    }

    await Class.findByIdAndDelete(id);
  }

  async addStudent(
    classId: string,
    studentId: string,
    tenant: string
  ): Promise<IClass> {
    const classDoc = await Class.findOne({ _id: classId, tenant });
    if (!classDoc) {
      throw new AppError("Class not found", 404);
    }

    // Check if class is at capacity
    if (classDoc.students.length >= classDoc.capacity) {
      throw new AppError("Class is at full capacity", 400);
    }

    // Validate student exists and is a student
    const student = await User.findOne({
      _id: studentId,
      tenant,
      role: "student",
      isActive: true,
    });

    if (!student) {
      throw new AppError("Student not found or not active", 400);
    }

    // Check if student is already in the class
    if (classDoc.students.includes(studentId as any)) {
      throw new AppError("Student is already enrolled in this class", 400);
    }

    classDoc.students.push(studentId as any);
    await classDoc.save();

    return classDoc.populate([
      { path: "classTeacher", select: "firstName lastName email" },
      { path: "subjects", select: "name code" },
      { path: "students", select: "firstName lastName email" },
    ]);
  }

  async removeStudent(
    classId: string,
    studentId: string,
    tenant: string
  ): Promise<IClass> {
    const classDoc = await Class.findOne({ _id: classId, tenant });
    if (!classDoc) {
      throw new AppError("Class not found", 404);
    }

    // Check if student is in the class
    const studentIndex = classDoc.students.indexOf(studentId as any);
    if (studentIndex === -1) {
      throw new AppError("Student is not enrolled in this class", 400);
    }

    classDoc.students.splice(studentIndex, 1);
    await classDoc.save();

    return classDoc.populate([
      { path: "classTeacher", select: "firstName lastName email" },
      { path: "subjects", select: "name code" },
      { path: "students", select: "firstName lastName email" },
    ]);
  }

  async getClassStats(tenant: string) {
    const stats = await Class.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          activeClasses: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          totalCapacity: { $sum: "$capacity" },
          totalEnrolled: { $sum: { $size: "$students" } },
          averageClassSize: { $avg: { $size: "$students" } },
        },
      },
    ]);

    return (
      stats[0] || {
        totalClasses: 0,
        activeClasses: 0,
        totalCapacity: 0,
        totalEnrolled: 0,
        averageClassSize: 0,
      }
    );
  }
}

export default new ClassService();
