const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
  listScheduleTables,
  createScheduleTable,
  listSchedules,
  createSchedule,
  replaceSchedule,
  deleteSchedule,
} = require("../controllers/scheduleController");

const router = express.Router();

router.get("/tables", authRequired, authorizeRoles("admin", "teacher"), listScheduleTables);
router.get("/", authRequired, authorizeRoles("admin", "teacher"), listSchedules);

router.use(authRequired, authorizeRoles("admin"));

router.post("/tables", createScheduleTable);
router.post("/", createSchedule);
router.post("/replace", replaceSchedule);
router.post("/delete", deleteSchedule);

module.exports = router;
