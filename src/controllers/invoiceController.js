const Invoice = require("../models/invoiceModel");
const Product = require("../models/productModels");

// Create Invoice
exports.createInvoice = async (req, res) => {
    try {
        const { products } = req.body;
        const userId = req.userId; // From verifyToken middleware

        let total = 0;
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ error: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ error: `Not enough stock for ${product.model}` });
            }
            total += product.price * item.quantity;
        }

        // Create invoice
        const invoice = new Invoice({
            user: userId,
            products,
            total
        });

        // Save invoice
        await invoice.save();

        // Update stock
        for (const item of products) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all invoices (admin or yourself)
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate("user", "email") // Assuming User has email
            .populate("products.product", "brand model price");
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("user", "email")
            .populate("products.product", "brand model price");

        if (!invoice) return res.status(404).json({ message: "Invoice not found" });

        // Optionally restrict if not admin/user owner
        res.status(200).json(invoice);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get invoices by current user
exports.getMyInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.userId })
            .populate("products.product", "brand model price");
        res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
