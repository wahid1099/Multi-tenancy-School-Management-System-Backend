import { Response } from "express";

/**
 * Standard API response format
 */
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
export const sendSuccessResponse = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
  pagination?: ApiResponse["pagination"]
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendErrorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
  };

  return res.status(statusCode).json(response);
};
