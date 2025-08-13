import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./app/config/db";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
