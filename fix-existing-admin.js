const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI =
  "mongodb+srv://wahid007:FS2irXPIAhn3PhPd@cluster0.xqvgyvn.mongodb.net/Multi_tanent_school_management?retryWrites=true&w=majority&appName=Cluster0";

async function fixExistingAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Multi_tanent_school_management");

    // Step 1: Create super admin if it doesn't exist
    console.log("\n=== STEP 1: Create Super Admin ===");
    const existingSuperAdmin = await db
      .collection("users")
      .findOne({ role: "super_admin" });

    let superAdminId;
    if (existingSuperAdmin) {
      console.log("✅ Super admin already exists:", existingSuperAdmin._id);
      superAdminId = existingSuperAdmin._id;
    } else {
      const superAdminResult = await db.collection("users").insertOne({
        tenant: "system",
        firstName: "Super",
        lastName: "Admin",
        email: "superadmin@system.com",
        password:
          "$2a$12$LQv3c1yqBwlFHdkPS2Y6L.hPDjx9JIcgdHMVr9jHNb6OM.LhqZqjG", // "password123"
        role: "super_admin",
        roleLevel: 5,
        roleScope: "global",
        managedTenants: [],
        permissions: [
          {
            resource: "*",
            actions: ["*"],
            scope: "global",
          },
        ],
        isActive: true,
        isEmailVerified: true,
        loginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      superAdminId = superAdminResult.insertedId;
      console.log("✅ Super admin created:", superAdminId);
    }

    // Step 2: Fix existing admin user
    console.log("\n=== STEP 2: Fix Admin User ===");
    const adminUser = await db
      .collection("users")
      .findOne({ email: "admin@demo-school.com" });

    if (adminUser) {
      console.log("Found admin user:", adminUser._id);

      // Get tenant ID
      const tenant = await db
        .collection("tenants")
        .findOne({ subdomain: "demo-school" });
      if (!tenant) {
        console.log("❌ Demo tenant not found!");
        return;
      }

      const tenantIdString = tenant._id.toString();

      // Update admin user with proper fields
      const updateResult = await db.collection("users").updateOne(
        { email: "admin@demo-school.com" },
        {
          $set: {
            createdBy: superAdminId,
            tenant: tenantIdString, // Ensure it's a string
            managedTenants: [tenantIdString],
          },
        }
      );

      console.log(
        "✅ Admin user updated:",
        updateResult.modifiedCount,
        "documents modified"
      );

      // Verify the update
      const updatedAdmin = await db
        .collection("users")
        .findOne({ email: "admin@demo-school.com" });
      console.log("Updated admin user:");
      console.log("- createdBy:", updatedAdmin.createdBy);
      console.log(
        "- tenant:",
        updatedAdmin.tenant,
        "(type:",
        typeof updatedAdmin.tenant,
        ")"
      );
      console.log("- managedTenants:", updatedAdmin.managedTenants);
    } else {
      console.log("❌ Admin user not found");
    }

    console.log("\n=== VERIFICATION ===");
    console.log("Users count:", await db.collection("users").countDocuments());
    console.log(
      "Tenants count:",
      await db.collection("tenants").countDocuments()
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

fixExistingAdmin();
