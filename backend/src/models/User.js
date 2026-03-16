const mongoose = require("mongoose");

const STATUS_VALUES = ["Active", "Inactive", "Archived"];

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: "Active",
    },
    avatar: {
      type: String,
      default: null,
    },
    registeredId: {
      type: String,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toHexString(),
    },
  },
  {
    timestamps: true,
  }
);

userSchema.path("studentId").validate(function (value) {
  if (this.role === "student") {
    return Boolean(value && value.trim());
  }
  return true;
}, "Student ID is required for student accounts.");

module.exports = mongoose.model("User", userSchema);
