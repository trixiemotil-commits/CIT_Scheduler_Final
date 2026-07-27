const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
  listTerms,
  getPublishedTerm,
  createTerm,
  updateTerm,
  publishTerm,
} = require("../controllers/academicTermController");

const router = express.Router();

router.get("/published", authRequired, authorizeRoles("admin", "teacher", "student"), getPublishedTerm);
router.get("/", authRequired, authorizeRoles("admin"), listTerms);
router.post("/", authRequired, authorizeRoles("admin"), createTerm);
router.patch("/:id", authRequired, authorizeRoles("admin"), updateTerm);
router.post("/:id/publish", authRequired, authorizeRoles("admin"), publishTerm);

module.exports = router;
