const express = require("express");

const holdController = require("../controllers/holdController");

const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/holds", requireAuth, holdController.createHold);
router.get("/holds", requireAuth, holdController.getHolds);
router.delete("/holds/:id", requireAuth, holdController.cancelHold);

module.exports = router;