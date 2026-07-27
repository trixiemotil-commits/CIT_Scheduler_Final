const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", authRequired, authorizeRoles("admin", "teacher", "student"), listEvents);
router.post("/", authRequired, authorizeRoles("admin"), createEvent);
router.patch("/:id", authRequired, authorizeRoles("admin"), updateEvent);
router.delete("/:id", authRequired, authorizeRoles("admin"), deleteEvent);

module.exports = router;
