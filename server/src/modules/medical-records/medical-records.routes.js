/**
 * Medical Records Module
 * Handles upload, listing, viewing, and downloading of medical records.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const { uploadSingle, uploadMultiple, handleMulterError } = require('../../middleware/upload');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const storageService = require('../../services/StorageService');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/medical-records/upload
// ============================================
router.post('/upload', uploadMultiple('files', 5), handleMulterError, asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw AppError.badRequest('No files provided');
  }

  const { title, description, recordType, patientId } = req.body;

  // Determine the patient ID
  let targetPatientId = req.user.id;
  
  // Doctors can upload for their patients
  if (req.user.role === ROLES.DOCTOR && patientId) {
    const [relationship] = await query(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND patient_id = ?',
      [req.user.id, patientId]
    );
    if (relationship.count === 0) {
      throw AppError.forbidden('You can only upload records for your patients');
    }
    targetPatientId = patientId;
  }

  const uploadedRecords = [];

  for (const file of req.files) {
    const uploaded = await storageService.uploadFile(
      file.buffer, file.originalname, 'reports', file.mimetype
    );

    const result = await query(
      `INSERT INTO medical_records (patient_id, record_type, title, description, file_url, original_filename, file_type, file_size, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        targetPatientId,
        recordType || 'report',
        title || file.originalname,
        description || null,
        uploaded.url,
        file.originalname,
        file.mimetype,
        file.size,
        req.user.id
      ]
    );

    uploadedRecords.push({
      id: result.insertId,
      filename: file.originalname,
      url: uploaded.url,
      size: file.size
    });
  }

  sendSuccess(res, 201, `${uploadedRecords.length} record(s) uploaded successfully`, uploadedRecords);
}));

// ============================================
// GET /api/v1/medical-records
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { recordType, patientId } = req.query;

  let whereConditions = [];
  const params = [];

  if (req.user.role === ROLES.PATIENT) {
    whereConditions.push('mr.patient_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === ROLES.DOCTOR && patientId) {
    whereConditions.push('mr.patient_id = ?');
    params.push(patientId);
  }

  if (recordType) {
    whereConditions.push('mr.record_type = ?');
    params.push(recordType);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM medical_records mr ${whereClause}`, params);

  const records = await query(
    `SELECT mr.*, u.first_name as uploaded_by_name, u.last_name as uploaded_by_last_name
     FROM medical_records mr
     LEFT JOIN users u ON mr.uploaded_by = u.id
     ${whereClause}
     ORDER BY mr.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Medical records retrieved', records, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/medical-records/:id
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const [record] = await query('SELECT * FROM medical_records WHERE id = ?', [req.params.id]);
  if (!record) throw AppError.notFound('Medical record not found');

  if (req.user.role === ROLES.PATIENT && record.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  sendSuccess(res, 200, 'Medical record retrieved', record);
}));

// ============================================
// GET /api/v1/medical-records/:id/download
// ============================================
router.get('/:id/download', asyncHandler(async (req, res) => {
  const [record] = await query('SELECT * FROM medical_records WHERE id = ?', [req.params.id]);
  if (!record) throw AppError.notFound('Medical record not found');

  if (req.user.role === ROLES.PATIENT && record.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  if (!record.file_url) {
    throw AppError.notFound('No file available');
  }

  const { stream, contentType } = await storageService.getFileStream(record.file_url);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${record.original_filename || 'record'}"`);
  stream.pipe(res);
}));

// ============================================
// DELETE /api/v1/medical-records/:id
// ============================================
router.delete('/:id', asyncHandler(async (req, res) => {
  const [record] = await query('SELECT * FROM medical_records WHERE id = ?', [req.params.id]);
  if (!record) throw AppError.notFound('Medical record not found');

  // Only the uploader or the patient can delete
  if (record.patient_id !== req.user.id && record.uploaded_by !== req.user.id && req.user.role !== ROLES.ADMIN) {
    throw AppError.forbidden('Access denied');
  }

  // Delete file from storage
  if (record.file_url) {
    await storageService.deleteFile(record.file_url);
  }

  await query('DELETE FROM medical_records WHERE id = ?', [req.params.id]);

  sendSuccess(res, 200, 'Medical record deleted');
}));

module.exports = router;
