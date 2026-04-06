const express = require("express");
const wishlistController = require("../controllers/wishlistController");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/role");

const router = express.Router();

const studentOnly = [requireAuth, requireRole(["STUDENT"])];

router.post("/wishlist", ...studentOnly, wishlistController.addToWishlist);
router.get("/wishlist", ...studentOnly, wishlistController.getWishlist);
router.delete("/wishlist/:id", ...studentOnly, wishlistController.removeFromWishlist);

module.exports = router;
