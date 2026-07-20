const express = require("express");
const { register, login, selectRole, me, updateMe, requestPasswordOtp, changePassword, requestPasswordReset, resetPassword } = require("../controllers/authController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/select-role", authRequired, selectRole);
router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);
router.post("/request-password-otp", authRequired, requestPasswordOtp);
router.post("/change-password", authRequired, changePassword);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;
