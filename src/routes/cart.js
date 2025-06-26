const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
} = require("../controllers/cartController");

// Get user's cart
router.get("/", verifyToken, getCart);

// Add to cart
router.post("/", verifyToken, addToCart);

// Remove from cart
router.delete("/:productId", verifyToken, removeFromCart);

// Update cart item quantity
router.put("/:productId", verifyToken, updateCartItemQuantity);

module.exports = router;
