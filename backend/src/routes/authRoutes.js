const express = require("express");
const { register, login, verifyLoginOtp, selectRole, logoutSession, me, listSessions, revokeSession, trustCurrentDevice, reportCurrentDevice, confirmSecurityReview, updateMe, requestPasswordOtp, changePassword, requestPasswordReset, verifyPasswordOtp, resetPassword } = require("../controllers/authController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/security-review/confirm", confirmSecurityReview);
router.post("/select-role", authRequired, selectRole);
router.post("/logout", authRequired, logoutSession);
router.get("/me", authRequired, me);
router.get("/sessions", authRequired, listSessions);
router.delete("/sessions/:sessionId", authRequired, revokeSession);
router.post("/security/trust-current-device", authRequired, trustCurrentDevice);
router.post("/security/report-current-device", authRequired, reportCurrentDevice);
router.put("/me", authRequired, updateMe);
router.post("/request-password-otp", authRequired, requestPasswordOtp);
router.post("/change-password", authRequired, changePassword);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password-otp", verifyPasswordOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
