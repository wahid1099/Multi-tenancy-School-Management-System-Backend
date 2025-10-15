import { Timetable, ITimetable, ITimeSlot } from "./timetable.model";
import { Class } from "../classes/class.model";
import { Subject } from "../subjects/subject.model";
import { User } from "../users/user.model";
import AppError from "../../utils/AppError";

export interface CreateTimetableData {
  class: string;
  academicYear: string;
  term: "first" | "second" | "third" | "annual";
  effectiveFrom: Date;
  effectiveTo: Date;
  timeSlots: {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    room?: string;
    type?: string;
  }[];
  breakTimes?: {
    name: string;
    startTime: string;
    endTime: string;
    days: string[];
  }[];
  workingDays: string[];
}

export interface UpdateTimetableData extends Partial<CreateTimetableData> {
  isActive?: boolean;
}

export interface TimetableQuery {
  page?: number;
  limit?: number;
  class?: string;
  academicYear?: string;
  term?: "first" | "second" | "third" | "annual";
  isActive?: boolean;
  effectiveDate?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TeacherTimetableQuery {
  teacher: string;
  academicYear?: string;
  effectiveDate?: Date;
}

class TimetableService {
  async createTimetable(
    tenant: string,
    createdBy: string,
    timetableData: CreateTimetableData
  ): Promise<ITimetable> {
    // Validate class exists
    const classDoc = await Class.findOne({
      _id: timetableData.class,
      tenant,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found or not active", 400);
    }

    // Check if timetable already exists for the same class, academic year, and term
    const existingTimetable = await Timetable.findOne({
      tenant,
      class: timetableData.class,
      academicYear: timetableData.academicYear,
      term: timetableData.term,
    });

    if (existingTimetable) {
      throw new AppError(
        "Timetable already exists for this class, academic year, and term",
        400
      );
    }

    // Validate subjects exist
    const subjectIds = timetableData.timeSlots.map((slot) => slot.subject);
    const validSubjects = await Subject.find({
      _id: { $in: subjectIds },
      tenant,
      isActive: true,
    });

    if (validSubjects.length !== new Set(subjectIds).size) {
      throw new AppError("One or more subjects not found or not active", 400);
    }

    // Validate teachers exist
    const teacherIds = timetableData.timeSlots.map((slot) => slot.teacher);
    const validTeachers = await User.find({
      _id: { $in: teacherIds },
      tenant,
      role: "teacher",
      isActive: true,
    });

    if (validTeachers.length !== new Set(teacherIds).size) {
      throw new AppError("One or more teachers not found or not active", 400);
    }

    // Check for teacher conflicts
    await this.checkTeacherConflicts(
      tenant,
      timetableData.timeSlots,
      timetableData.effectiveFrom,
      timetableData.effectiveTo
    );

    const timetable = new Timetable({
      ...timetableData,
      tenant,
      createdBy,
    });

    await timetable.save();

    return timetable.populate([
      { path: "class", select: "name section grade" },
      { path: "timeSlots.subject", select: "name code" },
      { path: "timeSlots.teacher", select: "firstName lastName" },
      { path: "createdBy", select: "firstName lastName" },
    ]);
  }

  private async checkTeacherConflicts(
    tenant: string,
    timeSlots: any[],
    effectiveFrom: Date,
    effectiveTo: Date,
    excludeId?: string
  ) {
    const teacherSlots: { [key: string]: any[] } = {};

    // Group slots by teacher
    timeSlots.forEach((slot) => {
      if (!teacherSlots[slot.teacher]) {
        teacherSlots[slot.teacher] = [];
      }
      teacherSlots[slot.teacher].push(slot);
    });

    // Check for conflicts with existing timetables
    for (const teacherId in teacherSlots) {
      const existingTimetables = await Timetable.find({
        tenant,
        _id: { $ne: excludeId },
        "timeSlots.teacher": teacherId,
        isActive: true,
        $or: [
          {
            effectiveFrom: { $lte: effectiveTo },
            effectiveTo: { $gte: effectiveFrom },
          },
        ],
      });

      for (const existingTimetable of existingTimetables) {
        const existingSlots = existingTimetable.timeSlots.filter(
          (slot) => slot.teacher.toString() === teacherId
        );

        for (const newSlot of teacherSlots[teacherId]) {
          for (const existingSlot of existingSlots) {
            if (newSlot.day === existingSlot.day) {
              if (
                this.isTimeOverlapping(
                  newSlot.startTime,
                  newSlot.endTime,
                  existingSlot.startTime,
                  existingSlot.endTime
                )
              ) {
                throw new AppError(
                  `Teacher conflict detected on ${newSlot.day} between ${newSlot.startTime}-${newSlot.endTime}`,
                  400
                );
              }
            }
          }
        }
      }
    }
  }

  private isTimeOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  async getAllTimetables(tenant: string, query: TimetableQuery) {
    const {
      page = 1,
      limit = 10,
      class: classId,
      academicYear,
      term,
      isActive,
      effectiveDate,
      sortBy = "effectiveFrom",
      sortOrder = "desc",
    } = query;

    const filter: any = { tenant };

    if (classId) filter.class = classId;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (typeof isActive === "boolean") filter.isActive = isActive;

    if (effectiveDate) {
      filter.effectiveFrom = { $lte: effectiveDate };
      filter.effectiveTo = { $gte: effectiveDate };
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [timetables, total] = await Promise.all([
      Timetable.find(filter)
        .populate([
          { path: "class", select: "name section grade" },
          { path: "timeSlots.subject", select: "name code" },
          { path: "timeSlots.teacher", select: "firstName lastName" },
          { path: "createdBy", select: "firstName lastName" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Timetable.countDocuments(filter),
    ]);

    return {
      timetables,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTimetableById(id: string, tenant: string): Promise<ITimetable> {
    const timetable = await Timetable.findOne({ _id: id, tenant }).populate([
      { path: "class", select: "name section grade" },
      { path: "timeSlots.subject", select: "name code description" },
      { path: "timeSlots.teacher", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }

    return timetable;
  }

  async updateTimetable(
    id: string,
    tenant: string,
    updateData: UpdateTimetableData
  ): Promise<ITimetable> {
    const timetable = await Timetable.findOne({ _id: id, tenant });
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }

    // Validate subjects if time slots are being updated
    if (updateData.timeSlots) {
      const subjectIds = updateData.timeSlots.map((slot) => slot.subject);
      const validSubjects = await Subject.find({
        _id: { $in: subjectIds },
        tenant,
        isActive: true,
      });

      if (validSubjects.length !== new Set(subjectIds).size) {
        throw new AppError("One or more subjects not found or not active", 400);
      }

      // Validate teachers
      const teacherIds = updateData.timeSlots.map((slot) => slot.teacher);
      const validTeachers = await User.find({
        _id: { $in: teacherIds },
        tenant,
        role: "teacher",
        isActive: true,
      });

      if (validTeachers.length !== new Set(teacherIds).size) {
        throw new AppError("One or more teachers not found or not active", 400);
      }

      // Check for teacher conflicts
      const effectiveFrom = updateData.effectiveFrom || timetable.effectiveFrom;
      const effectiveTo = updateData.effectiveTo || timetable.effectiveTo;

      await this.checkTeacherConflicts(
        tenant,
        updateData.timeSlots,
        effectiveFrom,
        effectiveTo,
        id
      );
    }

    const updatedTimetable = await Timetable.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "class", select: "name section grade" },
      { path: "timeSlots.subject", select: "name code" },
      { path: "timeSlots.teacher", select: "firstName lastName" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    return updatedTimetable!;
  }

  async deleteTimetable(id: string, tenant: string): Promise<void> {
    const timetable = await Timetable.findOne({ _id: id, tenant });
    if (!timetable) {
      throw new AppError("Timetable not found", 404);
    }

    await Timetable.findByIdAndDelete(id);
  }

  async getTeacherTimetable(tenant: string, query: TeacherTimetableQuery) {
    const { teacher, academicYear, effectiveDate } = query;

    const filter: any = {
      tenant,
      "timeSlots.teacher": teacher,
      isActive: true,
    };

    if (academicYear) filter.academicYear = academicYear;

    if (effectiveDate) {
      filter.effectiveFrom = { $lte: effectiveDate };
      filter.effectiveTo = { $gte: effectiveDate };
    }

    const timetables = await Timetable.find(filter)
      .populate([
        { path: "class", select: "name section grade" },
        { path: "timeSlots.subject", select: "name code" },
        { path: "timeSlots.teacher", select: "firstName lastName" },
      ])
      .lean();

    // Extract teacher-specific slots
    const teacherSlots: any[] = [];

    timetables.forEach((timetable) => {
      const slots = timetable.timeSlots.filter(
        (slot) =>
          ((slot.teacher as any)._id || slot.teacher).toString() === teacher
      );

      slots.forEach((slot) => {
        teacherSlots.push({
          ...slot,
          class: timetable.class,
          academicYear: timetable.academicYear,
          term: timetable.term,
        });
      });
    });

    // Group by day
    const dayWiseSlots: { [key: string]: any[] } = {};
    teacherSlots.forEach((slot) => {
      if (!dayWiseSlots[slot.day]) {
        dayWiseSlots[slot.day] = [];
      }
      dayWiseSlots[slot.day].push(slot);
    });

    // Sort slots by time for each day
    Object.keys(dayWiseSlots).forEach((day) => {
      dayWiseSlots[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return dayWiseSlots;
  }

  async getTimetableStats(tenant: string) {
    const stats = await Timetable.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalTimetables: { $sum: 1 },
          activeTimetables: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          currentTimetables: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ["$effectiveFrom", new Date()] },
                    { $gte: ["$effectiveTo", new Date()] },
                    { $eq: ["$isActive", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalTimeSlots: { $sum: { $size: "$timeSlots" } },
          averageSlotsPerTimetable: { $avg: { $size: "$timeSlots" } },
        },
      },
    ]);

    return (
      stats[0] || {
        totalTimetables: 0,
        activeTimetables: 0,
        currentTimetables: 0,
        totalTimeSlots: 0,
        averageSlotsPerTimetable: 0,
      }
    );
  }

  async getCurrentTimetable(tenant: string, classId: string) {
    const currentDate = new Date();

    const timetable = await Timetable.findOne({
      tenant,
      class: classId,
      effectiveFrom: { $lte: currentDate },
      effectiveTo: { $gte: currentDate },
      isActive: true,
    })
      .populate([
        { path: "class", select: "name section grade" },
        { path: "timeSlots.subject", select: "name code" },
        { path: "timeSlots.teacher", select: "firstName lastName" },
      ])
      .lean();

    if (!timetable) {
      throw new AppError("No active timetable found for this class", 404);
    }

    // Group time slots by day
    const dayWiseSlots: { [key: string]: any[] } = {};

    timetable.timeSlots.forEach((slot) => {
      if (!dayWiseSlots[slot.day]) {
        dayWiseSlots[slot.day] = [];
      }
      dayWiseSlots[slot.day].push(slot);
    });

    // Sort slots by time for each day
    Object.keys(dayWiseSlots).forEach((day) => {
      dayWiseSlots[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return {
      ...timetable,
      dayWiseSlots,
    };
  }
}

export default new TimetableService();
