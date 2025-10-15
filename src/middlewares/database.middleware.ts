import { Request, Response, NextFunction } from "express";
import { ensureConnection, getConnectionStatus } from "../utils/dbConnection";

/**
 * Middleware to ensure database connection before processing requests
 */
export const ensureDatabaseConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await ensureConnection();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

/**
 * Middleware specifically for API routes that need database access
 */
export const requireDatabaseConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(`Database connection status: ${getConnectionStatus()}`);
    await ensureConnection();
    console.log("Database connection established for API request");
    next();
  } catch (error) {
    console.error("Failed to establish database connection:", error);
    res.status(503).json({
      success: false,
      message: "Service temporarily unavailable - database connection failed",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};
