/**
 * Centralized Error Handler Middleware
 * 
 * Catches all errors thrown in the application and sends
 * a standardized error response. Distinguishes between
 * operational errors (expected) and programming errors (bugs).
 */

const logger = require('../config/logger');
const { sendError } = require('../utils/responseHelper');

/**
 * 404 Not Found handler for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  sendError(res, 404, `Route ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND');
};

/**
 * Global error handler
 * Must be the last middleware registered (4 arguments required by Express)
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id || 'anonymous'
    });
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this information already exists';
    errorCode = 'DUPLICATE_ENTRY';
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist';
    errorCode = 'INVALID_REFERENCE';
  }

  // MySQL data too long error
  if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    message = 'Input data exceeds allowed length';
    errorCode = 'DATA_TOO_LONG';
  }

  // JWT errors (fallback, most are caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
  }

  // Syntax error (malformed JSON body)
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorCode = 'INVALID_JSON';
  }

  // In production, don't leak error details for 500 errors
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'An unexpected error occurred. Please try again later.';
  }

  sendError(res, statusCode, message, errorCode);
};

module.exports = { errorHandler, notFoundHandler };
