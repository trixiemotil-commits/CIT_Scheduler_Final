const express = require("express");
const router  = express.Router();
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
  listConsultations,
  createConsultation,
  updateConsultation,
  deleteConsultation,
  getWeeklySummary,
  listTeachersForStudents,
  createConsultationRequest,
  listConsultationRequests,
  updateConsultationRequestByStudent,
  updateConsultationRequestStatus,
  listConsultationLogs,
} = require("../controllers/consultationController");

router.get("/teachers", authRequired, authorizeRoles("student", "teacher", "admin"), listTeachersForStudents);
router.post("/requests", authRequired, authorizeRoles("student"), createConsultationRequest);
router.get("/requests", authRequired, authorizeRoles("student", "teacher", "admin"), listConsultationRequests);
router.put("/requests/:id", authRequired, authorizeRoles("student"), updateConsultationRequestByStudent);
router.patch("/requests/:id/status", authRequired, authorizeRoles("student", "teacher", "admin"), updateConsultationRequestStatus);
router.get("/logs", authRequired, authorizeRoles("student", "teacher", "admin"), listConsultationLogs);

// GET  /api/consultations/summary?teacher=xxx&employeeId=xxx
router.get("/summary", authRequired, authorizeRoles("admin", "teacher"), getWeeklySummary);

// GET  /api/consultations?teacher=xxx&employeeId=xxx
router.get("/", authRequired, authorizeRoles("admin", "teacher"), listConsultations);

// Write routes — admin only
router.use(authRequired, authorizeRoles("admin"));

// POST /api/consultations
router.post("/", createConsultation);

// PUT  /api/consultations/:id
router.put("/:id", updateConsultation);

// DELETE /api/consultations/:id
router.delete("/:id", deleteConsultation);

module.exports = router;
