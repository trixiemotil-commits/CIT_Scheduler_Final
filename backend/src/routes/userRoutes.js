const express = require("express");
const { authRequired, authorizeRoles } = require("../middleware/authMiddleware");
const { listUsers, createUser, updateUser } = require("../controllers/adminUserController");

const router = express.Router();

router.use(authRequired, authorizeRoles("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);

module.exports = router;
