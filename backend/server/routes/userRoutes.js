const express = require("express");

const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

router.get("/users/me", requireAuth, userController.getCurrentUser);
router.put("/users/me", requireAuth, userController.updateCurrentUser);

module.exports = router;
