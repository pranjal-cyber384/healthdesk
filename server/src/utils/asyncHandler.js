/**
 * Async Handler Wrapper
 * 
 * Wraps async route handlers to automatically catch errors
 * and pass them to the Express error handler middleware.
 * Eliminates the need for try-catch blocks in every controller.
 */

/**
 * @param {Function} fn - Async Express route handler
 * @returns {Function} Wrapped handler that catches errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
