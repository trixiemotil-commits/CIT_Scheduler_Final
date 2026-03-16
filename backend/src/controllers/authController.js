const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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
    studentId: user.studentId,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    status: user.status,
    avatar: user.avatar,
    name: `${user.firstName} ${user.lastName}`.trim(),
  };
}

async function register(req, res) {
  try {

    const {
      firstName,
      lastName,
      studentId,
      email,
      password
    } = req.body;

    if (!firstName || !lastName || !studentId || !email || !password) {
      return res.status(400).json({ message: "Missing required registration fields." });
    }


    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { studentId: String(studentId).trim() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or Student ID already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Only allow student role via signup
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      studentId: String(studentId).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "student"
    });

    const token = signToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
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

module.exports = {
  register,
  login,
  me,
};
