import { Role, IRole, IPermission } from "./role.model";
import AppError from "../../utils/AppError";

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: IPermission[];
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  isActive?: boolean;
}

export interface RoleQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class RoleService {
  async createRole(tenant: string, roleData: CreateRoleData): Promise<IRole> {
    const existingRole = await Role.findOne({ tenant, name: roleData.name });
    if (existingRole) {
      throw new AppError("Role with this name already exists", 400);
    }

    const role = new Role({
      ...roleData,
      tenant,
    });

    await role.save();
    return role;
  }

  async getAllRoles(tenant: string, query: RoleQuery) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      isSystem,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter: any = { tenant };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (typeof isActive === "boolean") {
      filter.isActive = isActive;
    }

    if (typeof isSystem === "boolean") {
      filter.isSystem = isSystem;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
    ]);

    return {
      roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRoleById(id: string, tenant: string): Promise<IRole> {
    const role = await Role.findOne({ _id: id, tenant });
    if (!role) {
      throw new AppError("Role not found", 404);
    }
    return role;
  }

  async updateRole(
    id: string,
    tenant: string,
    updateData: UpdateRoleData
  ): Promise<IRole> {
    const role = await Role.findOne({ _id: id, tenant });
    if (!role) {
      throw new AppError("Role not found", 404);
    }

    if (role.isSystem) {
      throw new AppError("Cannot modify system roles", 400);
    }

    if (updateData.name && updateData.name !== role.name) {
      const existingRole = await Role.findOne({
        tenant,
        name: updateData.name,
      });
      if (existingRole) {
        throw new AppError("Role with this name already exists", 400);
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return updatedRole!;
  }

  async deleteRole(id: string, tenant: string): Promise<void> {
    const role = await Role.findOne({ _id: id, tenant });
    if (!role) {
      throw new AppError("Role not found", 404);
    }

    if (role.isSystem) {
      throw new AppError("Cannot delete system roles", 400);
    }

    await Role.findByIdAndDelete(id);
  }

  async toggleRoleStatus(id: string, tenant: string): Promise<IRole> {
    const role = await Role.findOne({ _id: id, tenant });
    if (!role) {
      throw new AppError("Role not found", 404);
    }

    if (role.isSystem) {
      throw new AppError("Cannot modify system roles", 400);
    }

    role.isActive = !role.isActive;
    await role.save();

    return role;
  }

  async checkPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    // This would typically check user's role permissions
    // Implementation depends on how you link users to roles
    return true; // Placeholder
  }
}

export default new RoleService();
