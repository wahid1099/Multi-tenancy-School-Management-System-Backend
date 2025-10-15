import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import config from "../config";
import routes from "../routes";
import globalErrorHandler from "../middlewares/error.middleware";
import { setupSwagger } from "../docs/swagger";
import AppError from "../utils/AppError";

/**
 * Create Express application
 */
const createApp = (): Express => {
  const app = express();

  // Trust proxy (for deployment behind reverse proxy)
  app.set("trust proxy", 1);

  // Security middleware - Modified for Swagger compatibility
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://unpkg.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
          connectSrc: ["'self'"],
        },
      },
    })
  );

  // Example: Express CORS configuration
  const corsOptions = {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) {
      const allowedOrigins = [
        "http://localhost:5173", // ✅ hardcoded allowed URL
        ...config.CORS_ORIGIN, // ✅ keep your config-based origins
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost in development
      if (config.NODE_ENV === "development" && origin.includes("localhost")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression middleware
  app.use(compression());

  // Logging middleware
  if (config.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // API documentation
  setupSwagger(app);

  // Root route
  app.get("/", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Welcome to Multi tanent School Management System API",
      version: config.API_VERSION,
      documentation: "/api-docs",
      health: "/api/v1/health",
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  });

  // Health check route for Vercel
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
    });
  });

  // API routes
  app.use(`/api/${config.API_VERSION}`, routes);

  // Handle undefined routes
  app.all("*", (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global error handling middleware
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
