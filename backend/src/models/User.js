const mongoose = require("mongoose");

const ACCOUNT_STATUS_VALUES = ["Pending", "Active", "Inactive", "Denied", "Archived"];
const TEACHER_STATUS_VALUES = ["On School", "On Meeting", "On Leave"];

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
    employeeId: {
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
    account_status: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: "Pending",
    },
    teacher_status: {
      type: String,
      enum: TEACHER_STATUS_VALUES,
      default: undefined,
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

userSchema.pre("validate", function onValidate() {
  if (this.role === "teacher") {
    if (!this.teacher_status) {
      this.teacher_status = "On School";
    }
  } else {
    this.teacher_status = undefined;
  }
});

module.exports = mongoose.model("User", userSchema);
