const mongoose = require("mongoose");

const DAY_VALUES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const YEAR_VALUES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const parallelSlotSchema = new mongoose.Schema(
  {
    section: { type: String, trim: true, required: true },
    room: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const scheduleEntrySchema = new mongoose.Schema(
  {
    tableLabel: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      enum: YEAR_VALUES,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String,
      enum: DAY_VALUES,
      required: true,
      trim: true,
    },
    timeIn: {
      type: String,
      required: true,
      trim: true,
    },
    timeOut: {
      type: String,
      required: true,
      trim: true,
    },
    timeInMinutes: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
    },
    timeOutMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },
    teacher: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    parallel: {
      type: Boolean,
      default: false,
    },
    parallelGroupId: {
      type: String,
      trim: true,
      default: null,
    },
    parallelCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },
    parallelSlots: {
      type: [parallelSlotSchema],
      default: [],
    },
    color: {
      type: String,
      trim: true,
      default: "color-green",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

scheduleEntrySchema.index({ tableLabel: 1, day: 1, section: 1, timeInMinutes: 1, timeOutMinutes: 1 });
scheduleEntrySchema.index({ tableLabel: 1, parallelGroupId: 1 });

module.exports = mongoose.model("ScheduleEntry", scheduleEntrySchema);
