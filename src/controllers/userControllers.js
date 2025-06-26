const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.userLogIn = async (req, res) => {
  const { email, password } = req.body;
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
    console.error(err);
    res.status(500).json({
      message: "An error occurred during the login process.",
    });
  }
};

exports.userSignUp = async (req, res) => {
  const { firstName, email, lastName, imageUrl, role } = req.body;
  const hashedPassword = req.hashedPassword;
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
      role,
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
    console.error(err);
    res.status(500).json({
      message: "An error occurred during the sign-up process.",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // The user ID is attached to the request by the verifyToken middleware
    const userId = req.user.userId;
    const updateData = req.body;

    // If a new image is uploaded, its path is added to the update data
    if (req.file) {
      updateData.imageUrl = req.file.path;
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
    console.error(err);
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
