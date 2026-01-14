import { AppError } from "../utils/appError";
import { ErrorRequestHandler } from "express";
import { ErrorCodes } from "../utils/appError";
import { HTTPSTATUS } from "../config/http.config";

export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  console.log(`Error occurred: ${err.path}`, err.message);

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
