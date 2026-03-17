const mongoose = require("mongoose");

const YEAR_VALUES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const scheduleTableSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      enum: YEAR_VALUES,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduleTableSchema.index({ year: 1, label: 1 }, { unique: true });

module.exports = mongoose.model("ScheduleTable", scheduleTableSchema);
