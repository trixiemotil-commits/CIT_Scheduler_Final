const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authRequired, authorizeRoles("admin"), async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const role = ["teacher", "student"].includes(req.query.role) ? req.query.role : null;
    const query = role ? { actorRole: role } : {};
    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const actorIds = [...new Set(logs.map((log) => String(log.actorId)))];
    const actors = await User.find({ _id: { $in: actorIds } }).select("firstName lastName email avatar").lean();
    const actorById = new Map(actors.map((actor) => [String(actor._id), actor]));

    res.json({ logs: logs.map((log) => {
      const actor = actorById.get(String(log.actorId));
      const name = actor ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim() : "";
      return { id: log._id, actorName: name || log.actorEmail || "Unknown user", actorEmail: log.actorEmail, actorAvatar: actor?.avatar || "", actorRole: log.actorRole, action: log.action, createdAt: log.createdAt };
    }) });
  } catch (error) {
    res.status(500).json({ message: "Failed to load activity logs.", error: error.message });
  }
});

router.post("/navigation", authRequired, authorizeRoles("teacher", "student"), async (req, res) => {
  try {
    const routeLabel = String(req.body?.routeLabel || "a page").trim().slice(0, 120);
    const routePath = String(req.body?.routePath || "").trim().slice(0, 200);
    await ActivityLog.create({
      actorId: req.user.id,
      actorEmail: req.user.email || "",
      actorRole: req.user.role,
      action: `Opened ${routeLabel}`,
      path: routePath || "/",
      method: "NAVIGATE",
    });
    res.status(201).json({ message: "Navigation logged." });
  } catch (error) {
    res.status(500).json({ message: "Failed to save navigation activity.", error: error.message });
  }
});

module.exports = router;
