const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ROLE_LABELS = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

const ACCOUNT_STATUS_VALUES = ["Pending", "Active", "Inactive", "Denied", "Archived"];
const TEACHER_STATUS_VALUES = ["On School", "On Meeting", "On Leave"];
const DEFAULT_DEPARTMENT = "College of Information Technology";
const PHINMA_EMAIL_REGEX = /^[a-z0-9._%+-]+\.au@phinmaed\.com$/i;

function formatRole(role) {
  return ROLE_LABELS[role] || role;
}

function sanitizeAccountStatus(status) {
  if (ACCOUNT_STATUS_VALUES.includes(status)) {
    return status;
  }
  return "Active";
}

function sanitizeTeacherStatus(status) {
  if (TEACHER_STATUS_VALUES.includes(status)) {
    return status;
  }
  return "On School";
}

function toClientUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: formatRole(user.role),
    department: user.department || "",
    phone: user.phone || "",
    account_status: user.account_status || fallbackAccountStatus(user.role),
    teacher_status: user.teacher_status || (user.role === "teacher" ? "On School" : ""),
    status: user.account_status || fallbackAccountStatus(user.role),
    employeeId: user.employeeId || "",
    studentId: user.studentId || "",
    avatar: user.avatar,
    dateAdded: user.createdAt,
  };

function fallbackAccountStatus(role) {
  return role === "student" ? "Pending" : "Active";
}
}

function normalizeRole(role) {
  const value = (role || "").toString().toLowerCase();
  if (!ROLE_LABELS[value]) {
    throw new Error("Invalid role specified.");
  }
  return value;
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPhinmaEmail(email) {
  return PHINMA_EMAIL_REGEX.test((email || "").trim());
}

async function listUsers(req, res) {
  const { role } = req.query;
  const query = {};
  
  // Filter by role if provided (case-insensitive)
  if (role) {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'teacher' || normalizedRole === 'admin' || normalizedRole === 'student') {
      query.role = normalizedRole;
    }
  }
  
  const users = await User.find(query).sort({ createdAt: -1 });
  return res.json({ users: users.map(toClientUser) });
}

async function createUser(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      password,
      phone = "",
      account_status = "Active",
      teacher_status = "On School",
      status,
      employeeId = "",
      studentId = "",
      avatar = null,
    } = req.body;

    if (!firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    let normalizedRole;
    try {
      normalizedRole = normalizeRole(role);
    } catch (roleError) {
      return res.status(400).json({ message: roleError.message });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = normalizeString(employeeId);
    const normalizedStudentId = normalizeString(studentId);

    if (!isValidPhinmaEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with .au@phinmaed.com." });
    }

    if (normalizedRole === "student" && !normalizedStudentId) {
      return res.status(400).json({ message: "Student ID is required for student accounts." });
    }

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists." });
    }

    if (normalizedStudentId) {
      const existingStudent = await User.findOne({ studentId: normalizedStudentId });
      if (existingStudent) {
        return res.status(409).json({ message: "Student ID already exists." });
      }
    }

    if (normalizedEmployeeId) {
      const existingEmployee = await User.findOne({ employeeId: normalizedEmployeeId });
      if (existingEmployee) {
        return res.status(409).json({ message: "Employee ID already exists." });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: normalizeString(firstName),
      lastName: normalizeString(lastName),
      email: normalizedEmail,
      role: normalizedRole,
      passwordHash,
      department: DEFAULT_DEPARTMENT,
      phone: normalizeString(phone),
      account_status: "Active",
      teacher_status: normalizedRole === "teacher" ? sanitizeTeacherStatus(teacher_status) : undefined,
      employeeId: normalizedEmployeeId || undefined,
      studentId: normalizedStudentId || undefined,
      avatar: avatar || null,
    });

    return res.status(201).json({ message: "User created.", user: toClientUser(user) });
  } catch (error) {
    console.error("Failed to create user:", error);
    return res.status(500).json({ message: "Failed to create user.", error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      phone = "",
      account_status,
      teacher_status = "On School",
      status,
      employeeId = "",
      studentId = "",
    } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let normalizedRole;
    try {
      normalizedRole = normalizeRole(role);
    } catch (roleError) {
      return res.status(400).json({ message: roleError.message });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = normalizeString(employeeId);
    const normalizedStudentId = normalizeString(studentId);

    if (!isValidPhinmaEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with .au@phinmaed.com." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const emailOwner = await User.findOne({ email: normalizedEmail });
    if (emailOwner && emailOwner.id !== id) {
      return res.status(409).json({ message: "Email already exists." });
    }

    if (normalizedStudentId) {
      const studentOwner = await User.findOne({ studentId: normalizedStudentId });
      if (studentOwner && studentOwner.id !== id) {
        return res.status(409).json({ message: "Student ID already exists." });
      }
    } else if (normalizedRole === "student") {
      return res.status(400).json({ message: "Student ID is required for student accounts." });
    }

    if (normalizedEmployeeId) {
      const employeeOwner = await User.findOne({ employeeId: normalizedEmployeeId });
      if (employeeOwner && employeeOwner.id !== id) {
        return res.status(409).json({ message: "Employee ID already exists." });
      }
    }

    user.firstName = normalizeString(firstName);
    user.lastName = normalizeString(lastName);
    user.email = normalizedEmail;
    user.role = normalizedRole;
    user.department = DEFAULT_DEPARTMENT;
    user.phone = normalizeString(phone);
    const requestedStatus = normalizeString(account_status) || normalizeString(status);
    if (requestedStatus) {
      user.account_status = sanitizeAccountStatus(requestedStatus);
    }
    user.teacher_status = normalizedRole === "teacher" ? sanitizeTeacherStatus(teacher_status) : undefined;
    user.employeeId = normalizedEmployeeId || undefined;

    if (normalizedStudentId) {
      user.studentId = normalizedStudentId;
    } else {
      user.studentId = undefined;
    }

    await user.save();

    return res.json({ message: "User updated.", user: toClientUser(user) });
  } catch (error) {
    console.error("Failed to update user:", error);
    return res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const rawStatus = normalizeString(status);

    if (!ACCOUNT_STATUS_VALUES.includes(rawStatus)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const nextStatus = sanitizeAccountStatus(rawStatus);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.account_status = nextStatus;
    await user.save();

    return res.json({ message: "User status updated.", user: toClientUser(user) });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return res.status(500).json({ message: "Failed to update user status.", error: error.message });
  }
}

async function approveAllPendingUsers(req, res) {
  try {
    const result = await User.updateMany(
      { account_status: "Pending" },
      { $set: { account_status: "Active" } }
    );

    return res.json({
      message: "Pending users approved.",
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Failed to approve pending users:", error);
    return res.status(500).json({ message: "Failed to approve pending users.", error: error.message });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  updateUserStatus,
  approveAllPendingUsers,
};
