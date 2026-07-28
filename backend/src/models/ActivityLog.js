const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, trim: true, default: "" },
    actorRole: { type: String, enum: ["teacher", "student"], required: true, index: true },
    action: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    method: { type: String, required: true, trim: true },
    ipAddress: { type: String, trim: true, default: "" },
    device: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
