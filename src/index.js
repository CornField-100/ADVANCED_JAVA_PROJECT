const express = require("express");
const app = express();
const port = 3001;
const path = require("path");
const cors = require("cors");

const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const connectDB = require("./utils/db");

const allowedOrigins = [
  "https://frontendjava.netlify.app",
  "http://localhost:5173", // Optional: remove if not needed
];

app.use(
  cors({
    origin: function (origin, callback) {
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

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});

// 📦 Routes
app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/invoices", invoiceRoutes);
