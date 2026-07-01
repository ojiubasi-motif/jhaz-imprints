import mongoose, { Connection } from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jhaz-imprints";
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

let connection: Connection | null = null;
let disconnectTimeout: NodeJS.Timeout | null = null;

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
      maxIdleTimeMS: 30000,              // Close idle connections after 30s
      serverSelectionTimeoutMS: 5000,     // Fail fast if no server available
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',                     // Write concern for data durability
    });

    connection = mongoose.connection;

    console.log("[MongoDB] Connected successfully");

    // Handle connection events once to prevent event listener leaks
    if (connection.listenerCount("disconnected") === 0) {
      connection.on("disconnected", () => {
        console.warn("[MongoDB] Disconnected");
        // Start a 30-second countdown to exit if connection doesn't recover
        if (!disconnectTimeout) {
          console.warn("[MongoDB] Lost connection. Initiating 30-second shutdown countdown...");
          disconnectTimeout = setTimeout(() => {
            console.error("[MongoDB] Connection could not recover in 30s. Exiting process so container orchestrator restarts...");
            process.exit(1);
          }, 30000);
        }
      });
    }

    if (connection.listenerCount("connected") === 0) {
      connection.on("connected", () => {
        if (disconnectTimeout) {
          console.log("[MongoDB] Connection recovered successfully. Aborting shutdown countdown.");
          clearTimeout(disconnectTimeout);
          disconnectTimeout = null;
        }
      });
    }

    if (connection.listenerCount("reconnected") === 0) {
      connection.on("reconnected", () => {
        if (disconnectTimeout) {
          console.log("[MongoDB] Connection recovered successfully. Aborting shutdown countdown.");
          clearTimeout(disconnectTimeout);
          disconnectTimeout = null;
        }
      });
    }

    if (connection.listenerCount("error") === 0) {
      connection.on("error", (error) => {
        console.error("[MongoDB] Connection error:", error);
      });
    }

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
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
      }
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
