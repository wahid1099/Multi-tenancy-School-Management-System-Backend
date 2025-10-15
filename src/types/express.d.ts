import { IUser } from "../modules/users/user.model";

export interface AuthenticatedUser {
  _id: string;
  role:
    | "super_admin"
    | "manager"
    | "admin"
    | "tenant_admin"
    | "teacher"
    | "student"
    | "parent";
  roleLevel: number;
  tenant: string;
  managedTenants: string[];
  roleScope: "global" | "tenant" | "limited";
  permissions: {
    resource: string;
    actions: string[];
    scope: "global" | "tenant" | "own";
    conditions?: Record<string, any>;
  }[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant: string;
    }
  }
}

export {};
