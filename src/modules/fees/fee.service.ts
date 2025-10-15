import {
  Fee,
  FeeRecord,
  IFee,
  IFeeRecord,
  IFeeStructure,
  IFeePayment,
} from "./fee.model";
import { Class } from "../classes/class.model";
import { Student } from "../students/student.model";
import AppError from "../../utils/AppError";

export interface CreateFeeData {
  class: string;
  academicYear: string;
  term: "first" | "second" | "third" | "annual";
  feeStructure: IFeeStructure[];
  dueDate: Date;
  lateFeePenalty?: number;
  lateFeeAfterDays?: number;
  discounts?: {
    name: string;
    type: "percentage" | "fixed";
    value: number;
    applicableFor?: string[];
  }[];
}

export interface UpdateFeeData extends Partial<CreateFeeData> {
  isActive?: boolean;
}

export interface RecordPaymentData {
  student: string;
  payments: {
    feeStructure: string;
    amountPaid: number;
    paymentDate: Date;
    paymentMethod: "cash" | "card" | "bank_transfer" | "cheque" | "online";
    transactionId?: string;
    receiptNumber: string;
    remarks?: string;
  }[];
}

export interface FeeQuery {
  page?: number;
  limit?: number;
  class?: string;
  academicYear?: string;
  term?: "first" | "second" | "third" | "annual";
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FeeRecordQuery {
  page?: number;
  limit?: number;
  student?: string;
  fee?: string;
  status?: "pending" | "partial" | "paid" | "overdue";
  dueDateFrom?: Date;
  dueDateTo?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FeeReportQuery {
  class?: string;
  academicYear: string;
  term?: "first" | "second" | "third" | "annual";
  reportType?: "summary" | "detailed" | "defaulters";
}

class FeeService {
  async createFee(
    tenant: string,
    createdBy: string,
    feeData: CreateFeeData
  ): Promise<IFee> {
    // Validate class exists
    const classDoc = await Class.findOne({
      _id: feeData.class,
      tenant,
      isActive: true,
    });

    if (!classDoc) {
      throw new AppError("Class not found or not active", 400);
    }

    // Check if fee already exists for the same class, academic year, and term
    const existingFee = await Fee.findOne({
      tenant,
      class: feeData.class,
      academicYear: feeData.academicYear,
      term: feeData.term,
    });

    if (existingFee) {
      throw new AppError(
        "Fee structure already exists for this class, academic year, and term",
        400
      );
    }

    const fee = new Fee({
      ...feeData,
      tenant,
      createdBy,
    });

    await fee.save();

    // Create fee records for all students in the class
    await this.createFeeRecordsForClass(tenant, fee);

    return fee.populate([
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);
  }

  private async createFeeRecordsForClass(tenant: string, fee: IFee) {
    const students = await Student.find({
      tenant,
      class: fee.class,
      status: "active",
    });

    const feeRecords = students.map((student) => {
      let discountApplied = 0;
      let finalAmount = fee.totalAmount;

      // Apply discounts if applicable
      if (fee.discounts && fee.discounts.length > 0) {
        for (const discount of fee.discounts) {
          if (discount.applicableFor.includes(student._id)) {
            if (discount.type === "percentage") {
              discountApplied += (fee.totalAmount * discount.value) / 100;
            } else {
              discountApplied += discount.value;
            }
          }
        }
      }

      finalAmount = fee.totalAmount - discountApplied;

      return new FeeRecord({
        tenant,
        student: student._id,
        fee: fee._id,
        totalAmount: fee.totalAmount,
        discountApplied,
        finalAmount,
        dueDate: fee.dueDate,
        payments: [],
      });
    });

    await FeeRecord.insertMany(feeRecords);
  }

  async getAllFees(tenant: string, query: FeeQuery) {
    const {
      page = 1,
      limit = 10,
      class: classId,
      academicYear,
      term,
      isActive,
      sortBy = "dueDate",
      sortOrder = "asc",
    } = query;

    const filter: any = { tenant };

    if (classId) filter.class = classId;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (typeof isActive === "boolean") filter.isActive = isActive;

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [fees, total] = await Promise.all([
      Fee.find(filter)
        .populate([
          { path: "class", select: "name section grade" },
          { path: "createdBy", select: "firstName lastName" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Fee.countDocuments(filter),
    ]);

    return {
      fees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeeById(id: string, tenant: string): Promise<IFee> {
    const fee = await Fee.findOne({ _id: id, tenant }).populate([
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    if (!fee) {
      throw new AppError("Fee not found", 404);
    }

    return fee;
  }

  async updateFee(
    id: string,
    tenant: string,
    updateData: UpdateFeeData
  ): Promise<IFee> {
    const fee = await Fee.findOne({ _id: id, tenant });
    if (!fee) {
      throw new AppError("Fee not found", 404);
    }

    const updatedFee = await Fee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "class", select: "name section grade" },
      { path: "createdBy", select: "firstName lastName" },
    ]);

    return updatedFee!;
  }

  async deleteFee(id: string, tenant: string): Promise<void> {
    const fee = await Fee.findOne({ _id: id, tenant });
    if (!fee) {
      throw new AppError("Fee not found", 404);
    }

    // Check if there are any payments made
    const paidRecords = await FeeRecord.countDocuments({
      tenant,
      fee: id,
      amountPaid: { $gt: 0 },
    });

    if (paidRecords > 0) {
      throw new AppError(
        "Cannot delete fee structure with existing payments",
        400
      );
    }

    // Delete fee records first
    await FeeRecord.deleteMany({ tenant, fee: id });

    // Delete fee
    await Fee.findByIdAndDelete(id);
  }

  async recordPayment(
    feeId: string,
    tenant: string,
    paymentData: RecordPaymentData
  ): Promise<IFeeRecord> {
    // Find fee record
    const feeRecord = await FeeRecord.findOne({
      tenant,
      fee: feeId,
      student: paymentData.student,
    });

    if (!feeRecord) {
      throw new AppError("Fee record not found", 404);
    }

    if (feeRecord.status === "paid") {
      throw new AppError("Fee is already fully paid", 400);
    }

    // Calculate total payment amount
    const totalPaymentAmount = paymentData.payments.reduce(
      (sum, payment) => sum + payment.amountPaid,
      0
    );

    if (feeRecord.amountPaid + totalPaymentAmount > feeRecord.finalAmount) {
      throw new AppError("Payment amount exceeds balance amount", 400);
    }

    // Add payments
    feeRecord.payments.push(...(paymentData.payments as any));
    feeRecord.amountPaid += totalPaymentAmount;

    await feeRecord.save();

    return feeRecord.populate([
      {
        path: "student",
        select: "studentId",
        populate: { path: "user", select: "firstName lastName" },
      },
      { path: "fee", select: "feeStructure totalAmount dueDate" },
    ]);
  }

  async getAllFeeRecords(tenant: string, query: FeeRecordQuery) {
    const {
      page = 1,
      limit = 10,
      student,
      fee,
      status,
      dueDateFrom,
      dueDateTo,
      sortBy = "dueDate",
      sortOrder = "asc",
    } = query;

    const filter: any = { tenant };

    if (student) filter.student = student;
    if (fee) filter.fee = fee;
    if (status) filter.status = status;

    if (dueDateFrom || dueDateTo) {
      filter.dueDate = {};
      if (dueDateFrom) filter.dueDate.$gte = dueDateFrom;
      if (dueDateTo) filter.dueDate.$lte = dueDateTo;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [feeRecords, total] = await Promise.all([
      FeeRecord.find(filter)
        .populate([
          {
            path: "student",
            select: "studentId",
            populate: { path: "user", select: "firstName lastName" },
          },
          {
            path: "fee",
            select: "feeStructure totalAmount dueDate term",
            populate: { path: "class", select: "name section grade" },
          },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      FeeRecord.countDocuments(filter),
    ]);

    return {
      feeRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFeeReport(tenant: string, query: FeeReportQuery) {
    const {
      class: classId,
      academicYear,
      term,
      reportType = "summary",
    } = query;

    const filter: any = { tenant, academicYear };
    if (classId) filter.class = classId;
    if (term) filter.term = term;

    if (reportType === "summary") {
      const stats = await FeeRecord.aggregate([
        {
          $lookup: {
            from: "fees",
            localField: "fee",
            foreignField: "_id",
            as: "feeDetails",
          },
        },
        { $unwind: "$feeDetails" },
        { $match: { ...filter, "feeDetails.tenant": tenant } },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            totalAmount: { $sum: "$finalAmount" },
            totalCollected: { $sum: "$amountPaid" },
            totalPending: { $sum: "$balanceAmount" },
            paidCount: {
              $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
            },
            partialCount: {
              $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] },
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            overdueCount: {
              $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
            },
          },
        },
      ]);

      return (
        stats[0] || {
          totalStudents: 0,
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
          paidCount: 0,
          partialCount: 0,
          pendingCount: 0,
          overdueCount: 0,
        }
      );
    }

    if (reportType === "defaulters") {
      const defaulters = await FeeRecord.find({
        ...filter,
        status: { $in: ["overdue", "pending"] },
        dueDate: { $lt: new Date() },
      })
        .populate([
          {
            path: "student",
            select: "studentId",
            populate: { path: "user", select: "firstName lastName" },
          },
          {
            path: "fee",
            select: "feeStructure totalAmount dueDate",
            populate: { path: "class", select: "name section grade" },
          },
        ])
        .sort({ dueDate: 1 })
        .lean();

      return defaulters;
    }

    // Detailed report
    const feeRecords = await FeeRecord.find(filter)
      .populate([
        {
          path: "student",
          select: "studentId",
          populate: { path: "user", select: "firstName lastName" },
        },
        {
          path: "fee",
          select: "feeStructure totalAmount dueDate term",
          populate: { path: "class", select: "name section grade" },
        },
      ])
      .sort({ dueDate: 1 })
      .lean();

    return feeRecords;
  }

  async getFeeStats(tenant: string) {
    const stats = await FeeRecord.aggregate([
      { $match: { tenant } },
      {
        $group: {
          _id: null,
          totalFeeRecords: { $sum: 1 },
          totalAmount: { $sum: "$finalAmount" },
          totalCollected: { $sum: "$amountPaid" },
          totalPending: { $sum: "$balanceAmount" },
          collectionRate: {
            $avg: {
              $cond: [
                { $gt: ["$finalAmount", 0] },
                {
                  $multiply: [
                    { $divide: ["$amountPaid", "$finalAmount"] },
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
        totalFeeRecords: 0,
        totalAmount: 0,
        totalCollected: 0,
        totalPending: 0,
        collectionRate: 0,
      }
    );
  }
}

export default new FeeService();
