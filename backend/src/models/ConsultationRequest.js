const mongoose = require("mongoose");

const STATUS_VALUES = ["PENDING", "APPROVED", "RESCHED", "COMPLETED", "CANCELLED"];

const consultationRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      trim: true,
    },
    availabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsultationAvailability",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
      default: "",
    },
    requestDate: {
      type: Date,
      required: true,
      index: true,
    },
    consultationDate: {
      type: Date,
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

consultationRequestSchema.index({ studentId: 1, employeeId: 1, requestDate: 1 });
consultationRequestSchema.index({ employeeId: 1, consultationDate: 1 });

module.exports = mongoose.model("ConsultationRequest", consultationRequestSchema);
