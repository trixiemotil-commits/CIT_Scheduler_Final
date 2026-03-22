const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const {
	listUsers,
	createUser,
	updateUser,
	updateUserStatus,
	approveAllPendingUsers,
} = require("../controllers/adminUserController");

const router = express.Router();

router.use(authRequired, authorizeRoles("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.patch("/approve-all-pending", approveAllPendingUsers);
router.patch("/:id/status", updateUserStatus);
router.put("/:id", updateUser);

module.exports = router;
