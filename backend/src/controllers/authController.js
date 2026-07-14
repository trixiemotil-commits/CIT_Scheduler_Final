const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendPasswordOtpEmail } = require("../config/mail");

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const PASSWORD_OTP_LIFETIME_MS = 60 * 1000;
const PASSWORD_OTP_RESEND_DELAY_MS = 60 * 1000;
const PASSWORD_OTP_MAX_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function toSafeUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeId: user.employeeId || user.studentId,
    studentId: user.studentId,
    email: user.email,
    role: user.role,
    department: user.department,
    yearLevel: user.yearLevel,
    section: user.section,
    phone: user.phone,
    gender: user.gender,
    account_status: user.account_status,
    teacher_status: user.teacher_status,
    status: user.account_status,
    avatar: user.avatar,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
}

function isStrongPassword(password) {
  return STRONG_PASSWORD_REGEX.test(String(password || ""));
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function clearPasswordOtp(user) {
  user.passwordOtpHash = null;
  user.passwordOtpExpiresAt = null;
  user.passwordOtpLastSentAt = null;
  user.passwordOtpAttempts = 0;
}

function maskEmail(email) {
  const [local = "", domain = ""] = String(email).split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function getAccountStatusMessage(status) {
  const normalized = String(status || "");
  if (normalized === "Pending") {
    return "Your account is pending approval. Please wait for admin approval before logging in.";
  }
  if (normalized === "Denied") {
    return "Your account registration was denied. Please contact the administrator.";
  }
  if (normalized === "Archived") {
    return "Your account is archived. Please contact the administrator.";
  }
  return "Your account is currently inactive. Please contact the administrator.";
}

async function register(req, res) {
  try {

    const {
      firstName,
      lastName,
      studentId,
      registeredId,
      email,
      password
    } = req.body || {};

    const normalizedFirstName = normalizeString(firstName);
    const normalizedLastName = normalizeString(lastName);
    const normalizedEmail = normalizeString(email).toLowerCase();
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedStudentId = normalizeString(studentId) || normalizeString(registeredId);

    if (!normalizedFirstName || !normalizedLastName || !normalizedStudentId || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Missing required registration fields." });
    }


    if (!isStrongPassword(normalizedPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { studentId: normalizedStudentId }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or Student ID already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Only allow student role via signup
    const user = await User.create({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      studentId: normalizedStudentId,
      email: normalizedEmail,
      passwordHash,
      role: "student",
      account_status: "Pending",
    });

    return res.status(201).json({
      message: "Account created successfully and is pending approval.",
      user: toSafeUser(user),
    });
  } catch (error) {
    // Enhanced error logging for debugging registration failures
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });

    // Automatically clean up the stale registeredId index the first time we hit it.
    if (error?.code === 11000 && error?.message?.includes('registeredId_1')) {
      try {
        await User.collection.dropIndex('registeredId_1');
        console.warn('Dropped stale index registeredId_1 after duplicate key error.');
      } catch (dropError) {
        // Ignore cases where the index (or collection) is already gone.
        const ignoreCodes = ['IndexNotFound', 'NamespaceNotFound'];
        if (!ignoreCodes.includes(dropError.codeName) && ![26, 27].includes(dropError.code)) {
          console.error('Failed to drop registeredId_1 index:', dropError);
        }
      }

      return res.status(503).json({ message: 'Detected and removed a stale index. Please retry registration.' });
    }

    res.status(400).json({ message: error.message, details: error.stack });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.account_status !== "Active") {
      return res.status(403).json({ message: getAccountStatusMessage(user.account_status) });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user profile.", error: error.message });
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function updateMe(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const firstName = normalizeString(req.body.firstName) || user.firstName;
    const lastName = normalizeString(req.body.lastName) || user.lastName;
    const email = normalizeString(req.body.email).toLowerCase() || user.email;
    const phone = normalizeString(req.body.phone);
    const employeeId = normalizeString(req.body.employeeId);
    const studentId = normalizeString(req.body.studentId);
    const yearLevel = normalizeString(req.body.yearLevel);
    const section = normalizeString(req.body.section);
    const avatar = normalizeString(req.body.avatar);
    const gender = normalizeString(req.body.gender);

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "First name, last name, and email are required." });
    }

    const emailOwner = await User.findOne({ email });
    if (emailOwner && emailOwner._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "Email already exists." });
    }

    if (employeeId) {
      if (!/^\d{2}-\d{4}-\d{6}$/.test(employeeId)) {
        return res.status(400).json({ message: "Employee ID must use the format 00-0000-000000." });
      }
      const idOwner = await User.findOne({ employeeId });
      if (idOwner && idOwner._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: "Employee ID already exists." });
      }
    }

    if (studentId) {
      const idOwner = await User.findOne({ studentId });
      if (idOwner && idOwner._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: "Student ID already exists." });
      }
    }

    if (yearLevel && !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(yearLevel)) {
      return res.status(400).json({ message: "Invalid year level." });
    }

    if (gender && !["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender." });
    }

    if (avatar && !avatar.startsWith("data:image/") && !/^https?:\/\//i.test(avatar)) {
      return res.status(400).json({ message: "Avatar must be a valid image URL or data URL." });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phone = phone;
    user.gender = gender || undefined;
    user.employeeId = employeeId || undefined;
    if (user.role === "student") {
      if (studentId) {
        user.studentId = studentId;
      }
      user.yearLevel = yearLevel || user.yearLevel || "";
      user.section = section || user.section || "";
    }
    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({ message: "Profile updated successfully.", user: toSafeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update profile.", error: error.message });
  }
}

async function requestPasswordOtp(req, res) {
  try {
    const { currentPassword } = req.body || {};
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const now = new Date();
    if (user.passwordOtpLastSentAt && now - user.passwordOtpLastSentAt < PASSWORD_OTP_RESEND_DELAY_MS) {
      return res.status(429).json({ message: "Please wait one minute before requesting another code." });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    user.passwordOtpHash = hashOtp(code);
    user.passwordOtpExpiresAt = new Date(now.getTime() + PASSWORD_OTP_LIFETIME_MS);
    user.passwordOtpLastSentAt = now;
    user.passwordOtpAttempts = 0;
    await user.save();

    try {
      await sendPasswordOtpEmail({ to: user.email, code });
    } catch (mailError) {
      clearPasswordOtp(user);
      await user.save();
      console.error("Password OTP email failed:", mailError.message);
      if (mailError.code === "MAIL_NOT_CONFIGURED") {
        return res.status(503).json({ message: mailError.message });
      }
      return res.status(503).json({ message: "Unable to send the OTP email. Please try again later." });
    }

    return res.status(200).json({ message: `OTP sent to ${maskEmail(user.email)}.` });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP.", error: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, otp } = req.body || {};

    if (!currentPassword || !newPassword || !otp) {
      return res.status(400).json({ message: "Current password, OTP, and new password are required." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const matches = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    if (!/^\d{6}$/.test(String(otp)) || !user.passwordOtpHash || !user.passwordOtpExpiresAt) {
      return res.status(400).json({ message: "Request a new OTP and enter the 6-digit code." });
    }

    if (user.passwordOtpExpiresAt < new Date()) {
      clearPasswordOtp(user);
      await user.save();
      return res.status(400).json({ message: "This OTP has expired. Request a new one." });
    }

    const enteredOtpHash = hashOtp(String(otp));
    const otpMatches = crypto.timingSafeEqual(
      Buffer.from(enteredOtpHash, "hex"),
      Buffer.from(user.passwordOtpHash, "hex")
    );
    if (!otpMatches) {
      user.passwordOtpAttempts += 1;
      if (user.passwordOtpAttempts >= PASSWORD_OTP_MAX_ATTEMPTS) {
        clearPasswordOtp(user);
        await user.save();
        return res.status(429).json({ message: "Too many incorrect codes. Request a new OTP." });
      }
      await user.save();
      return res.status(401).json({ message: "The OTP is incorrect." });
    }

    const sameAsCurrent = await bcrypt.compare(String(newPassword), user.passwordHash);
    if (sameAsCurrent) {
      return res.status(400).json({ message: "New password must be different from your current password." });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    clearPasswordOtp(user);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password.", error: error.message });
  }
}

module.exports = {
  register,
  login,
  me,
  updateMe,
  requestPasswordOtp,
  changePassword,
};
