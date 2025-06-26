const express = require("express");
const router = express.Router();
const { hashPassword } = require("../middleware/passencrypt");
const {
  userLogIn,
  userSignUp,
  updateUser,
  getUser,
} = require("../controllers/userControllers");
const { verifyToken } = require("../middleware/auth");
const upload = require("../config/multerConfig");
const sharpMiddleware = require("../middleware/sharpMiddleware");

//login route
router.post("/login", userLogIn);

//signup route
router.post("/signup", hashPassword, userSignUp);

// Update user route
// The route is protected by the verifyToken middleware
router.put(
  "/userUpdate",
  verifyToken,
  upload.single("image"),
  sharpMiddleware(),
  updateUser
);

router.get("/getuser", verifyToken, getUser);

module.exports = router;
