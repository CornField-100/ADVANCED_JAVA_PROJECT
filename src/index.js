const express = require("express");
const app = express();
const port = 3001;
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const orderRoutes = require("./routes/order");
const connectDB = require("./utils/db");
const allowedOrigins = [
  "http://localhost:5173",
  "https://frontendjava.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Request Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/orders", orderRoutes);

app.use((err, req, res, next) => {
  console.error("Express error handler:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
