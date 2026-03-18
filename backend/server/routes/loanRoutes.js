const express = require("express");

const loanController = require("../controllers/loanController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/loans/current", requireAuth, loanController.getCurrentLoans);
router.post("/loans", requireAuth, loanController.createLoan);

module.exports = router;
