const express = require("express");

const adminUserController = require("../controllers/adminUserController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/admin/users/:id/reset-password", requireAuth, adminUserController.resetUserPassword);

module.exports = router;