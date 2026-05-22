/**
 * Express app initialization and setup.
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectMongoDB } from "@jhaz-imprints/catalog-db";
import { prisma } from "@jhaz-imprints/db";
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
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Initialize databases
let mongoConnected = false;
let prismaConnected = false;

/**
 * Initialize all database connections before the app accepts requests
 */
export async function initializeDatabases() {
  try {
    // Connect to MongoDB (catalog)
    await connectMongoDB();
    mongoConnected = true;
    console.log("[App] MongoDB connected");
  } catch (error) {
    console.error("[App] MongoDB connection failed:", error);
    process.exit(1);
  }

  try {
    // Test Prisma connection (PostgreSQL)
    await prisma.$queryRaw`SELECT 1`;
    prismaConnected = true;
    console.log("[App] PostgreSQL (Prisma) connected");
  } catch (error) {
    console.error("[App] PostgreSQL connection failed:", error);
    process.exit(1);
  }

  try {
    // Start notification worker
    startNotificationWorker();
    console.log("[App] Notification worker started");
  } catch (error) {
    console.error("[App] Failed to start notification worker:", error);
    // Don't exit - notifications are non-critical
  }
}

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
    postgresql: prismaConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[App] Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const type = err.type || (statusCode >= 500 ? "SERVER_ERROR" : "FAILED");
  const code = err.code || 602;

  // Quizio-style envelope
  res.status(statusCode).json({
    msg: err.message || "Internal server error",
    data: err.errors || null, // For validation errors
    type: type,
    code: code
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
  await prisma.$disconnect();
  process.exit(0);
});

export default app;