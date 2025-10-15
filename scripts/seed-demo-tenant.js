const mongoose = require("mongoose");

// Tenant Schema (simplified for seeding)
const tenantSchema = new mongoose.Schema(
  {
    name: String,
    subdomain: String,
    domain: String,
    logo: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    contact: {
      email: String,
      phone: String,
      website: String,
    },
    settings: {
      timezone: { type: String, default: "UTC" },
      currency: { type: String, default: "USD" },
      language: { type: String, default: "en" },
      academicYearStart: Date,
      academicYearEnd: Date,
    },
    subscription: {
      plan: { type: String, default: "basic" },
      status: { type: String, default: "active" },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      maxUsers: { type: Number, default: 50 },
      maxStudents: { type: Number, default: 500 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Tenant = mongoose.model("Tenant", tenantSchema);

async function seedDemoTenant() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/school-management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if demo tenant already exists
    const existingTenant = await Tenant.findOne({ subdomain: "demo-school" });

    if (existingTenant) {
      console.log("Demo tenant already exists:", existingTenant._id);
      return;
    }

    // Create demo tenant
    const demoTenant = new Tenant({
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
    });

    await demoTenant.save();
    console.log("Demo tenant created successfully:", demoTenant._id);
    console.log("Subdomain:", demoTenant.subdomain);
  } catch (error) {
    console.error("Error seeding demo tenant:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seeding function
seedDemoTenant();
