/**
 * General Helper Functions
 * 
 * Reusable utility functions used across the application.
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure random token
 * 
 * @param {number} [bytes=32] - Number of random bytes
 * @returns {string} Hex-encoded token
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a hashed version of a token for database storage
 * 
 * @param {string} token - Plain token
 * @returns {string} SHA-256 hashed token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Sanitize a filename for safe storage
 * Removes special characters and spaces, preserves extension
 * 
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  const ext = filename.substring(filename.lastIndexOf('.'));
  const name = filename.substring(0, filename.lastIndexOf('.'));
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
  return `${sanitized}_${Date.now()}${ext}`;
}

/**
 * Calculate pagination offset from page number and limit
 * 
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {number} SQL OFFSET value
 */
function getOffset(page, limit) {
  return (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
}

/**
 * Parse and validate pagination parameters from query string
 * 
 * @param {Object} query - Express req.query object
 * @param {number} [defaultLimit=10] - Default items per page
 * @param {number} [maxLimit=100] - Maximum items per page
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query, defaultLimit = 10, maxLimit = 100) {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || defaultLimit;

  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), maxLimit);

  return {
    page,
    limit,
    offset: getOffset(page, limit)
  };
}

/**
 * Format a Date object to MySQL DATETIME string
 * 
 * @param {Date} [date=new Date()] - Date to format
 * @returns {string} MySQL-formatted datetime string
 */
function formatDateMySQL(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Check if a date is in the past
 * 
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
function isPastDate(date) {
  return new Date(date) < new Date();
}

/**
 * Check if a date is at least N days in the future
 * 
 * @param {string|Date} date - Date to check
 * @param {number} days - Minimum days in the future
 * @returns {boolean}
 */
function isMinDaysAhead(date, days) {
  const target = new Date(date);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + days);
  return target >= minDate;
}

/**
 * Remove sensitive fields from a user object before sending to client
 * 
 * @param {Object} user - User object from database
 * @returns {Object} Cleaned user object
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, refresh_token, reset_token, reset_token_expiry, ...safeUser } = user;
  return safeUser;
}

/**
 * Build a dynamic WHERE clause from filter parameters
 * 
 * @param {Object} filters - Key-value pairs of column names and values
 * @returns {{ whereClause: string, params: Array }}
 */
function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key.endsWith('_like')) {
        const column = key.replace('_like', '');
        conditions.push(`${column} LIKE ?`);
        params.push(`%${value}%`);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
  });

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

module.exports = {
  generateToken,
  hashToken,
  sanitizeFilename,
  getOffset,
  parsePagination,
  formatDateMySQL,
  isPastDate,
  isMinDaysAhead,
  sanitizeUser,
  buildWhereClause
};
