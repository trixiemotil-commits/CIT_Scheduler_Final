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
    const user = await User.findById(payload.id).select("authSessionInvalidatedAt activeSessions passwordResetRequired").lean();
    if (!user) {
      return res.status(401).json({ message: "Account not found." });
    }
    const invalidatedAt = user?.authSessionInvalidatedAt ? new Date(user.authSessionInvalidatedAt).getTime() : 0;
    if (invalidatedAt && payload.iat && payload.iat * 1000 <= invalidatedAt) {
      return res.status(401).json({ message: "Your session ended because a new academic term was published. Please log in again." });
    }
    let activeSession = null;
    if (payload.sid) {
      activeSession = (user.activeSessions || []).find((session) => String(session.id) === String(payload.sid));
      if (!activeSession || new Date(activeSession.expiresAt).getTime() <= Date.now()) {
        return res.status(401).json({ message: "This device session has ended. Please log in again." });
      }
    }
    if (user.passwordResetRequired) {
      const recoveryRoutes = new Set([
        "GET /api/auth/me",
        "POST /api/auth/logout",
        "POST /api/auth/request-password-otp",
        "POST /api/auth/change-password",
      ]);
      const requestPath = String(req.originalUrl || "").split("?")[0];
      if (!recoveryRoutes.has(`${req.method} ${requestPath}`)) {
        return res.status(423).json({ message: "A password reset is required before you can continue." });
      }
    }
    if (activeSession?.securityAlertPending) {
      const reviewRoutes = new Set([
        "GET /api/auth/me",
        "POST /api/auth/logout",
      ]);
      const requestPath = String(req.originalUrl || "").split("?")[0];
      if (!reviewRoutes.has(`${req.method} ${requestPath}`)) {
        return res.status(423).json({ message: "This sign-in is waiting for approval from an existing session." });
      }
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
