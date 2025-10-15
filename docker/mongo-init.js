// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the school_management database
db = db.getSiblingDB("school_management");

// Create collections with validation
db.createCollection("tenants", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "subdomain", "address", "contact"],
      properties: {
        name: {
          bsonType: "string",
          description: "Tenant name is required",
        },
        subdomain: {
          bsonType: "string",
          description: "Subdomain is required and must be unique",
        },
        address: {
          bsonType: "object",
          required: ["street", "city", "state", "zipCode", "country"],
          description: "Address is required",
        },
        contact: {
          bsonType: "object",
          required: ["email", "phone"],
          description: "Contact information is required",
        },
      },
    },
  },
});

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "tenant",
        "firstName",
        "lastName",
        "email",
        "password",
        "role",
      ],
      properties: {
        tenant: {
          bsonType: "string",
          description: "Tenant ID is required",
        },
        firstName: {
          bsonType: "string",
          description: "First name is required",
        },
        lastName: {
          bsonType: "string",
          description: "Last name is required",
        },
        email: {
          bsonType: "string",
          description: "Email is required",
        },
        role: {
          bsonType: "string",
          enum: ["admin", "tenant_admin", "teacher", "student", "parent"],
          description: "Role must be one of the allowed values",
        },
      },
    },
  },
});

// Create indexes for better performance
db.tenants.createIndex({ subdomain: 1 }, { unique: true });
db.tenants.createIndex({ "contact.email": 1 }, { unique: true });
db.tenants.createIndex({ isActive: 1 });

db.users.createIndex({ tenant: 1, email: 1 }, { unique: true });
db.users.createIndex({ tenant: 1, role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ isEmailVerified: 1 });

// Create a default admin user (optional - remove in production)
// db.users.insertOne({
//   tenant: 'system',
//   firstName: 'System',
//   lastName: 'Admin',
//   email: 'admin@system.com',
//   password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6UP9Dv/u2O', // password123
//   role: 'admin',
//   isActive: true,
//   isEmailVerified: true,
//   createdAt: new Date(),
//   updatedAt: new Date()
// });

print("Database initialization completed successfully!");
