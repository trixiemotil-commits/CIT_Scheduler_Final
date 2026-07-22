const mongoose = require("mongoose");

const ACCOUNT_STATUS_VALUES = ["Pending", "Active", "Inactive", "Denied", "Archived"];
const TEACHER_STATUS_VALUES = ["On School", "On Meeting", "On Leave"];
const TEACHER_AVAILABILITY_VALUES = ["Available", "Unavailable"];
const YEAR_LEVEL_VALUES = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

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
    passwordOtpHash: {
      type: String,
      default: null,
    },
    passwordOtpExpiresAt: {
      type: Date,
      default: null,
    },
    passwordOtpLastSentAt: {
      type: Date,
      default: null,
    },
    passwordOtpAttempts: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    // A user can hold more than one role (for example, a Dean who also teaches).
    // `role` remains as the primary/legacy role for backwards compatibility.
    roles: {
      type: [{ type: String, enum: ["admin", "teacher", "student"] }],
      default: undefined,
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    yearLevel: {
      type: String,
      enum: YEAR_LEVEL_VALUES,
      default: undefined,
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: undefined,
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
    teacher_availability: {
      type: String,
      enum: TEACHER_AVAILABILITY_VALUES,
      default: undefined,
    },
    teacher_time_in: {
      type: Date,
      default: null,
    },
    teacher_status_expires_at: {
      type: Date,
      default: null,
    },
    substituteTeacher: {
      type: String,
      trim: true,
      default: "",
    },
    substituteAssignments: {
      type: Map,
      of: String,
      default: {},
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
  const roles = this.roles?.length ? this.roles : [this.role];
  if (roles.includes("student")) {
    return Boolean(value && value.trim());
  }
  return true;
}, "Student ID is required for student accounts.");

userSchema.pre("validate", function onValidate() {
  const roles = this.roles?.length ? this.roles : [this.role];
  if (roles.includes("teacher")) {
    if (!this.teacher_status) {
      this.teacher_status = "On School";
    }
    if (!this.teacher_availability) {
      this.teacher_availability = "Available";
    }
  } else {
    this.teacher_status = undefined;
    this.teacher_availability = undefined;
    this.teacher_time_in = null;
  }
});

module.exports = mongoose.model("User", userSchema);
