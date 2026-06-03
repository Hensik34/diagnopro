const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate, authorize, PERMISSIONS } = require("../middlewere/authorize");

// ==========================================
// AUTH ROUTES
// ==========================================

// Public routes (no authentication required)
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/check-email", authController.checkEmail);

// Forgot password flow (public)
router.post("/forgot-password", authController.forgotPassword);
router.post("/verify-otp", authController.verifyOtp);
router.post("/reset-password", authController.resetPassword);

// Protected routes (authentication only, no specific permission needed)
router.get("/profile", authenticate, authController.getUserProfile);
router.put("/profile", authenticate, authController.updateUserProfile);

// ==========================================
// ADMIN USER MANAGEMENT ROUTES
// ==========================================

// Create sub-user (staff, technician, doctor)
router.post("/users", authorize(PERMISSIONS.USER_CREATE), authController.createUser);

// Get all users
router.get("/users", authorize(PERMISSIONS.USER_READ), authController.getAllUsers);

// Update user (role, name, phone)
router.put("/users/:id", authorize(PERMISSIONS.USER_UPDATE), authController.updateUser);

// Toggle user active/inactive
router.patch("/users/:id/status", authorize(PERMISSIONS.USER_UPDATE), authController.toggleUserStatus);

module.exports = router;
