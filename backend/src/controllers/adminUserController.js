const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { logActivity } = require("../utils/activityLogWriter");
const { notifyActiveAdmins, notifyActiveStudents } = require("../utils/adminNotification");

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

function getUserRoles(user) {
  return Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
}

function formatRoles(user) {
  return getUserRoles(user).map(formatRole).join(" & ");
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
    role: formatRoles(user),
    roles: getUserRoles(user),
    department: user.department || "",
    phone: user.phone || "",
    account_status: user.account_status || fallbackAccountStatus(user.role),
    teacher_status: user.teacher_status || (getUserRoles(user).includes("teacher") ? "On School" : ""),
    teacher_availability: user.teacher_availability || (getUserRoles(user).includes("teacher") ? "Available" : ""),
    teacher_time_in: user.teacher_time_in || null,
    teacher_clocked_out: Boolean(user.teacher_clocked_out),
    substituteTeacher: user.substituteTeacher || "",
    substituteAssignments: user.substituteAssignments ? Object.fromEntries(user.substituteAssignments) : {},
    status: user.account_status || fallbackAccountStatus(user.role),
    employeeId: user.employeeId || "",
    studentId: user.studentId || "",
    avatar: user.avatar,
    designatedAreas: Array.isArray(user.designatedAreas) ? user.designatedAreas : [],
    yearLevel: user.yearLevel || "",
    section: user.section || "",
    dateAdded: user.createdAt,
  };
}

function fallbackAccountStatus(role) {
  return role === "student" ? "Pending" : "Active";
}

function normalizeRole(role) {
  const value = (role || "").toString().toLowerCase();
  if (!ROLE_LABELS[value]) {
    throw new Error("Invalid role specified.");
  }
  return value;
}

