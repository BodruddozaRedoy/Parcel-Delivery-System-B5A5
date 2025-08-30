import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import userRoutes from "./app/modules/user/user.route";
import parcelRoutes from "./app/modules/parcel/parcel.route";

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:6565"],
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to parcel delivery system");
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/parcels", parcelRoutes);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "API is running" });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

export default app;
