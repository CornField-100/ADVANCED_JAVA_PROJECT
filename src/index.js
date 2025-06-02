const express = require("express");
const app = express();
const port = 3001;
const userRoutes = require("./routes/users")
const productRoutes = require("./routes/products")
const invoiceRoutes = require("./routes/invoices");
const path = require("path");
const cors = require("cors");

const randomInt = (max) => Math.floor(Math.random() * max);

//Connect to DB
const connectDB = require("./utils/db")

//New middleware 
app.use(express.json())

//image folder middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// cors middleware
app.use(cors({
  origin: "https://frontendjava.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

connectDB()

// Start server
app.listen(port, () => {
    console.log(`Example app running at http://localhost:${port}`);
});

//ROUTES
app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/invoices", invoiceRoutes);
