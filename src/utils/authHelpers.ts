import { Request } from "express";
import { AuthenticatedUser } from "../types/express";
import AppError from "./AppError";

export const requireUser = (req: Request): AuthenticatedUser => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  return req.user;
};

export const getUserId = (req: Request): string => {
  const user = requireUser(req);
  return user._id;
};
