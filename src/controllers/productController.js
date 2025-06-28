const Product = require("../models/productModels");
const mongoose = require("mongoose");

exports.addProduct = async (req, res) => {
  try {
    console.log("Creating product with data:", req.body);
    console.log("File uploaded:", req.file ? req.file.path : "No file");

    const productData = { ...req.body };

    // The frontend might send 'Model' instead of 'model'. This handles that case.
    if (productData.Model && !productData.model) {
      productData.model = productData.Model;
      delete productData.Model;
    }

    // Convert string numbers to actual numbers
    if (productData.price) {
      productData.price = Number(productData.price);
    }
    if (productData.stock) {
      productData.stock = Number(productData.stock);
    }

    // If an image is uploaded, add its path to the product data
    if (req.file) {
      productData.imageUrl = req.file.path;
    }

    const product = new Product(productData);
    await product.save();

    console.log("Product created successfully:", product._id);
    res.status(201).json({
      message: "Product created successfully",
      product: product,
    });
  } catch (err) {
    console.error("Add product error:", err);

    // Handle validation errors specifically
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate entry",
        message: "A product with this information already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to create product",
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments();

    res.status(200).json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    // First, check if the product exists
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updateData = { ...req.body };

    // If a new image is uploaded, add its path to the update data
    if (req.file) {
      updateData.imageUrl = req.file.path;
    }

    // Validate required fields if they're being updated
    if (updateData.brand && updateData.brand.trim() === "") {
      return res.status(400).json({ message: "Brand cannot be empty" });
    }
    if (updateData.model && updateData.model.trim() === "") {
      return res.status(400).json({ message: "Model cannot be empty" });
    }
    if (updateData.price !== undefined && updateData.price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }
    if (updateData.stock !== undefined && updateData.stock < 0) {
      return res.status(400).json({ message: "Stock cannot be negative" });
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true, // Ensure schema validation runs on update
    });

    console.log("Product updated successfully:", updated._id);
    res.status(200).json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    console.error("Update product error:", err);

    // Handle validation errors specifically
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({
        error: "Duplicate entry",
        message: "A product with this information already exists",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update product",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.searchProducts = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const results = await Product.find({
      $or: [
        { brand: { $regex: query, $options: "i" } },
        { model: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).select("_id brand model price stock imageUrl description");

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
