const Order = require("../models/orderModel");
const Product = require("../models/productModels");
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

// GET /api/orders - Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    console.log("Fetching all orders...");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Increased default limit
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find()
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(),
    ]);

    console.log(`Found ${orders.length} orders out of ${totalOrders} total`);

    // Return array directly if no pagination requested, otherwise return with pagination
    if (!req.query.page && !req.query.limit) {
      // Frontend expects direct array
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

module.exports = { createOrder, getAllOrders, updateOrderStatus, deleteOrder };
