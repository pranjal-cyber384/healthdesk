/**
 * Users Module - Routes, Controller, Service, Repository
 * Handles user profile operations for all roles.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const { uploadProfileImage, handleMulterError } = require('../../middleware/upload');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const storageService = require('../../services/StorageService');
const { sanitizeUser } = require('../../utils/helpers');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

// ============================================
// Validators
// ============================================
const updateProfileValidator = [
  body('firstName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('phone').optional().trim().matches(/^\+?[1-9]\d{7,14}$/).withMessage('Invalid phone number')
];

// ============================================
// GET /api/v1/users/profile
// ============================================
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const [user] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return sendSuccess(res, 404, 'User not found');
  }
  sendSuccess(res, 200, 'User profile retrieved', sanitizeUser(user));
}));

// ============================================
// PUT /api/v1/users/profile
// ============================================
router.put('/profile', authenticate, updateProfileValidator, validate, asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const updates = [];
  const params = [];

  if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
  if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }

  if (updates.length === 0) {
    return sendSuccess(res, 200, 'No changes to update');
  }

  updates.push('updated_at = NOW()');
  params.push(req.user.id);

  await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  
  const [updatedUser] = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  sendSuccess(res, 200, 'Profile updated successfully', sanitizeUser(updatedUser));
}));

// ============================================
// PUT /api/v1/users/profile/image
// ============================================
router.put('/profile/image', authenticate, uploadProfileImage('profileImage'), handleMulterError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendSuccess(res, 400, 'No image file provided');
  }

  // Delete old profile image if exists
  const [user] = await query('SELECT profile_image_url FROM users WHERE id = ?', [req.user.id]);
  if (user && user.profile_image_url) {
    await storageService.deleteFile(user.profile_image_url);
  }

  // Upload new image
  const uploaded = await storageService.uploadFile(
    req.file.buffer,
    req.file.originalname,
    'profiles',
    req.file.mimetype
  );

  await query('UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?', [uploaded.url, req.user.id]);

  sendSuccess(res, 200, 'Profile image updated successfully', { profileImageUrl: uploaded.url });
}));

// ============================================
// PUT /api/v1/users/change-password
// ============================================
const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Must contain a special character')
];

router.put('/change-password', authenticate, changePasswordValidator, validate, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const bcrypt = require('bcryptjs');

  const [user] = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  
  if (!user.password_hash) {
    return sendSuccess(res, 400, 'Cannot change password for Google-only accounts');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    return sendSuccess(res, 400, 'Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, req.user.id]);

  sendSuccess(res, 200, 'Password changed successfully');
}));

module.exports = router;
