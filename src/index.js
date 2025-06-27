const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
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
const reviewRoutes = require("./routes/reviews");
const cartRoutes = require("./routes/cart");
const adminRoutes = require("./routes/admin");
const connectDB = require("./utils/db");

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allows embedding content from other origins
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://advanced-java-project.onrender.com",
  "https://frontendjava.netlify.app",
];
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Request Origin:", origin);
      if (
        process.env.NODE_ENV === "production" &&
        (!origin || !allowedOrigins.includes(origin))
      ) {
        console.log("❌ Blocked by CORS (production):", origin);
        callback(new Error("Not allowed by CORS"));
      } else if (!origin || allowedOrigins.includes(origin)) {
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
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error("Express error handler:", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
