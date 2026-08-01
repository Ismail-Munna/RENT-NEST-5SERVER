import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import config from "../config";
import { ApiError } from "../utils/ApiError";

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong!";
  let errorMessage = err.message || "Internal Server Error";

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.code === "P2002") {
    // Prisma unique constraint violation
    statusCode = httpStatus.CONFLICT;
    message = "Duplicate entry error";
    errorMessage = `A record with this field already exists.`;
  } else if (err?.code === "P2025") {
    // Prisma record not found
    statusCode = httpStatus.NOT_FOUND;
    message = "Record not found";
  } else if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid or expired token";
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error: errorMessage,
    ...(config.bcrypt_salt_rounds && process.env.NODE_ENV !== "production" ? { stack: err?.stack } : {}),
  });
};
