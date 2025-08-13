import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getUsers,
  updateUser,
  toggleUserStatus,
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
router.get("/", authenticate, authorize("admin"), getUsers);
router.patch("/:id", authenticate, authorize("admin"), updateUser);
router.patch("/:id/status", authenticate, authorize("admin"), toggleUserStatus);

export default router;
