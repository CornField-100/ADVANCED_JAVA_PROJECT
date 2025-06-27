const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");
const { validateProductInput } = require("../middleware/validation");
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
  validateProductInput,
  addProduct
);

// Get all products (public)
router.get("/getAllProduct", getAllProducts);

// Get a single product by ID (public)
router.get("/:id", getProductById);

// Get product for editing (admin only) - returns more detailed info
router.get("/:id/edit", verifyToken, isAdmin, getProductById);

// Update product (protected - admin only)
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  sharpMiddleware(),
  validateProductInput,
  updateProduct
);

// Delete product (protected - admin only)
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

module.exports = router;
