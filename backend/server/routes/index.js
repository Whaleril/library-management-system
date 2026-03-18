const express = require("express");

const authRoutes = require("./authRoutes");
const bookRoutes = require("./bookRoutes");
const loanRoutes = require("./loanRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(bookRoutes);
router.use(loanRoutes);
router.use(userRoutes);

module.exports = router;
