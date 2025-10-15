import mongoose, { Document, Schema } from "mongoose";

export interface ITimeSlot {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  startTime: string;
  endTime: string;
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  room?: string;
  type: "lecture" | "lab" | "tutorial" | "break" | "assembly";
}

export interface ITimetable extends Document {
  tenant: string;
  class: mongoose.Types.ObjectId;
  academicYear: string;
  term: "first" | "second" | "third" | "annual";
  effectiveFrom: Date;
  effectiveTo: Date;
  timeSlots: ITimeSlot[];
  breakTimes: {
    name: string;
    startTime: string;
    endTime: string;
    days: string[];
  }[];
  workingDays: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    day: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      required: [true, "Day is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher is required"],
    },
    room: {
      type: String,
      trim: true,
      maxlength: [50, "Room cannot exceed 50 characters"],
    },
    type: {
      type: String,
      enum: ["lecture", "lab", "tutorial", "break", "assembly"],
      default: "lecture",
    },
  },
  { _id: false }
);

const breakTimeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Break name is required"],
      trim: true,
      maxlength: [50, "Break name cannot exceed 50 characters"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)",
      ],
    },
    days: [
      {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    ],
  },
  { _id: false }
);

const timetableSchema = new Schema<ITimetable>(
  {
    tenant: {
      type: String,
      required: [true, "Timetable must belong to a tenant"],
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
    effectiveFrom: {
      type: Date,
      required: [true, "Effective from date is required"],
    },
    effectiveTo: {
      type: Date,
      required: [true, "Effective to date is required"],
    },
    timeSlots: [timeSlotSchema],
    breakTimes: [breakTimeSchema],
    workingDays: [
      {
        type: String,
        enum: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    ],
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

// Indexes
timetableSchema.index(
  { tenant: 1, class: 1, academicYear: 1, term: 1 },
  { unique: true }
);
timetableSchema.index({ tenant: 1, effectiveFrom: 1, effectiveTo: 1 });
timetableSchema.index({ isActive: 1 });

// Virtual for total periods per day
timetableSchema.virtual("periodsPerDay").get(function () {
  const dayWisePeriods: { [key: string]: number } = {};

  this.timeSlots.forEach((slot) => {
    if (slot.type !== "break") {
      dayWisePeriods[slot.day] = (dayWisePeriods[slot.day] || 0) + 1;
    }
  });

  return dayWisePeriods;
});

// Pre-save middleware to validate dates and time conflicts
timetableSchema.pre<ITimetable>("save", function (next) {
  if (this.effectiveFrom >= this.effectiveTo) {
    next(new Error("Effective to date must be after effective from date"));
  }

  // Check for time conflicts within the same day
  const daySlots: { [key: string]: ITimeSlot[] } = {};

  this.timeSlots.forEach((slot: ITimeSlot) => {
    if (!daySlots[slot.day]) {
      daySlots[slot.day] = [];
    }
    daySlots[slot.day].push(slot);
  });

  // Check for overlapping time slots
  for (const day in daySlots) {
    const slots = daySlots[day].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < slots.length - 1; i++) {
      if (slots[i].endTime > slots[i + 1].startTime) {
        next(
          new Error(
            `Time conflict detected on ${day} between ${slots[i].startTime}-${
              slots[i].endTime
            } and ${slots[i + 1].startTime}-${slots[i + 1].endTime}`
          )
        );
      }
    }
  }

  next();
});

export const Timetable = mongoose.model<ITimetable>(
  "Timetable",
  timetableSchema
);
