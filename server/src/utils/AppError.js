/**
 * Custom Application Error Class
 * 
 * Extends the native Error class to include HTTP status codes
 * and operational error distinction for the error handler middleware.
 */

class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [errorCode] - Application-specific error code
   */
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory methods for common error types
   */
  static badRequest(message = 'Bad request', errorCode = 'BAD_REQUEST') {
    return new AppError(message, 400, errorCode);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message = 'Resource already exists', errorCode = 'CONFLICT') {
    return new AppError(message, 409, errorCode);
  }

  static tooMany(message = 'Too many requests', errorCode = 'RATE_LIMITED') {
    return new AppError(message, 429, errorCode);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new AppError(message, 500, errorCode);
  }

  static paymentRequired(message = 'Payment required', errorCode = 'PAYMENT_REQUIRED') {
    return new AppError(message, 402, errorCode);
  }
}

module.exports = AppError;
