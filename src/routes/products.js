const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
} = require("../controllers/productController");

// Public product search
router.get("/search", searchProducts);

// Add product (protected)
router.post("/addProduct", verifyToken, addProduct);

// Get all products (public)
router.get("/getAllProduct", getAllProducts);

// Get a single product by ID (public - no verifyToken here)
router.get("/:id", getProductById);

// Update product (protected)
router.put("/:id", verifyToken, updateProduct);

// Delete product (protected)
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
