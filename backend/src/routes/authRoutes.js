const express = require("express");
const { register, login, me, updateMe, changePassword } = require("../controllers/authController");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.put("/me", authRequired, updateMe);
router.post("/change-password", authRequired, changePassword);

module.exports = router;
