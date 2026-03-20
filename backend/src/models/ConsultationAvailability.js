const mongoose = require("mongoose");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const consultationAvailabilitySchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: String,
      required: true,
      trim: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: DAYS,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One slot per teacher per day (no double-booking same day)
consultationAvailabilitySchema.index({ employeeId: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model("ConsultationAvailability", consultationAvailabilitySchema);
