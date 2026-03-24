const express = require("express");

const authRoutes = require("./authRoutes");
const bookRoutes = require("./bookRoutes");
const holdRoutes = require('./holdRoutes');
const loanRoutes = require("./loanRoutes");
const userRoutes = require("./userRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(bookRoutes);
router.use(holdRoutes);
router.use(loanRoutes);
router.use(userRoutes);

module.exports = router;