function normalizeRoles(role, roles) {
  const values = Array.isArray(roles) && roles.length ? roles : [role];
  return [...new Set(values.map(normalizeRole))];
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPhinmaEmail(email) {
  return PHINMA_EMAIL_REGEX.test((email || "").trim());
}

async function verifyCurrentAdminPassword(req, res) {
  try {
    const { currentPassword } = req.body || {};
    if (!currentPassword) {
      return res.status(400).json({ message: "Current admin password is required." });
    }

    const actor = await User.findById(req.user?.id).select("+passwordHash");
    if (!actor) {
      return res.status(401).json({ message: "Active admin session not found." });
    }

    const passwordMatches = await bcrypt.compare(String(currentPassword), actor.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current admin password is incorrect." });
    }

    return res.json({ message: "Current admin password verified." });
  } catch (error) {
    console.error("Failed to verify admin password:", error);
    return res.status(500).json({ message: "Failed to verify admin password.", error: error.message });
  }
}

async function listUsers(req, res) {
  const { role } = req.query;
  const query = {};
  
  // Filter by role if provided (case-insensitive)
  if (role) {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'teacher' || normalizedRole === 'admin' || normalizedRole === 'student') {
      query.$or = [{ role: normalizedRole }, { roles: normalizedRole }];
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
      roles,
      password,
      currentPassword,
      phone = "",
      account_status = "Active",
      teacher_status = "On School",
      status,
      employeeId = "",
      studentId = "",
      yearLevel = "",
      section = "",
      avatar = null,
      designatedAreas = [],
    } = req.body;

    if (!firstName || !lastName || !email || !role || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "Your current password is required to add a user." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const actor = await User.findById(req.user?.id).select("+passwordHash");
    if (!actor) {
      return res.status(401).json({ message: "Active admin session not found." });
    }

    const passwordMatches = await bcrypt.compare(String(currentPassword), actor.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current admin password is incorrect." });
    }

    let normalizedRoles;
    try {
      normalizedRoles = normalizeRoles(role, roles);
    } catch (roleError) {
      return res.status(400).json({ message: roleError.message });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = normalizeString(employeeId);
    const normalizedStudentId = normalizeString(studentId);

    if (normalizedEmployeeId && normalizedRoles.includes("teacher") && !/^AU\d{4}-\d{4,5}$/.test(normalizedEmployeeId)) {
      return res.status(400).json({ message: "Employee ID must use the format AU2025-0000 or AU2025-00000." });
    }

    if (!isValidPhinmaEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with .au@phinmaed.com." });
    }

    if (normalizedRoles.includes("student") && !normalizedStudentId) {
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
      role: normalizedRoles[0],
      roles: normalizedRoles,
      passwordHash,
      department: DEFAULT_DEPARTMENT,
      designatedAreas: Array.isArray(designatedAreas)
        ? designatedAreas.map(normalizeString).filter(Boolean)
        : [],
      phone: normalizeString(phone),
      account_status: "Active",
      teacher_status: normalizedRoles.includes("teacher") ? sanitizeTeacherStatus(teacher_status) : undefined,
      employeeId: normalizedEmployeeId || undefined,
      studentId: normalizedStudentId || undefined,
      yearLevel: normalizedRoles.includes("student") ? normalizeString(yearLevel) : undefined,
      section: normalizedRoles.includes("student") ? normalizeString(section) : undefined,
      avatar: avatar || null,
    });

    await logActivity({
      actor: req.user,
      action: `Added ${normalizedRoles.join(" & ")} user ${user.firstName} ${user.lastName}`,
      path: req.originalUrl || "/api/users",
      method: req.method,
      req,
    });

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "account_created_admin",
        title: "User account created",
        message: `${user.firstName} ${user.lastName}'s ${normalizedRoles.join(" & ")} account was created.`,
        related: { userId: user._id.toString() },
        route: "/admin/users",
      });
    } catch (notificationError) {
      console.warn("User created, but admin notification failed:", notificationError.message);
    }

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
      roles,
      currentPassword,
      phone = "",
      account_status,
      teacher_status = "On School",
      substituteTeacher = "",
      status,
      employeeId = "",
      studentId = "",
      yearLevel = "",
      section = "",
      designatedAreas = [],
    } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "Your current password is required to save edits." });
    }

    const actor = await User.findById(req.user?.id).select("+passwordHash");
    if (!actor) {
      return res.status(401).json({ message: "Active admin session not found." });
    }

    const passwordMatches = await bcrypt.compare(String(currentPassword), actor.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Current admin password is incorrect." });
    }

    let normalizedRoles;
    try {
      normalizedRoles = normalizeRoles(role, roles);
    } catch (roleError) {
      return res.status(400).json({ message: roleError.message });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedEmployeeId = normalizeString(employeeId);
    const normalizedStudentId = normalizeString(studentId);

    if (normalizedEmployeeId && normalizedRoles.includes("teacher") && !/^AU\d{4}-\d{4,5}$/.test(normalizedEmployeeId)) {
      return res.status(400).json({ message: "Employee ID must use the format AU2025-0000 or AU2025-00000." });
    }

    if (!isValidPhinmaEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Email must end with .au@phinmaed.com." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const previousTeacherStatus = user.teacher_status;

    const emailOwner = await User.findOne({ email: normalizedEmail });
    if (emailOwner && emailOwner.id !== id) {
      return res.status(409).json({ message: "Email already exists." });
    }

    if (normalizedStudentId) {
      const studentOwner = await User.findOne({ studentId: normalizedStudentId });
      if (studentOwner && studentOwner.id !== id) {
        return res.status(409).json({ message: "Student ID already exists." });
      }
    } else if (normalizedRoles.includes("student")) {
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
    user.role = normalizedRoles[0];
    user.roles = normalizedRoles;
    user.department = DEFAULT_DEPARTMENT;
    if (Object.prototype.hasOwnProperty.call(req.body, "designatedAreas")) {
      user.designatedAreas = Array.isArray(req.body.designatedAreas)
        ? req.body.designatedAreas.map(normalizeString).filter(Boolean)
        : [];
    }
    user.phone = normalizeString(phone);
    const requestedStatus = normalizeString(account_status) || normalizeString(status);
    if (requestedStatus) {
      user.account_status = sanitizeAccountStatus(requestedStatus);
    }
    user.teacher_status = normalizedRoles.includes("teacher") ? sanitizeTeacherStatus(teacher_status) : undefined;
    user.substituteTeacher = normalizeString(substituteTeacher) || "";
    if (typeof req.body.substituteAssignments === 'object' && req.body.substituteAssignments !== null) {
      user.substituteAssignments = req.body.substituteAssignments;
    }
    user.employeeId = normalizedEmployeeId || undefined;

    if (normalizedStudentId) {
      user.studentId = normalizedStudentId;
      user.yearLevel = normalizeString(yearLevel);
      user.section = normalizeString(section);
    } else {
      user.studentId = undefined;
      user.yearLevel = undefined;
      user.section = "";
    }

    await user.save();

    await logActivity({
      actor: req.user,
      action: normalizedRoles.includes("teacher") && String(previousTeacherStatus || "") !== String(user.teacher_status || "")
        ? `Teacher ${user.firstName} ${user.lastName} is ${user.teacher_status}`
        : `Updated ${normalizedRoles.join(" & ")} account for ${user.firstName} ${user.lastName}`,
      path: req.originalUrl || `/api/users/${id}`,
      method: req.method,
      req,
    });

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "account_updated_admin",
        title: "User account updated",
        message: `${user.firstName} ${user.lastName}'s account details were updated.`,
        related: { userId: user._id.toString() },
        route: "/admin/users",
      });
    } catch (notificationError) {
      console.warn("User updated, but admin notification failed:", notificationError.message);
    }

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

    await logActivity({
      actor: req.user,
      action: nextStatus === "Archived"
        ? `Archived user ${user.firstName} ${user.lastName}`
        : nextStatus === "Active"
          ? `Approved user ${user.firstName} ${user.lastName}`
          : `Changed status to ${nextStatus}: user ${user.firstName} ${user.lastName}`,
      path: req.originalUrl || `/api/users/${id}/status`,
      method: req.method,
      req,
    });

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "account_status_admin",
        title: `Account ${nextStatus.toLowerCase()}`,
        message: `${user.firstName} ${user.lastName}'s account is now ${nextStatus}.`,
        related: { userId: user._id.toString(), status: nextStatus },
        route: "/admin/users",
      });
    } catch (notificationError) {
      console.warn("User status updated, but admin notification failed:", notificationError.message);
    }

    return res.json({ message: "User status updated.", user: toClientUser(user) });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return res.status(500).json({ message: "Failed to update user status.", error: error.message });
  }
}

