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
  "http://localhost:3000",
  "https://advanced-java-project.onrender.com",
  "https://frontendjava.netlify.app",
];
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Request Origin:", origin);
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);

  // Log request body for POST/PATCH/PUT requests
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }

  // Log authorization header (without exposing the token)
  if (req.headers.authorization) {
    console.log(
      "Authorization header present:",
      req.headers.authorization ? "Yes" : "No"
    );
  }

  // Intercept response to log status codes
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`Response ${res.statusCode} for ${req.method} ${req.path}`);
    if (res.statusCode >= 400) {
      console.log(
        "Error response:",
        typeof data === "string" ? data : JSON.stringify(data, null, 2)
      );
    }
    originalSend.call(this, data);
  };

  next();
});

connectDB();

app.use("/api/users", userRoutes);
app.use("/api/product", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      orders: {
        create: "POST /api/orders",
        getAll: "GET /api/orders",
        update: "PATCH /api/orders/:orderId",
        delete: "DELETE /api/orders/:orderId",
      },
    },
  });
});

// Debug orders endpoint
app.get("/api/orders/debug", async (req, res) => {
  try {
    const Order = require("./models/orderModel");
    const orders = await Order.find({}).limit(5);
    res.json({
      count: orders.length,
      sample: orders,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
