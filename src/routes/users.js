const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { hashPassword } = require("../middleware/passencrypt");
const {
  userLogIn,
  userSignUp,
  updateUser,
  getUser,
  getUserDashboard,
  getUserOrders,
} = require("../controllers/userControllers");
const { verifyToken } = require("../middleware/auth");
const upload = require("../config/multerConfig");
const sharpMiddleware = require("../middleware/sharpMiddleware");
const {
  validateUserInput,
  validatePassword,
} = require("../middleware/validation");

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

//login route
router.post("/login", authLimiter, userLogIn);

//signup route
router.post(
  "/signup",
  validateUserInput,
  validatePassword,
  hashPassword,
  userSignUp
);

// Update user route
// The route is protected by the verifyToken middleware
router.put(
  "/userUpdate",
  verifyToken,
  validateUserInput,
  upload.single("image"),
  sharpMiddleware(),
  updateUser
);

router.get("/getuser", verifyToken, getUser);

// User dashboard routes
router.get("/dashboard", verifyToken, getUserDashboard);
router.get("/orders", verifyToken, getUserOrders);

module.exports = router;
