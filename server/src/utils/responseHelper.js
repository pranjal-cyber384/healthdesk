/**
 * Standard Response Helper
 * 
 * Provides consistent response formats across all API endpoints.
 * Every API response follows the same structure for predictable client parsing.
 */

/**
 * Send a success response
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Object|Array} [data] - Response data
 * @param {Object} [meta] - Pagination/extra metadata
 */
function sendSuccess(res, statusCode, message, data = null, meta = null) {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta })
  };
  return res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Response message
 * @param {Array} data - Response data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 */
function sendPaginated(res, message, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
}

/**
 * Send an error response
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} [errorCode] - Application error code
 * @param {Array} [errors] - Validation errors array
 */
function sendError(res, statusCode, message, errorCode = null, errors = null) {
  const response = {
    success: false,
    message,
    ...(errorCode && { errorCode }),
    ...(errors && { errors })
  };
  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError
};
