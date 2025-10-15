const mongoose = require("mongoose");

async function testConnection() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/school-management";
    console.log(
      "Testing connection to:",
      mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")
    );

    const options = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
    };

    console.log("Connecting...");
    await mongoose.connect(mongoUri, options);
    console.log("✅ Connection successful!");

    // Test a simple query
    console.log("Testing query...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      `✅ Found ${collections.length} collections:`,
      collections.map((c) => c.name)
    );

    // Test tenant query specifically
    const Tenant = mongoose.model(
      "Tenant",
      new mongoose.Schema({
        name: String,
        subdomain: String,
        isActive: Boolean,
      })
    );

    const tenantCount = await Tenant.countDocuments();
    console.log(`✅ Found ${tenantCount} tenants in database`);

    if (tenantCount === 0) {
      console.log(
        "⚠️  No tenants found. You may need to run: npm run seed:demo"
      );
    } else {
      const demoTenant = await Tenant.findOne({ subdomain: "demo-school" });
      if (demoTenant) {
        console.log("✅ Demo tenant found:", demoTenant._id);
      } else {
        console.log("⚠️  Demo tenant not found. Run: npm run seed:demo");
      }
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database");
  }
}

testConnection();
