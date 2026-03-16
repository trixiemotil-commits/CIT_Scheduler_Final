const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ROLE_LABELS = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

const STATUS_VALUES = ["Active", "Inactive", "Archived"];

function formatRole(role) {
  return ROLE_LABELS[role] || role;
}

function sanitizeStatus(status) {
  if (STATUS_VALUES.includes(status)) {
    return status;
  }
  return "Active";
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
    status: user.status || "Active",
    studentId: user.studentId || "",
    avatar: user.avatar,
    dateAdded: user.createdAt,
  };
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

async function listUsers(_req, res) {
  const users = await User.find().sort({ createdAt: -1 });
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
      department = "",
      phone = "",
      status = "Active",
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
    const normalizedStudentId = normalizeString(studentId);

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

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: normalizeString(firstName),
      lastName: normalizeString(lastName),
      email: normalizedEmail,
      role: normalizedRole,
      passwordHash,
      department: normalizeString(department),
      phone: normalizeString(phone),
      status: sanitizeStatus(status),
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
      department = "",
      phone = "",
      status = "Active",
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
    const normalizedStudentId = normalizeString(studentId);

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

    user.firstName = normalizeString(firstName);
    user.lastName = normalizeString(lastName);
    user.email = normalizedEmail;
    user.role = normalizedRole;
    user.department = normalizeString(department);
    user.phone = normalizeString(phone);
    user.status = sanitizeStatus(status);

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

module.exports = {
  listUsers,
  createUser,
  updateUser,
};
