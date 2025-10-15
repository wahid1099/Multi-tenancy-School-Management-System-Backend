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
        url: `https://multi-tenancy-school-management-sys.vercel.app/api/${config.API_VERSION}`,
        description: "Production server (Vercel)",
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
  // Custom API documentation page (no external dependencies)
  app.get("/api-docs", (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>School Management API Documentation</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .endpoint { margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px; background: #fafafa; }
        .method { display: inline-block; padding: 6px 12px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px; text-transform: uppercase; }
        .get { background-color: #61affe; }
        .post { background-color: #49cc90; }
        .patch { background-color: #fca130; }
        .delete { background-color: #f93e3e; }
        .path { font-family: 'Courier New', monospace; font-size: 16px; margin: 10px 0; color: #333; font-weight: bold; }
        .description { color: #666; margin: 10px 0; line-height: 1.5; }
        .section { margin: 30px 0; }
        .section h2 { color: #333; border-bottom: 2px solid #61affe; padding-bottom: 10px; }
        .base-url { background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .links { text-align: center; margin: 30px 0; }
        .links a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #61affe; color: white; text-decoration: none; border-radius: 4px; }
        .links a:hover { background: #4e90d9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 School Management API Documentation</h1>
          <p>Multi-tenant School Management System with Role-based Access Control</p>
        </div>
        
        <div class="base-url">
          <strong>Base URL:</strong> <code>${req.protocol}://${req.get(
      "host"
    )}/api/v1</code>
        </div>
        
        <div class="section">
          <h2>🔐 Authentication</h2>
          <div class="endpoint">
            <span class="method post">POST</span>
            <div class="path">/users/register</div>
            <div class="description">Register a new user account with tenant validation</div>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <div class="path">/users/login</div>
            <div class="description">User login with JWT token generation</div>
          </div>
        </div>
        
        <div class="section">
          <h2>👥 Role Management</h2>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/users/available-roles</div>
            <div class="description">Get roles that current user can create (hierarchical validation)</div>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <div class="path">/users</div>
            <div class="description">Create user with role hierarchy validation</div>
          </div>
          <div class="endpoint">
            <span class="method patch">PATCH</span>
            <div class="path">/users/:id/role</div>
            <div class="description">Update user role with hierarchical permission checks</div>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/users/role-hierarchy</div>
            <div class="description">Get complete role hierarchy information</div>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Audit System</h2>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/audit/logs</div>
            <div class="description">Get audit logs with filtering (action, user, date range)</div>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/audit/stats</div>
            <div class="description">Get audit statistics and analytics</div>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/audit/export</div>
            <div class="description">Export audit logs to CSV (Manager+ only)</div>
          </div>
        </div>
        
        <div class="section">
          <h2>🏥 System Health</h2>
          <div class="endpoint">
            <span class="method get">GET</span>
            <div class="path">/health</div>
            <div class="description">Health check endpoint with system status</div>
          </div>
        </div>
        
        <div class="links">
          <a href="/api-docs.json" target="_blank">📄 OpenAPI JSON Spec</a>
          <a href="https://petstore.swagger.io/?url=${req.protocol}://${req.get(
      "host"
    )}/api-docs.json" target="_blank">🔗 Open in Swagger Editor</a>
        </div>
        
        <div style="margin-top: 40px; padding: 20px; background: #e8f4fd; border-radius: 6px;">
          <h3>🚀 Quick Start</h3>
          <p><strong>1. Register/Login:</strong> Use <code>/users/register</code> or <code>/users/login</code></p>
          <p><strong>2. Get Token:</strong> Include JWT token in Authorization header: <code>Bearer your-token</code></p>
          <p><strong>3. Test API:</strong> Use the OpenAPI spec with Postman, Insomnia, or Swagger Editor</p>
        </div>
      </div>
    </body>
    </html>
    `;
    res.send(html);
  });

  // Docs in JSON format
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });
};

export default specs;