async function updateTeacherStatus(req, res) {
  try {
    const { id } = req.params;
    const nextStatus = sanitizeTeacherStatus(req.body?.teacher_status || req.body?.status);
    const user = await User.findById(id);

    if (!user || !(getUserRoles(user).includes("teacher"))) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    user.teacher_status = nextStatus;
    user.teacher_clocked_out = false;
    await user.save();

    await logActivity({
      actor: req.user,
      action: `Teacher ${user.firstName} ${user.lastName} is ${nextStatus}`,
      path: req.originalUrl || `/api/users/${id}/teacher-status`,
      method: req.method,
      req,
    });

    try {
      const teacherName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      await notifyActiveStudents({
        actorId: req.user?.id,
        type: "teacher_status",
        title: `Teacher ${nextStatus}`,
        message: `${teacherName} is now ${nextStatus}.`,
        related: { teacherId: user._id.toString(), status: nextStatus },
        route: "/student/teachers",
      });
    } catch (notificationError) {
      console.warn("Teacher status updated, but student notification failed:", notificationError.message);
    }

    return res.json({ message: "Teacher status updated.", user: toClientUser(user) });
  } catch (error) {
    console.error("Failed to update teacher status:", error);
    return res.status(500).json({ message: "Failed to update teacher status.", error: error.message });
  }
}

async function approveAllPendingUsers(req, res) {
  try {
    const result = await User.updateMany(
      { account_status: "Pending" },
      { $set: { account_status: "Active" } }
    );

    await logActivity({
      actor: req.user,
      action: `Approved ${result.modifiedCount || 0} pending user account(s)`,
      path: req.originalUrl || "/api/users/approve-pending",
      method: req.method,
      req,
    });

    try {
      await notifyActiveAdmins({
        actorId: req.user?.id,
        type: "accounts_approved_admin",
        title: "Pending accounts approved",
        message: `${result.modifiedCount || 0} pending account(s) were approved.`,
        related: { updatedCount: result.modifiedCount || 0 },
        route: "/admin/users",
      });
    } catch (notificationError) {
      console.warn("Accounts approved, but admin notification failed:", notificationError.message);
    }

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
  verifyCurrentAdminPassword,
  createUser,
  updateUser,
  updateUserStatus,
  updateTeacherStatus,
  approveAllPendingUsers,
};
