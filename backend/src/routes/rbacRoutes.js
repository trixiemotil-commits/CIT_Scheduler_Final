const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", authRequired, authorizeRoles("admin"), (_req, res) => {
  res.status(200).json({ message: "Admin access granted." });
});

router.get("/teacher", authRequired, authorizeRoles("teacher", "admin"), (_req, res) => {
  res.status(200).json({ message: "Teacher access granted." });
});

router.get("/student", authRequired, authorizeRoles("student", "teacher", "admin"), (_req, res) => {
  res.status(200).json({ message: "Student access granted." });
});

module.exports = router;
