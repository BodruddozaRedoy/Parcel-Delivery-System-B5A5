import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./user.model";
import { Status } from "../../interfaces/user.interface";

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
    const { fullName, email, phone, password, role } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    await user.save();

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: "1d",
    });

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Get own profile
export const getMe = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const { password, ...userData } = req.user.toObject();
  return res.status(200).json(userData);
};

// Update own profile
export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const updateData: any = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select("-password");

    return res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Update user by ID
export const updateUser = async (req: Request, res: Response) => {
  try {
    const updateData: any = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User updated", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Block/unblock user
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === Status.ACTIVE ? Status.BANNED : Status.ACTIVE;
    await user.save();

    return res.status(200).json({ message: `User ${user.status}`, user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
