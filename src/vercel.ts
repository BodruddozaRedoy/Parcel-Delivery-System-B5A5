import app from "./app";
import connectDB from "./app/config/db";

// Ensure DB is connected on cold start in Vercel
// Avoid awaiting at top-level to keep init fast; fire-and-forget
// but still handle unhandled rejections gracefully.
(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection failed during Vercel init:", err);
  }
})();

export default app;

