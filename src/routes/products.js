const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
    addProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts
} = require("../controllers/productController");

router.get("/search", searchProducts);

router.post("/addProduct", verifyToken, addProduct);

router.get("/getAllProduct", getAllProducts);

router.get("/:id", verifyToken, getProductById);

router.put("/:id", verifyToken, updateProduct);

router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
