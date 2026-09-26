const ActivityLog = require("../models/ActivityLog");
const { getRequestIp, getDeviceDescription } = require("../utils/requestMetadata");

function describeActivity(method, path) {
  if (path.includes("/consultations/requests")) {
    if (method === "POST") return "Submitted a consultation request";
    if (path.endsWith("/status")) return "Changed consultation request status";
    if (method === "PUT") return "Edited a consultation request";
    return "Updated a consultation request";
  }
  if (path === "/api/auth/me") return "Changed profile or teacher status";
  if (path.includes("/consultations")) return method === "POST" ? "Created consultation availability" : method === "DELETE" ? "Removed consultation availability" : "Updated consultation availability";
  if (path.includes("/academic-terms")) return method === "POST" ? "Created academic term" : method === "DELETE" ? "Deleted academic term" : "Updated academic term";
  if (path.includes("/users")) return method === "POST" ? "Created user account" : method === "DELETE" ? "Removed user account" : "Updated user account";
  if (path.includes("/schedules")) return method === "POST" ? "Created schedule entry" : method === "DELETE" ? "Removed schedule entry" : "Updated schedule entry";
  if (path.includes("/events")) return method === "POST" ? "Created event" : method === "DELETE" ? "Removed event" : "Updated event";
  return `${method} action on system resource`;
}

function activityMetadata(method, path) {
  if (path.includes("/auth/me")) return { actionType: "profile.update", targetType: "user" };
  if (path.includes("/consultations/requests")) return { actionType: method === "POST" ? "consultation.create" : "consultation.update", targetType: "consultation" };
  if (path.includes("/consultations")) return { actionType: "consultation.availability.update", targetType: "consultationAvailability" };
  if (path.includes("/academic-terms")) return { actionType: "academicTerm.update", targetType: "academicTerm" };
  if (path.includes("/users")) return { actionType: "user.update", targetType: "user" };
  if (path.includes("/schedules")) return { actionType: "schedule.update", targetType: "schedule" };
  if (path.includes("/events")) return { actionType: "event.update", targetType: "event" };
  return { actionType: "system.update", targetType: "system" };
}

function activityLogger(req, res, next) {
  res.on("finish", () => {
    const role = String(req.user?.role || "").toLowerCase();
    if (!req.user || !["admin", "teacher", "student"].includes(role) || req.method === "GET" || res.statusCode >= 400 || req.originalUrl.startsWith("/api/activity-logs") || req.activityLogWritten) {
      return;
    }

    const metadata = activityMetadata(req.method, req.path);
    ActivityLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email || "",
      actorRole: role,
      action: describeActivity(req.method, req.path),
      ...metadata,
      path: req.path,
      method: req.method,
      ipAddress: getRequestIp(req),
      device: getDeviceDescription(req),
    }).catch((error) => console.error("Unable to save activity log:", error.message));
  });

  next();
}

module.exports = activityLogger;
