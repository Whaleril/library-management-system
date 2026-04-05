const express = require("express");

const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", requireAuth, authController.logout);
router.post("/generate-temp-password", authController.generateTempPassword);
router.post("/reset-password", requireAuth, authController.resetPassword);

module.exports = router;
