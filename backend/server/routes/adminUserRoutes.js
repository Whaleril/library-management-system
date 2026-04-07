const express = require("express");
const adminUserController = require("../controllers/adminUserController");
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const adminOnly = [requireAuth, requireRole(['ADMIN'])];

router.post("/admin/librarians", ...adminOnly, adminUserController.createLibrarian);
router.put("/admin/librarians/:id", ...adminOnly, adminUserController.updateLibrarian);
router.post("/admin/users/:id/reset-password", ...adminOnly, adminUserController.resetUserPassword);

module.exports = router;