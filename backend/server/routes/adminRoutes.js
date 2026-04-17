const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/role");
const adminAuditRoutes = require("./adminAuditRoutes");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.use(adminAuditRoutes);

module.exports = router;
