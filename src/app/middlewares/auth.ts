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

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token; // Read JWT from cookie
  // console.log(token)
  if (!token) return res.status(401).json({ message: "Token not found" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden: Access denied" });
    next();
  };
