import { Request } from "express";
import { IUser } from "../modules/users/user.model";
import AppError from "./AppError";

export const requireUser = (req: Request): IUser => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }
  return req.user;
};

export const getUserId = (req: Request): string => {
  const user = requireUser(req);
  return (user._id as any).toString();
};
