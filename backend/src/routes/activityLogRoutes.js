const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const { getRequestIp, getDeviceDescription } = require("../utils/requestMetadata");

const router = express.Router();

function displayAction(log) {
  if (log.action !== "Updated system details") return log.action;
  const path = String(log.path || "");
  if (path === "/api/auth/me") return "Changed profile or teacher status";
  if (path.includes("/users")) return "Updated user account";
  if (path.includes("/schedules")) return "Updated schedule entry";
  if (path.includes("/events")) return "Updated event";
  if (path.includes("/consultations")) return "Updated consultation availability";
  if (path.includes("/academic-terms")) return "Updated academic term";
  return "Updated system resource";
}

router.get("/", authRequired, authorizeRoles("admin"), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const role = ["admin", "teacher", "student"].includes(String(req.query.role || "").toLowerCase()) ? String(req.query.role).toLowerCase() : null;
    const search = String(req.query.search || "").trim().slice(0, 100);
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const conditions = [];

    if (role) conditions.push({ actorRole: role });
    if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
      const createdAt = {};
      if (from && !Number.isNaN(from.getTime())) createdAt.$gte = from;
      if (to && !Number.isNaN(to.getTime())) createdAt.$lte = to;
      conditions.push({ createdAt });
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchPattern = new RegExp(escapedSearch, "i");
      const matchingActors = await User.find({
        role: { $in: ["teacher", "student"] },
        $or: [
          { firstName: searchPattern },
          { lastName: searchPattern },
          { email: searchPattern },
        ],
      }).select("_id").lean();
      conditions.push({
        $or: [
          { actorId: { $in: matchingActors.map((actor) => actor._id) } },
          { actorEmail: searchPattern },
          { action: searchPattern },
          { ipAddress: searchPattern },
          { device: searchPattern },
        ],
      });
    }
    const query = conditions.length ? { $and: conditions } : {};
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);
    const actorIds = [...new Set(logs.map((log) => String(log.actorId)))];
    const actors = await User.find({ _id: { $in: actorIds } }).select("firstName lastName email avatar").lean();
    const actorById = new Map(actors.map((actor) => [String(actor._id), actor]));

    res.json({
      logs: logs.map((log) => {
        const actor = actorById.get(String(log.actorId));
        const name = actor ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim() : "";
        return { id: log._id, actorName: name || log.actorEmail || "Unknown user", actorEmail: log.actorEmail, actorAvatar: actor?.avatar || "", actorRole: log.actorRole, action: displayAction(log), actionType: log.actionType || "system.update", targetType: log.targetType || "system", targetName: log.targetName || "", details: log.details || null, ipAddress: log.ipAddress || "", device: log.device || "", createdAt: log.createdAt };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load activity logs.", error: error.message });
  }
});

router.post("/navigation", authRequired, authorizeRoles("admin", "teacher", "student"), async (req, res) => {
  try {
    const routeLabel = String(req.body?.routeLabel || "a page").trim().slice(0, 120);
    const routePath = String(req.body?.routePath || "").trim().slice(0, 200);
    await ActivityLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email || "",
      actorRole: req.user.role,
      action: `Opened ${routeLabel}`,
      actionType: "navigation.open",
      targetType: "page",
      targetName: routeLabel,
      details: { routePath },
      path: routePath || "/",
      method: "NAVIGATE",
      ipAddress: getRequestIp(req),
      device: getDeviceDescription(req),
    });
    res.status(201).json({ message: "Navigation logged." });
  } catch (error) {
    res.status(500).json({ message: "Failed to save navigation activity.", error: error.message });
  }
});

module.exports = router;
