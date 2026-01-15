import { AppError, ErrorCodes } from "../utils/appError";
import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  console.log(`Error occurred: ${err.path}`, err.message);

  if (err instanceof ZodError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation Error",
      errorCode: ErrorCodes.ERR_BAD_REQUEST,
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errorCode: err.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    errorCode: ErrorCodes.ERR_INTERNAL,
    error: err.message || "Something went wrong",
  });
};
