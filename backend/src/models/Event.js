const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: String,
      trim: true,
      default: "",
    },
    time: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    teacherIds: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    createdBy: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, date: 1, createdAt: -1 });

module.exports = mongoose.model("Event", eventSchema);
