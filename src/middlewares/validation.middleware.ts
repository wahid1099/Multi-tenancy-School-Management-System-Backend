import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import AppError from "../utils/AppError";

/**
 * Validation middleware factory
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

/**
 * Query validation middleware
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

/**
 * Params validation middleware
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};
