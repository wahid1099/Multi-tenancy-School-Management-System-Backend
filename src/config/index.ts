import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Config {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  MONGODB_URI: string;
  DB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  SWAGGER_TITLE: string;
  SWAGGER_DESCRIPTION: string;
  SWAGGER_VERSION: string;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  API_VERSION: process.env.API_VERSION || "v1",
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/school_management",
  DB_NAME: process.env.DB_NAME || "school_management",
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SWAGGER_TITLE: process.env.SWAGGER_TITLE || "School Management API",
  SWAGGER_DESCRIPTION:
    process.env.SWAGGER_DESCRIPTION ||
    "Multi-tenant school management system API",
  SWAGGER_VERSION: process.env.SWAGGER_VERSION || "1.0.0",
};

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "MONGODB_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

export default config;
