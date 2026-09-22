const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization token." });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("authSessionInvalidatedAt").lean();
    const invalidatedAt = user?.authSessionInvalidatedAt ? new Date(user.authSessionInvalidatedAt).getTime() : 0;
    if (invalidatedAt && payload.iat && payload.iat * 1000 <= invalidatedAt) {
      return res.status(401).json({ message: "Your session ended because a new academic term was published. Please log in again." });
    }
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token is invalid or expired." });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }

    return next();
  };
}

module.exports = {
  authRequired,
  authorizeRoles,
};
