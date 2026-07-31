/**
 * Auth Routes
 * 
 * Defines all authentication-related API endpoints.
 */

const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authRateLimiter, sensitiveRateLimiter } = require('../../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  googleAuthValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator
} = require('./auth.validator');

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, registerValidator, validate, authController.register);
router.post('/login', authRateLimiter, loginValidator, validate, authController.login);
router.post('/google', authRateLimiter, googleAuthValidator, validate, authController.googleAuth);
router.post('/refresh-token', authRateLimiter, refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', sensitiveRateLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', sensitiveRateLimiter, resetPasswordValidator, validate, authController.resetPassword);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
