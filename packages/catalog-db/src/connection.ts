import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jhaz-imprints";
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

let connection: Connection | null = null;

/**
 * Connect to MongoDB with exponential backoff retry logic.
 * Handles connection pooling and graceful shutdown.
 *
 * @param retryAttempt - Current retry attempt (used internally)
 * @returns Promise that resolves when connected
 */
export async function connectMongoDB(retryAttempt = 0): Promise<Connection> {
  // Return existing connection if already established
  if (connection && connection.readyState === 1) {
    return connection;
  }

  try {
    console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
    });

    connection = mongoose.connection;

    console.log("[MongoDB] Connected successfully");

    // Handle connection events
    connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
    });

    connection.on("error", (error) => {
      console.error("[MongoDB] Connection error:", error);
    });

    return connection;
  } catch (error) {
    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt);

    if (retryAttempt < MAX_RETRIES) {
      console.warn(
        `[MongoDB] Connection attempt ${retryAttempt + 1}/${MAX_RETRIES} failed. ` +
          `Retrying in ${delay}ms...`,
        error instanceof Error ? error.message : error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectMongoDB(retryAttempt + 1);
    }
 
    console.error(
      `[MongoDB] Failed to connect after ${MAX_RETRIES} attempts.`,
      error instanceof Error ? error.message : error
    );

    throw error;
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectMongoDB(): Promise<void> {
  if (connection) {
    try {
      await mongoose.disconnect();
      connection = null;
      console.log("[MongoDB] Disconnected gracefully");
    } catch (error) {
      console.error("[MongoDB] Error during disconnection:", error);
      throw error;
    }
  }
}

/**
 * Get the current MongoDB connection.
 * Throws an error if not connected.
 */
export function getMongoDBConnection(): Connection {
  if (!connection || connection.readyState !== 1) {
    throw new Error("MongoDB is not connected. Call connectMongoDB() first.");
  }
  return connection;
}
