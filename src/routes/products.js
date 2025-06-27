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

// Test endpoint for debugging
router.post("/test", verifyToken, (req, res) => {
  console.log("Test endpoint hit");
  console.log("User:", req.user);
  console.log("Body:", req.body);
  console.log("File:", req.file);
  res.json({
    message: "Test successful",
    user: req.user,
    body: req.body,
  });
});

// Add product (protected - temporarily remove admin check for testing)
router.post(
  "/addProduct",
  verifyToken,
  // isAdmin, // Temporarily commented out for testing
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
