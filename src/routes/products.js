const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

// Create a product
router.post("/addProduct", verifyToken, addProduct);

// Get all products
router.get("/getAllProduct", getAllProducts);

// Get product by ID
router.get("/:id",verifyToken, getProductById);

// Update product
router.put("/:id",verifyToken, updateProduct);

// Delete product
router.delete("/:id",verifyToken, deleteProduct);

module.exports = router;
