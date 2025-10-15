import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import AppError from "../utils/AppError";
import { sendErrorResponse } from "../utils/response";
import config from "../config";

/**
 * Handle MongoDB Cast Error
 */
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Duplicate Field Error
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB Validation Error
 */
const handleValidationErrorDB = (
  err: mongoose.Error.ValidationError
): AppError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT Error
 */
const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired! Please log in again.", 401);

/**
 * Send error response for development
 */
const sendErrorDev = (err: AppError, res: Response): void => {
  sendErrorResponse(res, err.message, err.statusCode, err.stack);
};

/**
 * Send error response for production
 */
const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    sendErrorResponse(res, err.message, err.statusCode);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err);
    sendErrorResponse(res, "Something went wrong!", 500);
  }
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific MongoDB errors
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default globalErrorHandler;
