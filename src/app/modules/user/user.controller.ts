import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "./user.model";
import { Status, Role } from "../../interfaces/user.interface";

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Input validation
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (role && !Object.values(Role).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already in use"
            : "Phone number already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: role || Role.SENDER,
    });

    await user.save();

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if user is banned
    if (user.status === Status.BANNED) {
      return res.status(403).json({
        success: false,
        message: "Account is banned. Please contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    const payload = { id: user._id, role: user.role };
    const secret = process.env.JWT_SECRET;
    const options: jwt.SignOptions = {
      expiresIn: "7d",
    };

    const token = jwt.sign(payload, secret, options);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Get own profile
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { password, ...userData } = req.user.toObject();
    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// Logout
export const logoutUser = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};


// Update own profile
export const updateMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { email, role, ...updateData } = req.body;

    // Prevent role and email changes
    if (email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed",
      });
    }

    if (role) {
      return res.status(400).json({
        success: false,
        message: "Role cannot be changed",
      });
    }

    // Hash password if provided
    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

// Admin: Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// Admin: Update user by ID
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { email, role, ...updateData } = req.body;

    // Prevent email changes
    if (email) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed",
      });
    }

    // Validate role if provided
    if (role && !Object.values(Role).includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified",
      });
    }

    // Hash password if provided
    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
    });
  }
};

// Admin: Block/unblock user
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from blocking themselves
    if (user._id.equals(req.user!._id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot change your own status",
      });
    }

    user.status = user.status === Status.ACTIVE ? Status.BANNED : Status.ACTIVE;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.status} successfully`,
      data: user,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user status",
    });
  }
};

// Admin: Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: Status.ACTIVE });
    const bannedUsers = await User.countDocuments({ status: Status.BANNED });
    const senderUsers = await User.countDocuments({ role: "sender" });
    const receiverUsers = await User.countDocuments({ role: "receiver" });
    const adminUsers = await User.countDocuments({ role: "admin" });

    return res.status(200).json({
      success: true,
      message: "User statistics fetched successfully",
      data: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        byRole: {
          sender: senderUsers,
          receiver: receiverUsers,
          admin: adminUsers,
        },
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user statistics",
    });
  }
};

// Admin: Search users with filters
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching users",
    });
  }
};
