const express = require("express");

const userController = require("../controllers/userController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

const studentOnly = [requireAuth, requireRole(["STUDENT"])];

router.get("/users/me", ...studentOnly, userController.getCurrentUser);
router.put("/users/me", ...studentOnly, userController.updateCurrentUser);

module.exports = router;
