/**
 * Auth Validators
 * 
 * Express-validator chains for authentication endpoints.
 * Validates all input before it reaches the controller.
 */

const { body } = require('express-validator');

const registerValidator = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor']).withMessage('Role must be either patient or doctor'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{7,14}$/).withMessage('Please provide a valid phone number')
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const googleAuthValidator = [
  body('token')
    .notEmpty().withMessage('Google token is required')
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail()
];

const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
];

const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
];

module.exports = {
  registerValidator,
  loginValidator,
  googleAuthValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator
};
