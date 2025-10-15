import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import config from "../config";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: config.SWAGGER_TITLE,
      version: config.SWAGGER_VERSION,
      description: config.SWAGGER_DESCRIPTION,
      contact: {
        name: "API Support",
        email: "support@schoolmanagement.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
        description: "Development server",
      },
      {
        url: `https://api.schoolmanagement.com/api/${config.API_VERSION}`,
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Health",
        description: "Health check endpoints",
      },
      {
        name: "Tenants",
        description: "Tenant management endpoints",
      },
      {
        name: "Users",
        description: "User management and authentication endpoints",
      },
      {
        name: "Students",
        description: "Student management endpoints",
      },
      {
        name: "Teachers",
        description: "Teacher management endpoints",
      },
      {
        name: "Classes",
        description: "Class management endpoints",
      },
      {
        name: "Attendance",
        description: "Attendance tracking endpoints",
      },
      {
        name: "Exams",
        description: "Exam management endpoints",
      },
      {
        name: "Grades",
        description: "Grade management endpoints",
      },
      {
        name: "Timetable",
        description: "Timetable management endpoints",
      },
      {
        name: "Fees",
        description: "Fee management endpoints",
      },
      {
        name: "Notifications",
        description: "Notification system endpoints",
      },
      {
        name: "Library",
        description: "Library management endpoints",
      },
      {
        name: "Dashboard",
        description: "Dashboard and analytics endpoints",
      },
    ],
  },
  apis: [
    "./src/routes/*.ts",
    "./src/modules/**/*.routes.ts",
    "./src/modules/**/*.controller.ts",
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger page
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "School Management API Documentation",
    })
  );

  // Docs in JSON format
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};

export default specs;
