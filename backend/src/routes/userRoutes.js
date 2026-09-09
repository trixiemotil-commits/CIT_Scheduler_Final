const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
	listUsers,
	verifyCurrentAdminPassword,
	createUser,
	updateUser,
	updateUserStatus,
	updateTeacherStatus,
	approveAllPendingUsers,
} = require("../controllers/adminUserController");

const router = express.Router();

router.use(authRequired, authorizeRoles("admin"));

router.get("/", listUsers);
router.post("/verify-current-password", verifyCurrentAdminPassword);
router.post("/", createUser);
router.patch("/approve-all-pending", approveAllPendingUsers);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/teacher-status", updateTeacherStatus);
router.put("/:id", updateUser);

module.exports = router;
