const express = require("express");

const holdController = require("../controllers/holdController");

const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

const studentOnly = [requireAuth, requireRole(["STUDENT"])];

router.post("/holds", ...studentOnly, holdController.createHold);
router.get("/holds", ...studentOnly, holdController.getHolds);
router.delete("/holds/:id", ...studentOnly, holdController.cancelHold);

module.exports = router;