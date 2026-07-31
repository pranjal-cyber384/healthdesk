/**
 * Request Validation Middleware
 * 
 * Uses express-validator to validate request bodies, params, and queries.
 * Returns standardized validation error responses.
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHelper');

/**
 * Process validation results from express-validator chains.
 * If validation fails, returns a 400 response with error details.
 * Must be placed after express-validator check() chains in the route.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    return sendError(
      res,
      400,
      'Validation failed',
      'VALIDATION_ERROR',
      formattedErrors
    );
  }

  next();
};

module.exports = { validate };
