import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getUsers,
  updateUser,
  toggleUserStatus,
  getUserStats,
  searchUsers,
} from "./user.controller";
import { authenticate, authorize } from "../../middlewares/auth";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Authenticated routes (any role)
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

// Admin-only routes
router.get("/", authenticate, authorize("admin"), searchUsers);
router.get("/stats", authenticate, authorize("admin"), getUserStats);
router.patch("/:id", authenticate, authorize("admin"), updateUser);
router.patch("/:id/status", authenticate, authorize("admin"), toggleUserStatus);

export default router;
