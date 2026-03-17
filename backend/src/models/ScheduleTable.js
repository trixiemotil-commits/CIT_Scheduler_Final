const mongoose = require("mongoose");

const scheduleTableSchema = new mongoose.Schema(
  {
    teacher: {
      type: String,
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

scheduleTableSchema.index({ teacher: 1, label: 1 }, { unique: true });

module.exports = mongoose.model("ScheduleTable", scheduleTableSchema);
