const User = require("../models/userModels");
const Invoice = require("../models/invoiceModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

exports.userLogIn = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!email.includes("@")) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }

  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, foundUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: foundUser._id,
        role: foundUser.role,
      },
      process.env.SECRET_TOKEN_KEY,
      { expiresIn: "24h" }
    );
    res.status(200).json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "An error occurred during the login process.",
    });
  }
};

exports.userSignUp = async (req, res) => {
  const { firstName, email, lastName, imageUrl, role } = req.body;
  const hashedPassword = req.hashedPassword;

  // Input validation
  if (!firstName || !lastName || !email) {
    return res
      .status(400)
      .json({ message: "First name, last name, and email are required" });
  }

  if (!email.includes("@")) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use." });
    }
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      imageUrl,
      role: role || "user", // Default role if not provided
      inventory: [],
    });

    const savedUser = await newUser.save();
    const userToReturn = {
      _id: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      email: savedUser.email,
      imageUrl: savedUser.imageUrl,
      role: savedUser.role,
    };
    res.status(201).json(userToReturn);
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({
      message: "An error occurred during the sign-up process.",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // The user ID is attached to the request by the verifyToken middleware
    const userId = req.user.userId;
    const updateData = { ...req.body }; // Create a copy to avoid mutation

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData._id;
    delete updateData.__v;

    // If a new image is uploaded, its path is added to the update data
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    // Validate email format if email is being updated
    if (updateData.email && !updateData.email.includes("@")) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    if (updateData.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(409).json({ message: "Email already in use." });
      }
    }

    // Find the user by ID and update their data
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validation
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return a sanitized user object, excluding the password
    const userToReturn = {
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      imageUrl: updatedUser.imageUrl,
      role: updatedUser.role,
    };

    res.status(200).json(userToReturn);
  } catch (err) {
    console.error("Update user error:", err);

    // Handle validation errors specifically
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "An error occurred during the update process.",
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("cart.product");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's orders/invoices
    const userInvoices = await Invoice.find({ user: userId })
      .populate("products.product", "brand model price")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get user's cart item count
    const user = await User.findById(userId).select("cart");
    const cartItemCount = user.cart.reduce(
      (total, item) => total + item.quantity,
      0
    );

    // Calculate total spent
    const totalSpent = await Invoice.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.status(200).json({
      userInvoices,
      cartItemCount,
      totalSpent: totalSpent[0]?.total || 0,
      totalOrders: userInvoices.length,
    });
  } catch (err) {
    console.error("User dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Invoice.find({ user: userId })
        .populate("products.product", "brand model price imageUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments({ user: userId }),
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
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
