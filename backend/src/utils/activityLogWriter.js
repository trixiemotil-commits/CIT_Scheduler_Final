const ActivityLog = require("../models/ActivityLog");
const { getRequestIp, getDeviceDescription } = require("./requestMetadata");

async function logActivity({ actor, action, path = "/", method = "POST", req = null }) {
  if (!actor) return null;

  const actorId = actor.id || actor._id;
  const actorRole = String(actor.role || actor.roles?.[0] || "").trim().toLowerCase();
  if (!actorId || !actorRole) return null;

  const cleanAction = String(action || "").trim().slice(0, 300);
  if (!cleanAction) return null;

  try {
    return await ActivityLog.create({
      actorId,
      actorEmail: String(actor.email || "").trim(),
      actorRole,
      action: cleanAction,
      path: String(path || "/").trim().slice(0, 200),
      method: String(method || "POST").trim().slice(0, 20),
      ipAddress: req ? getRequestIp(req) : "",
      device: req ? getDeviceDescription(req) : "",
    });
  } catch (error) {
    console.error("Unable to save activity log:", error.message);
    return null;
  }
}

module.exports = { logActivity };
