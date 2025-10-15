import { Tenant, ITenant } from "./tenant.model";
import AppError from "../../utils/AppError";

export interface CreateTenantData {
  name: string;
  subdomain: string;
  domain?: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  settings?: {
    timezone?: string;
    currency?: string;
    language?: string;
    academicYearStart: Date;
    academicYearEnd: Date;
  };
  subscription?: {
    plan?: "basic" | "premium" | "enterprise";
    status?: "active" | "inactive" | "suspended";
    startDate?: Date;
    endDate: Date;
    maxUsers?: number;
    maxStudents?: number;
  };
}

export interface UpdateTenantData extends Partial<CreateTenantData> {
  isActive?: boolean;
}

export interface TenantQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive" | "suspended";
  plan?: "basic" | "premium" | "enterprise";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Tenant Service Class
 */
class TenantService {
  /**
   * Create a new tenant
   */
  async createTenant(tenantData: CreateTenantData): Promise<ITenant> {
    // Check if subdomain already exists
    const existingTenant = await Tenant.findOne({
      subdomain: tenantData.subdomain,
    });
    if (existingTenant) {
      throw new AppError("Subdomain already exists", 400);
    }

    // Check if email already exists
    const existingEmail = await Tenant.findOne({
      "contact.email": tenantData.contact.email,
    });
    if (existingEmail) {
      throw new AppError("Email already exists", 400);
    }

    const tenant = new Tenant(tenantData);
    await tenant.save();

    return tenant;
  }

  /**
   * Get all tenants with pagination and filtering
   */
  async getAllTenants(query: TenantQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      plan,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    // Build filter object
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { subdomain: { $regex: search, $options: "i" } },
        { "contact.email": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter["subscription.status"] = status;
    }

    if (plan) {
      filter["subscription.plan"] = plan;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [tenants, total] = await Promise.all([
      Tenant.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Tenant.countDocuments(filter),
    ]);

    return {
      tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<ITenant> {
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }
    return tenant;
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<ITenant> {
    const tenant = await Tenant.findOne({ subdomain, isActive: true });
    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }
    return tenant;
  }

  /**
   * Update tenant
   */
  async updateTenant(
    id: string,
    updateData: UpdateTenantData
  ): Promise<ITenant> {
    // Check if tenant exists
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    // Check if subdomain is being updated and already exists
    if (updateData.subdomain && updateData.subdomain !== tenant.subdomain) {
      const existingTenant = await Tenant.findOne({
        subdomain: updateData.subdomain,
      });
      if (existingTenant) {
        throw new AppError("Subdomain already exists", 400);
      }
    }

    // Check if email is being updated and already exists
    if (
      updateData.contact?.email &&
      updateData.contact.email !== tenant.contact.email
    ) {
      const existingEmail = await Tenant.findOne({
        "contact.email": updateData.contact.email,
      });
      if (existingEmail) {
        throw new AppError("Email already exists", 400);
      }
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedTenant!;
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(id: string): Promise<void> {
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    await Tenant.findByIdAndUpdate(id, { isActive: false });
  }

  /**
   * Activate/Deactivate tenant
   */
  async toggleTenantStatus(id: string): Promise<ITenant> {
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError("Tenant not found", 404);
    }

    tenant.isActive = !tenant.isActive;
    await tenant.save();

    return tenant;
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats() {
    const stats = await Tenant.aggregate([
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          activeTenants: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
          inactiveTenants: {
            $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
          },
          basicPlan: {
            $sum: { $cond: [{ $eq: ["$subscription.plan", "basic"] }, 1, 0] },
          },
          premiumPlan: {
            $sum: { $cond: [{ $eq: ["$subscription.plan", "premium"] }, 1, 0] },
          },
          enterprisePlan: {
            $sum: {
              $cond: [{ $eq: ["$subscription.plan", "enterprise"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalTenants: 0,
        activeTenants: 0,
        inactiveTenants: 0,
        basicPlan: 0,
        premiumPlan: 0,
        enterprisePlan: 0,
      }
    );
  }
}

export default new TenantService();
