import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../modules/user/user.model";

// Extend Express Request to include `user`
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

interface JwtPayload {
  id: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for token in cookies first, then in Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is banned
    if (user.status === "banned") {
      return res.status(403).json({
        success: false,
        message: "Account is banned. Please contact support.",
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied. Insufficient permissions.",
      });
    }

    next();
  };
