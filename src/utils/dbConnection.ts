import mongoose from "mongoose";
import config from "../config";

// Global variable to cache the database connection
let cachedConnection: typeof mongoose | null = null;

/**
 * Connect to MongoDB with connection caching for serverless environments
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // If we have a cached connection and it's ready, return it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // If we're already connecting, wait for it
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once("connected", () => resolve(mongoose));
      mongoose.connection.once("error", reject);
    });
  }

  try {
    const options = {
      maxPoolSize: process.env.VERCEL ? 5 : 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true, // Always buffer for serverless
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
    };

    console.log("Connecting to MongoDB...");
    cachedConnection = await mongoose.connect(config.MONGODB_URI, options);
    console.log("✅ MongoDB connected successfully");

    return cachedConnection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    cachedConnection = null;
    throw error;
  }
}

/**
 * Get the current connection status
 */
export function getConnectionStatus(): string {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return (
    states[mongoose.connection.readyState as keyof typeof states] || "unknown"
  );
}

/**
 * Ensure database connection with retry logic
 */
export async function ensureConnection(
  maxRetries = 3
): Promise<typeof mongoose> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await connectToDatabase();
    } catch (error) {
      lastError = error as Error;
      console.error(
        `Connection attempt ${attempt}/${maxRetries} failed:`,
        error
      );

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw (
    lastError ||
    new Error("Failed to connect to database after multiple attempts")
  );
}
