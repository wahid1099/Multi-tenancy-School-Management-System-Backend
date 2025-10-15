import "dotenv/config";
import createApp from "./app/app";
import database from "./config/database";
import config from "./config";

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error("Error:", err.name, err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});

// Create Express app
const app = createApp();

// For Vercel, we need to export the app directly
if (process.env.VERCEL) {
  // Connect to database for Vercel
  database.connect().catch(console.error);
  module.exports = app;
} else {
  // Connect to database and start server for local development
  const startServer = async (): Promise<void> => {
    try {
      // Connect to MongoDB
      await database.connect();

      // Start server
      const server = app.listen(config.PORT, () => {
        console.log(`
🚀 Server is running!
📍 Environment: ${config.NODE_ENV}
🌐 URL: http://localhost:${config.PORT}
📚 API Docs: http://localhost:${config.PORT}/api-docs
🏥 Health Check: http://localhost:${config.PORT}/api/${config.API_VERSION}/health
        `);
      });

      // Handle unhandled promise rejections
      process.on("unhandledRejection", (err: Error) => {
        console.error("UNHANDLED REJECTION! 💥 Shutting down...");
        console.error("Error:", err.name, err.message);
        server.close(() => {
          process.exit(1);
        });
      });

      // Handle SIGTERM
      process.on("SIGTERM", () => {
        console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
        server.close(() => {
          console.log("💥 Process terminated!");
        });
      });

      // Handle SIGINT (Ctrl+C)
      process.on("SIGINT", () => {
        console.log("👋 SIGINT RECEIVED. Shutting down gracefully");
        server.close(async () => {
          await database.disconnect();
          console.log("💥 Process terminated!");
          process.exit(0);
        });
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  };

  // Start the server
  startServer();
}
