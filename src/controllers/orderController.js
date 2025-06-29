const Order = require("../models/orderModel");
const Product = require("../models/productModels");
const User = require("../models/userModels");
const mongoose = require("mongoose");

// POST /api/orders - Create new order
const createOrder = async (req, res) => {
  try {
    console.log("Creating order with data:", req.body);

    const {
      items,
      shippingInfo,
      paymentMethod,
      cardInfo,
      subtotal,
      tax,
      shipping,
      total,
      orderNotes,
      orderId,
      status,
      paymentStatus,
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items array is required" });
    }

    if (!shippingInfo || !shippingInfo.email) {
      return res
        .status(400)
        .json({ message: "Shipping info with email is required" });
    }

    // Process items to ensure correct format
    const processedItems = items.map((item) => ({
      title: item.title || item.name || "Unknown Product",
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      imageUrl: item.imageUrl || "",
      brand: item.brand || "",
      productId: item.productId || item._id,
    }));

    // Validate processed items
    const invalidItems = processedItems.filter(
      (item) => !item.title || item.price <= 0 || item.quantity <= 0
    );

    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: "Invalid items detected",
        details: "All items must have title, valid price > 0, and quantity > 0",
      });
    }

    // Create order with proper data types
    const newOrder = new Order({
      orderId:
        orderId ||
        `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
      userId: req.user.userId,
      items: processedItems,
      shippingInfo: {
        firstName: shippingInfo.firstName,
        lastName: shippingInfo.lastName,
        email: shippingInfo.email,
        phone: shippingInfo.phone || "",
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        zipCode: shippingInfo.zipCode,
        country: shippingInfo.country || "United States",
      },
      paymentMethod: paymentMethod,
      cardInfo:
        paymentMethod === "card"
          ? {
              last4: cardInfo?.last4,
              nameOnCard: cardInfo?.nameOnCard,
            }
          : null,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      shipping: parseFloat(shipping) || 0,
      total: parseFloat(total) || 0,
      orderNotes: orderNotes || "",
      status: status || "pending",
      paymentStatus: paymentStatus || "paid",
      orderDate: new Date().toISOString(),
      trackingNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedOrder = await newOrder.save();
    console.log("Order saved successfully:", savedOrder.orderId);

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// GET /api/orders - Get all orders (admin only) with advanced filtering
const getAllOrders = async (req, res) => {
  try {
    console.log("Fetching all orders with filters...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter query
    let filter = {};

    // Status filtering
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Payment status filtering
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    // User ID filtering
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Search by order ID
    if (req.query.search) {
      filter.$or = [
        { orderId: { $regex: req.query.search, $options: "i" } },
        { "shippingInfo.email": { $regex: req.query.search, $options: "i" } },
        { "shippingInfo.firstName": { $regex: req.query.search, $options: "i" } },
        { "shippingInfo.lastName": { $regex: req.query.search, $options: "i" } }
      ];
    }

    // Sorting
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = {};
    sort[sortBy] = sortOrder;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate("userId", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    console.log(`Found ${orders.length} orders out of ${totalOrders} total with filters`);

    // Return array directly if no pagination requested
    if (!req.query.page && !req.query.limit) {
      return res.status(200).json(orders);
    }

    // Return with pagination info
    res.status(200).json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1,
      },
      filters: {
        status: req.query.status,
        paymentStatus: req.query.paymentStatus,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        sortBy,
        sortOrder: req.query.sortOrder
      }
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to fetch orders",
    });
  }
};

// GET /api/orders/:orderId - Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId: orderId })
      .populate("userId", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        message: `Order with ID ${orderId} not found`,
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// GET /api/orders/user/:userId - Get orders by user (for customer order history)
const getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Status filtering for user orders
    let filter = { userId: userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get orders by user error:", error);
    res.status(500).json({
      message: "Failed to fetch user orders",
      error: error.message,
    });
  }
};

// GET /api/orders/stats - Get order statistics (admin only)
const getOrderStats = async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "week":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "month":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        };
        break;
      case "year":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
          },
        };
        break;
      default:
        dateFilter = {};
    }

    const [
      totalOrders,
      ordersByStatus,
      revenueStats,
      topProducts
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalRevenue: { $sum: "$total" }
          }
        }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" },
            totalItems: { $sum: { $sum: "$items.quantity" } }
          }
        }
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.title",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      totalOrders,
      ordersByStatus,
      revenue: revenueStats[0] || {
        totalRevenue: 0,
        averageOrderValue: 0,
        totalItems: 0
      },
      topProducts,
      period
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

// POST /api/orders/:orderId/notify - Send order notification (admin only)
const sendOrderNotification = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notificationType, message, email } = req.body;

    const order = await Order.findOne({ orderId: orderId })
      .populate("userId", "firstName lastName email");

    if (!order) {
      return res.status(404).json({
        message: `Order with ID ${orderId} not found`,
      });
    }

    // Here you would integrate with your email service (SendGrid, Nodemailer, etc.)
    // For now, we'll just log the notification
    console.log(`Sending ${notificationType} notification for order ${orderId}:`);
    console.log(`To: ${email || order.shippingInfo.email}`);
    console.log(`Message: ${message}`);

    // Simulate email sending
    const notificationData = {
      orderId: order.orderId,
      customerName: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
      email: email || order.shippingInfo.email,
      notificationType,
      message,
      sentAt: new Date(),
      status: order.status
    };

    res.status(200).json({
      message: "Notification sent successfully",
      notification: notificationData
    });
  } catch (error) {
    console.error("Send notification error:", error);
    res.status(500).json({
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

// PATCH /api/orders/:orderId - Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    console.log(`Updating order ${orderId} to status: ${status}`);

    // Validate status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    // Find by orderId field, not _id
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: orderId }, // Use orderId field, not _id
      {
        status,
        trackingNumber,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: `Order with ID ${orderId} not found`,
      });
    }

    console.log(`Order ${orderId} updated successfully`);
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// DELETE /api/orders/:orderId - Delete order (admin only)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findOneAndDelete({ orderId: orderId });

    if (!deletedOrder) {
      return res.status(404).json({
        message: `Order with ID ${orderId} not found`,
      });
    }

    res.status(204).send(); // No content
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createOrder, getAllOrders, getOrderById, getOrdersByUser, getOrderStats, sendOrderNotification, updateOrderStatus, deleteOrder };
