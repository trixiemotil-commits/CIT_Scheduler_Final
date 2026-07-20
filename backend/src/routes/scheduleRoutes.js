const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
  listScheduleTables,
  createScheduleTable,
  listSchedules,
  createSchedule,
  createLunchBreak,
  updateLunchBreak,
  replaceSchedule,
  deleteSchedule,
  getAdminDashboardSummary,
} = require("../controllers/scheduleController");

const router = express.Router();

router.get("/tables", authRequired, authorizeRoles("admin", "teacher"), listScheduleTables);
router.get("/", authRequired, authorizeRoles("admin", "teacher"), listSchedules);
router.get("/dashboard-summary", authRequired, authorizeRoles("admin"), getAdminDashboardSummary);

router.use(authRequired, authorizeRoles("admin"));

router.post("/tables", createScheduleTable);
router.post("/", createSchedule);
router.post("/lunch", createLunchBreak);
router.patch("/lunch/:id", updateLunchBreak);
router.post("/replace", replaceSchedule);
router.post("/delete", deleteSchedule);

module.exports = router;
