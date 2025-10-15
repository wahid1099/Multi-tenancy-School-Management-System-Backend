import request from "supertest";
import createApp from "../../app/app";
import { User } from "./user.model";
import { Tenant } from "../tenants/tenant.model";

const app = createApp();

describe("User Module", () => {
  let tenantId: string;
  let userToken: string;

  beforeEach(async () => {
    // Create a test tenant
    const tenant = new Tenant({
      name: "Test School",
      subdomain: "testschool",
      address: {
        street: "123 Test St",
        city: "Test City",
        state: "Test State",
        zipCode: "12345",
        country: "Test Country",
      },
      contact: {
        email: "test@testschool.com",
        phone: "+1234567890",
      },
      settings: {
        academicYearStart: new Date("2024-01-01"),
        academicYearEnd: new Date("2024-12-31"),
      },
      subscription: {
        endDate: new Date("2025-12-31"),
      },
    });
    await tenant.save();
    tenantId = tenant._id.toString();
  });

  describe("POST /api/v1/users/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        tenant: tenantId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@test.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "student",
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.token).toBeDefined();
    });

    it("should fail to register user with invalid email", async () => {
      const userData = {
        tenant: tenantId,
        firstName: "John",
        lastName: "Doe",
        email: "invalid-email",
        password: "Password123!",
        confirmPassword: "Password123!",
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should fail to register user with weak password", async () => {
      const userData = {
        tenant: tenantId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@test.com",
        password: "weak",
        confirmPassword: "weak",
      };

      const response = await request(app)
        .post("/api/v1/users/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/users/login", () => {
    beforeEach(async () => {
      // Create a test user
      const user = new User({
        tenant: tenantId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@test.com",
        password: "Password123!",
        role: "student",
      });
      await user.save();
    });

    it("should login user successfully", async () => {
      const loginData = {
        email: "john.doe@test.com",
        password: "Password123!",
        tenant: tenantId,
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();

      userToken = response.body.data.token;
    });

    it("should fail to login with wrong password", async () => {
      const loginData = {
        email: "john.doe@test.com",
        password: "WrongPassword123!",
        tenant: tenantId,
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail to login with non-existent user", async () => {
      const loginData = {
        email: "nonexistent@test.com",
        password: "Password123!",
        tenant: tenantId,
      };

      const response = await request(app)
        .post("/api/v1/users/login")
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/users/me", () => {
    beforeEach(async () => {
      // Create and login a test user
      const user = new User({
        tenant: tenantId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@test.com",
        password: "Password123!",
        role: "student",
      });
      await user.save();

      const loginResponse = await request(app)
        .post("/api/v1/users/login")
        .send({
          email: "john.doe@test.com",
          password: "Password123!",
          tenant: tenantId,
        });

      userToken = loginResponse.body.data.token;
    });

    it("should get current user profile", async () => {
      const response = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${userToken}`)
        .set("X-Tenant-ID", tenantId)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("john.doe@test.com");
      expect(response.body.data.firstName).toBe("John");
    });

    it("should fail without authentication token", async () => {
      const response = await request(app).get("/api/v1/users/me").expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
