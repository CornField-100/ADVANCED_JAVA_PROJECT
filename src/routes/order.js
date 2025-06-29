const express = require("express");
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  getOrderStats,
  sendOrderNotification,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");
const { verifyToken, isAdmin } = require("../middleware/auth");

const router = express.Router();

// Debug endpoint to test database connection
router.get("/debug", verifyToken, async (req, res) => {
  try {
    const Order = require("../models/orderModel");
    const count = await Order.countDocuments();
    const sampleOrder = await Order.findOne().populate(
      "userId",
      "firstName lastName email"
    );

    res.json({
      message: "Debug info",
      orderCount: count,
      sampleOrder: sampleOrder,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order Statistics (admin only) - must be before /:orderId routes
router.get("/stats", verifyToken, isAdmin, getOrderStats);

// Get orders by user (for customer order history)
router.get("/user/:userId", verifyToken, getOrdersByUser);

// Create new order
router.post("/", verifyToken, createOrder);

// Get all orders (admin only)
router.get("/", verifyToken, isAdmin, getAllOrders);

// Get single order by ID
router.get("/:orderId", verifyToken, getOrderById);

// Send order notification (admin only)
router.post("/:orderId/notify", verifyToken, isAdmin, sendOrderNotification);

// Update order status (admin only)
router.patch("/:orderId", verifyToken, isAdmin, updateOrderStatus);

// Delete order (admin only)
router.delete("/:orderId", verifyToken, isAdmin, deleteOrder);

module.exports = router;
