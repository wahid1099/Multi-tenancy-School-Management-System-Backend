import mongoose, { Document, Schema } from "mongoose";

export interface IFeeStructure {
  name: string;
  amount: number;
  dueDate: Date;
  isOptional: boolean;
}

export interface IFeePayment {
  student: mongoose.Types.ObjectId;
  feeStructure: mongoose.Types.ObjectId;
  amountPaid: number;
  paymentDate: Date;
  paymentMethod: "cash" | "card" | "bank_transfer" | "cheque" | "online";
  transactionId?: string;
  receiptNumber: string;
  remarks?: string;
  status: "pending" | "completed" | "failed" | "refunded";
}

export interface IFee extends Document {
  tenant: string;
  class: mongoose.Types.ObjectId;
  academicYear: string;
  term: "first" | "second" | "third" | "annual";
  feeStructure: IFeeStructure[];
  totalAmount: number;
  dueDate: Date;
  lateFeePenalty: number;
  lateFeeAfterDays: number;
  discounts: {
    name: string;
    type: "percentage" | "fixed";
    value: number;
    applicableFor: mongoose.Types.ObjectId[];
  }[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeRecord extends Document {
  tenant: string;
  student: mongoose.Types.ObjectId;
  fee: mongoose.Types.ObjectId;
  totalAmount: number;
  discountApplied: number;
  finalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: "pending" | "partial" | "paid" | "overdue";
  dueDate: Date;
  payments: IFeePayment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    name: {
      type: String,
      required: [true, "Fee name is required"],
      trim: true,
      maxlength: [100, "Fee name cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const discountSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Discount name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    applicableFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { _id: false }
);

const feeSchema = new Schema<IFee>(
  {
    tenant: {
      type: String,
      required: [true, "Fee must belong to a tenant"],
      index: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      match: [/^\d{4}-\d{4}$/, "Academic year format should be YYYY-YYYY"],
    },
    term: {
      type: String,
      enum: ["first", "second", "third", "annual"],
      required: [true, "Term is required"],
    },
    feeStructure: [feeStructureSchema],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    lateFeePenalty: {
      type: Number,
      default: 0,
      min: [0, "Late fee penalty cannot be negative"],
    },
    lateFeeAfterDays: {
      type: Number,
      default: 30,
      min: [1, "Late fee after days must be at least 1"],
    },
    discounts: [discountSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const feePaymentSchema = new Schema<IFeePayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    feeStructure: {
      type: Schema.Types.ObjectId,
      required: [true, "Fee structure is required"],
    },
    amountPaid: {
      type: Number,
      required: [true, "Amount paid is required"],
      min: [0, "Amount paid cannot be negative"],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "cheque", "online"],
      required: [true, "Payment method is required"],
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      required: [true, "Receipt number is required"],
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [200, "Remarks cannot exceed 200 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
  },
  { _id: false }
);

const feeRecordSchema = new Schema<IFeeRecord>(
  {
    tenant: {
      type: String,
      required: [true, "Fee record must belong to a tenant"],
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    fee: {
      type: Schema.Types.ObjectId,
      ref: "Fee",
      required: [true, "Fee is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    discountApplied: {
      type: Number,
      default: 0,
      min: [0, "Discount applied cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: [true, "Final amount is required"],
      min: [0, "Final amount cannot be negative"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: [0, "Balance amount cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    payments: [feePaymentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
feeSchema.index(
  { tenant: 1, class: 1, academicYear: 1, term: 1 },
  { unique: true }
);
feeSchema.index({ dueDate: 1 });
feeSchema.index({ isActive: 1 });

feeRecordSchema.index({ tenant: 1, student: 1, fee: 1 }, { unique: true });
feeRecordSchema.index({ tenant: 1, status: 1 });
feeRecordSchema.index({ dueDate: 1 });

// Pre-save middleware to calculate total amount
feeSchema.pre<IFee>("save", function (next) {
  if (this.feeStructure.length > 0) {
    this.totalAmount = this.feeStructure.reduce(
      (sum: number, fee: IFeeStructure) => sum + fee.amount,
      0
    );
  }
  next();
});

// Pre-save middleware to calculate balance amount and status
feeRecordSchema.pre<IFeeRecord>("save", function (next) {
  this.balanceAmount = this.finalAmount - this.amountPaid;

  if (this.amountPaid === 0) {
    this.status = new Date() > this.dueDate ? "overdue" : "pending";
  } else if (this.amountPaid < this.finalAmount) {
    this.status = "partial";
  } else {
    this.status = "paid";
  }

  next();
});

export const Fee = mongoose.model<IFee>("Fee", feeSchema);
export const FeeRecord = mongoose.model<IFeeRecord>(
  "FeeRecord",
  feeRecordSchema
);
