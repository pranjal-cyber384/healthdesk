/**
 * Verification Module
 * Handles doctor verification document submission and admin review.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const { uploadMultiple, handleMulterError } = require('../../middleware/upload');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const storageService = require('../../services/StorageService');
const notificationService = require('../../services/NotificationService');
const { ROLES, VERIFICATION_STATUS, DOCUMENT_TYPES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/verification/submit — Submit verification docs (Doctor)
// ============================================
router.post('/submit', authorize(ROLES.DOCTOR), uploadMultiple('documents', 10), handleMulterError, asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw AppError.badRequest('No documents provided');
  }

  // Get doctor profile
  const [profile] = await query('SELECT id, verification_status FROM doctor_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) throw AppError.notFound('Doctor profile not found');

  if (profile.verification_status === VERIFICATION_STATUS.APPROVED) {
    throw AppError.badRequest('Your account is already verified');
  }

  // Parse document types from body (JSON array or comma-separated)
  let documentTypes = [];
  if (req.body.documentTypes) {
    try {
      documentTypes = typeof req.body.documentTypes === 'string'
        ? JSON.parse(req.body.documentTypes)
        : req.body.documentTypes;
    } catch {
      documentTypes = req.body.documentTypes.split(',').map(t => t.trim());
    }
  }

  const uploadedDocs = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const docType = documentTypes[i] || 'other';

    const uploaded = await storageService.uploadFile(
      file.buffer, file.originalname, 'verification', file.mimetype
    );

    const result = await query(
      `INSERT INTO verification_documents (doctor_id, document_type, document_url, original_filename, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [profile.id, docType, uploaded.url, file.originalname]
    );

    uploadedDocs.push({
      id: result.insertId,
      documentType: docType,
      filename: file.originalname,
      url: uploaded.url
    });
  }

  // Update verification status to pending
  await query(
    `UPDATE doctor_profiles SET verification_status = 'pending', updated_at = NOW() WHERE id = ?`,
    [profile.id]
  );

  // Notify admins
  const admins = await query("SELECT id FROM users WHERE role = 'admin'");
  for (const admin of admins) {
    await notificationService.create({
      userId: admin.id,
      title: 'New Verification Request',
      message: `Dr. ${req.user.firstName} ${req.user.lastName} has submitted verification documents`,
      type: 'verification',
      referenceId: String(profile.id),
      referenceType: 'verification'
    });
  }

  await notificationService.verificationNotification(req.user.id, 'submitted');

  sendSuccess(res, 201, 'Verification documents submitted successfully', uploadedDocs);
}));

// ============================================
// GET /api/v1/verification/status — Check verification status (Doctor)
// ============================================
router.get('/status', authorize(ROLES.DOCTOR), asyncHandler(async (req, res) => {
  const [profile] = await query(
    `SELECT dp.verification_status, dp.updated_at
     FROM doctor_profiles dp WHERE dp.user_id = ?`,
    [req.user.id]
  );

  if (!profile) throw AppError.notFound('Doctor profile not found');

  const documents = await query(
    `SELECT vd.* FROM verification_documents vd
     JOIN doctor_profiles dp ON vd.doctor_id = dp.id
     WHERE dp.user_id = ?
     ORDER BY vd.created_at DESC`,
    [req.user.id]
  );

  sendSuccess(res, 200, 'Verification status retrieved', {
    status: profile.verification_status,
    lastUpdated: profile.updated_at,
    documents
  });
}));

// ============================================
// GET /api/v1/verification/requests — List all verification requests (Admin)
// ============================================
router.get('/requests', authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = [];
  const params = [];

  if (status) {
    whereConditions.push('dp.verification_status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id ${whereClause}`,
    params
  );

  const requests = await query(
    `SELECT dp.id as profile_id, dp.user_id, dp.specialization, dp.qualification, dp.experience_years,
            dp.hospital_name, dp.license_number, dp.verification_status, dp.created_at, dp.updated_at,
            u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            (SELECT COUNT(*) FROM verification_documents WHERE doctor_id = dp.id) as document_count
     FROM doctor_profiles dp
     JOIN users u ON dp.user_id = u.id
     ${whereClause}
     ORDER BY FIELD(dp.verification_status, 'pending', 'rejected', 'suspended', 'approved'), dp.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Verification requests retrieved', requests, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/verification/:id — Get verification details (Admin)
// ============================================
router.get('/:id', authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const [profile] = await query(
    `SELECT dp.*, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url
     FROM doctor_profiles dp
     JOIN users u ON dp.user_id = u.id
     WHERE dp.id = ?`,
    [req.params.id]
  );

  if (!profile) throw AppError.notFound('Verification request not found');

  const documents = await query(
    'SELECT * FROM verification_documents WHERE doctor_id = ? ORDER BY created_at DESC',
    [req.params.id]
  );

  sendSuccess(res, 200, 'Verification details retrieved', { ...profile, documents });
}));

// ============================================
// PUT /api/v1/verification/:id/approve — Approve doctor (Admin)
// ============================================
router.put('/:id/approve', authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  const profileId = req.params.id;

  const [profile] = await query('SELECT * FROM doctor_profiles WHERE id = ?', [profileId]);
  if (!profile) throw AppError.notFound('Doctor profile not found');

  // Update profile status
  await query(
    `UPDATE doctor_profiles SET verification_status = 'approved', is_available = 1, updated_at = NOW() WHERE id = ?`,
    [profileId]
  );

  // Update all pending documents to verified
  await query(
    `UPDATE verification_documents SET status = 'verified', admin_notes = ?, verified_by = ?, verified_at = NOW()
     WHERE doctor_id = ? AND status = 'pending'`,
    [adminNotes || 'Approved', req.user.id, profileId]
  );

  // Log audit
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
     VALUES (?, 'APPROVE_DOCTOR', 'doctor_profile', ?, ?, ?, ?, NOW())`,
    [req.user.id, profileId, JSON.stringify({ status: 'approved' }), req.ip, req.get('user-agent')]
  );

  // Notify doctor
  await notificationService.verificationNotification(profile.user_id, 'approved');

  sendSuccess(res, 200, 'Doctor approved successfully');
}));

// ============================================
// PUT /api/v1/verification/:id/reject — Reject doctor (Admin)
// ============================================
router.put('/:id/reject', authorize(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  const profileId = req.params.id;

  const [profile] = await query('SELECT * FROM doctor_profiles WHERE id = ?', [profileId]);
  if (!profile) throw AppError.notFound('Doctor profile not found');

  await query(
    `UPDATE doctor_profiles SET verification_status = 'rejected', is_available = 0, updated_at = NOW() WHERE id = ?`,
    [profileId]
  );

  await query(
    `UPDATE verification_documents SET status = 'rejected', admin_notes = ?, verified_by = ?, verified_at = NOW()
     WHERE doctor_id = ? AND status = 'pending'`,
    [adminNotes || 'Rejected', req.user.id, profileId]
  );

  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
     VALUES (?, 'REJECT_DOCTOR', 'doctor_profile', ?, ?, ?, ?, NOW())`,
    [req.user.id, profileId, JSON.stringify({ status: 'rejected', reason: adminNotes }), req.ip, req.get('user-agent')]
  );

  await notificationService.verificationNotification(profile.user_id, 'rejected');

  sendSuccess(res, 200, 'Doctor verification rejected');
}));

module.exports = router;
