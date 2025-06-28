const express = require("express");
const {
  createOrder,
  getAllOrders,
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

router.post("/", verifyToken, createOrder);
router.get("/", verifyToken, isAdmin, getAllOrders);
router.patch("/:orderId", verifyToken, isAdmin, updateOrderStatus);
router.delete("/:orderId", verifyToken, isAdmin, deleteOrder);

module.exports = router;
