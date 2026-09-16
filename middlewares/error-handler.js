import AppError from "../errors/app-error.js";
import { ERROR_DEFINITIONS } from "../errors/error-definitions.js";
import { UnauthorizedError } from "express-jwt";
import multer from "multer";

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === "entity.parse.failed") {
    const invalidRequest = ERROR_DEFINITIONS.INVALID_REQUEST;

    return res.status(invalidRequest.statusCode).json({
      code: invalidRequest.code,
      message: invalidRequest.message,
    });
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      const invalidRequest = ERROR_DEFINITIONS.INVALID_REQUEST;

      return res.status(invalidRequest.statusCode).json({
        code: invalidRequest.code,
        message: invalidRequest.message,
      });
    }
  }

  if (error instanceof UnauthorizedError) {
    const unauthorized = ERROR_DEFINITIONS.UNAUTHORIZED;

    return res.status(unauthorized.statusCode).json({
      code: unauthorized.code,
      message: unauthorized.message,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
    });
  }

  console.error(`[${req.method}] ${req.originalUrl}`, error);

  const internalServerError = ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR;

  return res.status(internalServerError.statusCode).json({
    code: internalServerError.code,
    message: internalServerError.message,
  });
}

export default errorHandler;
