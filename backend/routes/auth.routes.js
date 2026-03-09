// Authentication routes
const express = require("express");
const {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  logoutUser,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimit.middleware");
const { validate } = require("../middleware/validate.middleware");
const { authSchemas } = require("../validation/schemas");

const router = express.Router();

router.post("/register", authLimiter, validate(authSchemas.register), registerUser);
router.post("/verify-otp", otpLimiter, validate(authSchemas.verifyOtp), verifyOtp);
router.post("/login", authLimiter, validate(authSchemas.login), loginUser);
router.post("/forgot-password", otpLimiter, validate(authSchemas.forgotPassword), forgotPassword);
router.post("/reset-password", otpLimiter, validate(authSchemas.resetPassword), resetPassword);
router.get("/me", protect, getMe);
router.patch("/me", protect, validate(authSchemas.updateProfile), updateProfile);
router.post("/logout", protect, logoutUser);

module.exports = router;
