const Product = require("../models/productModels");

exports.addProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.searchProducts = async (req, res) => {
  console.log("🔍 SEARCH REQUEST RECEIVED");
  console.log("Headers:", req.headers);
  console.log("Query:", req.query);

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const results = await Product.find({
      $or: [
        { brand: { $regex: query, $options: "i" } }
      ],
    });

    res.status(200).json(results);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
