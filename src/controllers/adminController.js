const User = require("../models/userModels");
const Product = require("../models/productModels");
const Invoice = require("../models/invoiceModel");
const bcrypt = require('bcrypt');

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalInvoices,
      totalAdmins,
      totalRevenue,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Invoice.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    ]);

    const recentUsers = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInvoices = await Invoice.find()
      .populate("user", "firstName lastName email")
      .populate("products.product", "brand model")
      .sort({ createdAt: -1 })
      .limit(5);

    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5);

    res.status(200).json({
      stats: {
        totalUsers,
        totalProducts,
        totalInvoices,
        totalAdmins,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentUsers,
      recentInvoices,
      lowStockProducts,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users with pagination and search
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";

    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    // Add formatted creation date for easier reading
    const usersWithFormattedDates = users.map(user => ({
      ...user.toObject(),
      formattedCreatedAt: user.createdAt.toLocaleString(),
      formattedUpdatedAt: user.updatedAt.toLocaleString()
    }));

    res.status(200).json({
      users: usersWithFormattedDates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1,
      },
      filters: {
        search,
        role,
        status,
        sortBy,
        sortOrder
      }
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Promote user to admin
exports.promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User promoted to admin successfully",
      user,
    });
  } catch (err) {
    console.error("Promote user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Demote admin to user
exports.demoteToUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-demotion
    if (userId === req.user.userId) {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "user" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Admin demoted to user successfully",
      user,
    });
  } catch (err) {
    console.error("Demote user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (userId === req.user.userId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = "user", status = "active" } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        message: "All fields are required: firstName, lastName, email, password" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Validate role
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    // Validate status
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'active' or 'inactive'" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      status
    });

    await newUser.save();

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      message: "User created successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Create user error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update user (admin only)
exports.updateUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    // Prevent self-demotion from admin
    if (userId === req.user.userId && req.body.role === "user") {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }

    // Validate role
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }

    // Validate status
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'active' or 'inactive'" });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update user error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Get all products with pagination and search (admin view)
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";

    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort(sortOptions).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNext: page * limit < totalProducts,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get all products admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all invoices with pagination (admin view)
exports.getAllInvoicesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, totalInvoices] = await Promise.all([
      Invoice.find()
        .populate("user", "firstName lastName email")
        .populate("products.product", "brand model price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(),
    ]);

    res.status(200).json({
      invoices,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalInvoices / limit),
        totalInvoices,
        hasNext: page * limit < totalInvoices,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error("Get all invoices admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock } = req.body;

    if (stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { stock },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product stock updated successfully",
      product,
    });
  } catch (err) {
    console.error("Update product stock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get sales analytics
exports.getSalesAnalytics = async (req, res) => {
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

    const salesData = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalSales: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const topProducts = await Invoice.aggregate([
      { $match: dateFilter },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      {
        $lookup: {
          from: "monitors",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          brand: "$productInfo.brand",
          model: "$productInfo.model",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      salesData,
      topProducts,
      period,
    });
  } catch (err) {
    console.error("Get sales analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user creation statistics
exports.getUserCreationStats = async (req, res) => {
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

    const userCreationStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalUsers: { $sum: 1 },
          usersByRole: {
            $push: "$role"
          }
        },
      },
      {
        $addFields: {
          adminCount: {
            $size: {
              $filter: {
                input: "$usersByRole",
                cond: { $eq: ["$$this", "admin"] }
              }
            }
          },
          regularUserCount: {
            $size: {
              $filter: {
                input: "$usersByRole",
                cond: { $eq: ["$$this", "user"] }
              }
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const recentlyCreatedUsers = await User.find(dateFilter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(10);

    const totalStats = await User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalAdmins: {
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
          },
          totalRegularUsers: {
            $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] }
          },
          activeUsers: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      userCreationStats,
      recentlyCreatedUsers,
      totalStats: totalStats[0] || {
        totalUsers: 0,
        totalAdmins: 0,
        totalRegularUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0
      },
      period,
    });
  } catch (err) {
    console.error("Get user creation stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
