const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getMyInvoices,
} = require("../controllers/invoiceController");

// Create a new invoice (auth required)
router.post("/createInvoice", verifyToken, createInvoice);

// Get all invoices (admin only ideally — for now no restriction)
router.get("/getAllInvoice", verifyToken, getAllInvoices);

// Get invoice by ID
router.get("/:id", getInvoiceById);

// Get current user's invoices
router.get("/user/mine", verifyToken, getMyInvoices);

module.exports = router;
