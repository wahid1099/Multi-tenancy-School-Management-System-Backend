import { Student, IStudent } from "./student.model";
import { User } from "../users/user.model";
import { Class } from "../classes/class.model";
import AppError from "../../utils/AppError";

export interface CreateStudentData {
  user: string;
  studentId: string;
  admissionNumber: string;
  admissionDate: Date;
  class: string;
  rollNumber?: string;
  academicYear: string;
  guardianInfo: {
    fatherName: string;
    motherName: string;
    guardianName?: string;
    guardianRelation?: string;
    guardianPhone: string;
    guardianEmail?: string;
    guardianAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  medicalInfo?: {
    bloodGroup?: string;
    allergies?: string[];
    medications?: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  previousSchool?: {
    name: string;
    address: string;
    lastClass: string;
    tcNumber?: string;
    tcDate?: Date;
  };
  documents?: {
    type: string;
    name: string;
    url: string;
  }[];
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  status?: "active" | "inactive" | "transferred" | "graduated" | "dropped";
}

export interface StudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  academicYear?: string;
  status?: "active" | "inactive" | "transferred" | "graduated" | "dropped";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class StudentService {
  async createStudent(
    tenant: string,
    studentData: CreateStudentData
  ): Promise<IStudent> {
    // Check if student ID already exists
    const existingStudentId = await Student.findOne({
      tenant,
      studentId: studentData.studentId,
    });

    if (existingStudentId) {
      throw new AppError("Student ID already exists", 400);
    }

    // Check if admission number already exists
    const existingAdmissionNumber = await Student.findOne({
      tenant,
      admissionNumber: studentData.admissionNumber,
    });

    if (existingAdmissionNumber) {
      throw new AppError("Admission number already exists", 400);
    }

    // Validate user exists and is a student
    const user = await User.findOne({
      _id: studentData.user,
      tenant,
      role: "student",
      isActive: true,
    });

    if (!user) {
      throw new AppError("User not found or not a student", 400);
    }

    // Check if user is already a student
    const existingStudent = await Student.findOne({ user: studentData.user });
    if (existingStudent) {
      throw new AppError("User is already registered as a student", 400);
    }

    // Validate class exists
    const classDoc = await Class.findOne({
      _id: studentData.class,
      tenant,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found or not active", 400);
    }

    const student = new Student({
      ...studentData,
      tenant,
    });

    await student.save();

    // Add student to class
    await Class.findByIdAndUpdate(studentData.class, {
      $addToSet: { students: student._id },
    });

    return student.populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "class", select: "name section grade" },
    ]);
  }

  async getAllStudents(tenant: string, query: StudentQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      class: classId,
      academicYear,
      status,
      sortBy = "studentId",
      sortOrder = "asc",
    } = query;

    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: "i" } },
        { admissionNumber: { $regex: search, $options: "i" } },
        { "guardianInfo.fatherName": { $regex: search, $options: "i" } },
        { "guardianInfo.motherName": { $regex: search, $options: "i" } },
      ];
    }

    if (classId) {
      filter.class = classId;
    }

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (status) {
      filter.status = status;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate([
          { path: "user", select: "firstName lastName email phone" },
          { path: "class", select: "name section grade" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentById(id: string, tenant: string): Promise<IStudent> {
    const student = await Student.findOne({ _id: id, tenant }).populate([
      {
        path: "user",
        select: "firstName lastName email phone dateOfBirth gender address",
      },
      {
        path: "class",
        select: "name section grade classTeacher",
        populate: { path: "classTeacher", select: "firstName lastName" },
      },
    ]);

    if (!student) {
      throw new AppError("Student not found", 404);
    }

    return student;
  }

  async updateStudent(
    id: string,
    tenant: string,
    updateData: UpdateStudentData
  ): Promise<IStudent> {
    const student = await Student.findOne({ _id: id, tenant });
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Check for duplicate student ID if being updated
    if (updateData.studentId && updateData.studentId !== student.studentId) {
      const existingStudentId = await Student.findOne({
        tenant,
        studentId: updateData.studentId,
        _id: { $ne: id },
      });

      if (existingStudentId) {
        throw new AppError("Student ID already exists", 400);
      }
    }

    // Check for duplicate admission number if being updated
    if (
      updateData.admissionNumber &&
      updateData.admissionNumber !== student.admissionNumber
    ) {
      const existingAdmissionNumber = await Student.findOne({
        tenant,
        admissionNumber: updateData.admissionNumber,
        _id: { $ne: id },
      });

      if (existingAdmissionNumber) {
        throw new AppError("Admission number already exists", 400);
      }
    }

    // Validate class if being updated
    if (updateData.class && updateData.class !== student.class.toString()) {
      const classDoc = await Class.findOne({
        _id: updateData.class,
        tenant,
        isActive: true,
      });

      if (!classDoc) {
        throw new AppError("Class not found or not active", 400);
      }

      // Remove from old class and add to new class
      await Class.findByIdAndUpdate(student.class, {
        $pull: { students: student._id },
      });

      await Class.findByIdAndUpdate(updateData.class, {
        $addToSet: { students: student._id },
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "class", select: "name section grade" },
    ]);

    return updatedStudent!;
  }

  async deleteStudent(id: string, tenant: string): Promise<void> {
    const student = await Student.findOne({ _id: id, tenant });
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    // Remove student from class
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: student._id },
    });

    await Student.findByIdAndDelete(id);
  }

  async updateStudentStatus(
    id: string,
    tenant: string,
    status: string
  ): Promise<IStudent> {
    const student = await Student.findOne({ _id: id, tenant });
    if (!student) {
      throw new AppError("Student not found", 404);
    }

    student.status = status as any;
    await student.save();

    return student.populate([
      { path: "user", select: "firstName lastName email phone" },
      { path: "class", select: "name section grade" },
    ]);
  }

  async getStudentsByClass(classId: string, tenant: string) {
    const students = await Student.find({
      tenant,
      class: classId,
      status: "active",
    })
      .populate("user", "firstName lastName email phone")
      .sort({ rollNumber: 1, studentId: 1 })
      .lean();

    return students;
  }

  async getStudentStats(tenant: string) {
    const stats = await Student.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          inactiveStudents: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
          },
          transferredStudents: {
            $sum: { $cond: [{ $eq: ["$status", "transferred"] }, 1, 0] },
          },
          graduatedStudents: {
            $sum: { $cond: [{ $eq: ["$status", "graduated"] }, 1, 0] },
          },
          droppedStudents: {
            $sum: { $cond: [{ $eq: ["$status", "dropped"] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        transferredStudents: 0,
        graduatedStudents: 0,
        droppedStudents: 0,
      }
    );
  }
}

export default new StudentService();
