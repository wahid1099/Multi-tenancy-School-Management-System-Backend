const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const MONGODB_URI =
  "mongodb+srv://wahid007:FS2irXPIAhn3PhPd@cluster0.xqvgyvn.mongodb.net/Multi_tanent_school_management?retryWrites=true&w=majority&appName=Cluster0";

async function debugLogin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("Multi_tanent_school_management");

    // Step 1: Check if tenant exists
    console.log("\n=== STEP 1: Check Tenant ===");
    const tenant = await db
      .collection("tenants")
      .findOne({ subdomain: "demo-school" });
    if (tenant) {
      console.log("✅ Tenant found:", tenant._id);
      console.log("Tenant subdomain:", tenant.subdomain);
      console.log("Tenant active:", tenant.isActive);
    } else {
      console.log("❌ Tenant NOT found with subdomain: demo-school");
      return;
    }

    // Step 2: Check if user exists with this tenant
    console.log("\n=== STEP 2: Check User ===");
    const userQuery = {
      email: "admin@demo-school.com",
      tenant: tenant._id.toString(),
    };
    console.log("User query:", userQuery);

    const user = await db.collection("users").findOne(userQuery);
    if (user) {
      console.log("✅ User found:", user._id);
      console.log("User email:", user.email);
      console.log("User tenant:", user.tenant);
      console.log("User active:", user.isActive);
      console.log("User role:", user.role);
    } else {
      console.log("❌ User NOT found with query:", userQuery);

      // Check if user exists with different tenant format
      const userByEmail = await db
        .collection("users")
        .findOne({ email: "admin@demo-school.com" });
      if (userByEmail) {
        console.log("User exists but with different tenant:");
        console.log("User tenant in DB:", userByEmail.tenant);
        console.log("Expected tenant:", tenant._id.toString());
        console.log(
          "Tenant types match:",
          typeof userByEmail.tenant === typeof tenant._id.toString()
        );
      }
      return;
    }

    // Step 3: Test password
    console.log("\n=== STEP 3: Test Password ===");
    const testPassword = "password123";
    const storedHash = user.password;

    console.log("Testing password:", testPassword);
    console.log("Stored hash:", storedHash);

    const isPasswordValid = await bcrypt.compare(testPassword, storedHash);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Password does not match!");

      // Test if the hash was created correctly
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log("New hash for same password:", newHash);

      const testNewHash = await bcrypt.compare(testPassword, newHash);
      console.log("New hash works:", testNewHash);
    } else {
      console.log("✅ Password matches!");
    }

    // Step 4: Check user status
    console.log("\n=== STEP 4: Check User Status ===");
    console.log("isActive:", user.isActive);
    console.log("isEmailVerified:", user.isEmailVerified);
    console.log("loginAttempts:", user.loginAttempts);
    console.log("lockUntil:", user.lockUntil);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

debugLogin();
