const express = require("express");
const router = express.Router();
const {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

// Create a product
router.post("/addProduct", addProduct);

// Get all products
router.get("/getAllProduct", getAllProducts);

// Get product by ID
router.get("/:id", getProductById);

// Update product
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

module.exports = router;
