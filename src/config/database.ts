import mongoose from "mongoose";
import config from "./index";

/**
 * Database connection configuration
 */
class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: process.env.VERCEL ? 5 : 10, // Smaller pool for serverless
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: process.env.VERCEL ? true : false, // Buffer commands in serverless
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      };

      await mongoose.connect(config.MONGODB_URI, options);

      console.log("✅ MongoDB connected successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("🔄 MongoDB reconnected");
      });
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      process.exit(1);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log("✅ MongoDB disconnected successfully");
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error);
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): string {
    return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  }
}

export default Database.getInstance();
