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

router.use(authRequired, authorizeRoles("admin"));

router.get("/tables", listScheduleTables);
router.post("/tables", createScheduleTable);
router.get("/", listSchedules);
router.post("/", createSchedule);
router.post("/replace", replaceSchedule);
router.post("/delete", deleteSchedule);

module.exports = router;
