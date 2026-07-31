/**
 * Rate Limiting Middleware
 * 
 * Protects the API from abuse by limiting request rates.
 * Different limits for authentication and general endpoints.
 */

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/responseHelper');

/**
 * Global rate limiter for all API routes
 * Default: 1000 requests per 15 minutes
 */
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'Too many requests. Please try again later.', 'RATE_LIMITED');
  },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/v1/health';
  }
});

/**
 * Strict rate limiter for authentication routes
 * Default: 100 requests per 15 minutes
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'Too many authentication attempts. Please try again later.', 'AUTH_RATE_LIMITED');
  }
});

/**
 * Very strict rate limiter for sensitive operations
 * 10 requests per 15 minutes (forgot password, etc.)
 */
const sensitiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, 'Too many attempts. Please wait before trying again.', 'SENSITIVE_RATE_LIMITED');
  }
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  sensitiveRateLimiter
};
