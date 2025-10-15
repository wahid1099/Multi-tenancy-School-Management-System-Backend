// Simple script to create demo tenant directly in MongoDB
const { MongoClient } = require("mongodb");

const MONGODB_URI =
  "mongodb+srv://wahid007:FS2irXPIAhn3PhPd@cluster0.xqvgyvn.mongodb.net/Multi_tanent_school_management?retryWrites=true&w=majority&appName=Cluster0";

async function createDemoTenant() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Multi_tanent_school_management");
    const tenantsCollection = db.collection("tenants");

    // Check if demo tenant already exists
    const existingTenant = await tenantsCollection.findOne({
      subdomain: "demo-school",
    });

    if (existingTenant) {
      console.log("✅ Demo tenant already exists:", existingTenant._id);
      return;
    }

    // Create demo tenant
    const demoTenant = {
      name: "Demo School",
      subdomain: "demo-school",
      address: {
        street: "123 Demo Street",
        city: "Demo City",
        state: "Demo State",
        zipCode: "12345",
        country: "Demo Country",
      },
      contact: {
        email: "admin@demo-school.com",
        phone: "+1-555-0123",
        website: "https://demo-school.com",
      },
      settings: {
        timezone: "UTC",
        currency: "USD",
        language: "en",
        academicYearStart: new Date("2024-09-01"),
        academicYearEnd: new Date("2025-06-30"),
      },
      subscription: {
        plan: "premium",
        status: "active",
        startDate: new Date(),
        endDate: new Date("2025-12-31"),
        maxUsers: 100,
        maxStudents: 1000,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tenantsCollection.insertOne(demoTenant);
    console.log("✅ Demo tenant created successfully:", result.insertedId);
  } catch (error) {
    console.error("❌ Error creating demo tenant:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

createDemoTenant();
