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
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
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
