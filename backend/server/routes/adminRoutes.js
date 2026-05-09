const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/role");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(requireAuth, requireAdmin);

// R2 新增接口
router.get("/dashboard/menu", adminController.getDashboardMenu);
router.get("/config", adminController.getSystemConfig);
router.put("/config/borrow-rules", adminController.updateBorrowRules);
router.put("/config/fine-rate", adminController.updateFineRate);

module.exports = router;