/**
 * Express app initialization and setup.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectMongoDB } from "@jhaz-imprints/catalog-db";
import ordersRouter from "./routes/orders";
import uploadsRouter from "./routes/uploads";
import productsRouter from "./routes/products";
import authRouter from "./routes/auth";
import adminProductsRouter from "./routes/adminProducts";
import helmet from "helmet";
import { AppError, isAppError } from "./errors/AppError";
import { startNotificationWorker } from "./queues/notificationWorker";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
let mongoConnected = false;
connectMongoDB()
  .then(() => {
    mongoConnected = true;
    console.log("[App] MongoDB connected");
  })
  .catch((error) => {
    console.error("[App] MongoDB connection failed:", error);
    process.exit(1);
  });

// Start notification worker
const notificationWorker = startNotificationWorker();
console.log("[App] Notification worker started");

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/v1/admin/uploads", uploadsRouter);
app.use("/api/v1/admin/products", adminProductsRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[App] Error:", err);

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Generic error response
  res.status(500).json({
    error: "Internal server error",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[App] Shutting down gracefully...");
  await notificationWorker.close();
  process.exit(0);
});

export default app;