/**
 * Auth Controller
 * 
 * Handles HTTP requests for authentication endpoints.
 * Delegates business logic to the auth service.
 */

const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/responseHelper');

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, phone } = req.body;
  const result = await authService.register({ email, password, firstName, lastName, role, phone });
  sendSuccess(res, 201, 'Registration successful', result);
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  sendSuccess(res, 200, 'Login successful', result);
});

/**
 * POST /api/v1/auth/google
 */
const googleAuth = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.googleAuth(token);
  sendSuccess(res, 200, 'Google authentication successful', result);
});

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshToken(token);
  sendSuccess(res, 200, 'Token refreshed successfully', result);
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);
  sendSuccess(res, 200, result.message);
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await authService.resetPassword(token, password);
  sendSuccess(res, 200, result.message);
});

/**
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  sendSuccess(res, 200, 'Logged out successfully');
});

/**
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, 200, 'User profile retrieved', user);
});

module.exports = {
  register,
  login,
  googleAuth,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getMe
};
