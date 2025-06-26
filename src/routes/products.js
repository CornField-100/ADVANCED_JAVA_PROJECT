const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const upload = require("../config/multerConfig");
const sharpMiddleware = require("../middleware/sharpMiddleware");
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

// Add product (protected - admin only)
router.post(
  "/addProduct",
  verifyToken,
  isAdmin,
  upload.single("image"),
  sharpMiddleware(),
  addProduct
);

// Get all products (public)
router.get("/getAllProduct", getAllProducts);

// Get a single product by ID (public)
router.get("/:id", getProductById);

// Update product (protected - admin only)
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  sharpMiddleware(),
  updateProduct
);

// Delete product (protected - admin only)
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

module.exports = router;
