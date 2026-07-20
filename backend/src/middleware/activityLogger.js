const ActivityLog = require("../models/ActivityLog");

function describeActivity(method, path) {
  if (path.includes("/consultations/requests")) {
    if (method === "POST") return "Submitted a consultation request";
    if (path.endsWith("/status")) return "Updated a consultation request";
    return "Updated a consultation request";
  }
  if (path === "/api/auth/me") return "Updated their profile or status";
  if (path.includes("/consultations")) return "Updated consultation availability";
  return `${method} ${path.replace("/api/", "")}`;
}

function activityLogger(req, res, next) {
  res.on("finish", () => {
    const role = req.user?.role;
    if (!req.user || !["teacher", "student"].includes(role) || req.method === "GET" || res.statusCode >= 400 || req.path.startsWith("/api/activity-logs")) {
      return;
    }

    ActivityLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email || "",
      actorRole: role,
      action: describeActivity(req.method, req.path),
      path: req.path,
      method: req.method,
    }).catch((error) => console.error("Unable to save activity log:", error.message));
  });

  next();
}

module.exports = activityLogger;
