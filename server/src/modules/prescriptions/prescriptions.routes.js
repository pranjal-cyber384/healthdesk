/**
 * Prescriptions Module
 * Handles prescription creation, viewing, and downloading.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize, requireVerifiedDoctor } = require('../../middleware/roleGuard');
const { uploadSingle, handleMulterError } = require('../../middleware/upload');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const storageService = require('../../services/StorageService');
const notificationService = require('../../services/NotificationService');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/prescriptions — Create prescription (Doctor)
// ============================================
const createPrescriptionValidator = [
  body('appointmentId').optional().isInt(),
  body('patientId').isInt().withMessage('Patient ID is required'),
  body('diagnosis').notEmpty().withMessage('Diagnosis is required').isLength({ max: 2000 }),
  body('medications').notEmpty().withMessage('Medications are required').isLength({ max: 5000 }),
  body('instructions').optional().isLength({ max: 2000 }),
  body('notes').optional().isLength({ max: 2000 })
];

router.post('/', authorize(ROLES.DOCTOR), requireVerifiedDoctor, uploadSingle('prescriptionFile'), handleMulterError, createPrescriptionValidator, validate, asyncHandler(async (req, res) => {
  const { appointmentId, patientId, diagnosis, medications, instructions, notes } = req.body;

  // Verify patient exists
  const [patient] = await query('SELECT id FROM users WHERE id = ? AND role = ?', [patientId, ROLES.PATIENT]);
  if (!patient) throw AppError.notFound('Patient not found');

  // If appointment ID provided, verify it belongs to this doctor and patient
  if (appointmentId) {
    const [appointment] = await query(
      'SELECT id FROM appointments WHERE id = ? AND doctor_id = ? AND patient_id = ?',
      [appointmentId, req.user.id, patientId]
    );
    if (!appointment) throw AppError.badRequest('Invalid appointment');
  }

  // Upload prescription file if provided
  let prescriptionFileUrl = null;
  if (req.file) {
    const uploaded = await storageService.uploadFile(
      req.file.buffer, req.file.originalname, 'prescriptions', req.file.mimetype
    );
    prescriptionFileUrl = uploaded.url;
  }

  const result = await query(
    `INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medications, instructions, notes, prescription_file_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [appointmentId || null, req.user.id, patientId, diagnosis, medications, instructions || null, notes || null, prescriptionFileUrl]
  );

  // Also save as medical record
  await query(
    `INSERT INTO medical_records (patient_id, record_type, title, description, file_url, uploaded_by, created_at)
     VALUES (?, 'prescription', ?, ?, ?, ?, NOW())`,
    [patientId, `Prescription by Dr. ${req.user.firstName} ${req.user.lastName}`, diagnosis, prescriptionFileUrl, req.user.id]
  );

  // Notify patient
  await notificationService.create({
    userId: patientId,
    title: 'New Prescription',
    message: `Dr. ${req.user.firstName} ${req.user.lastName} has written you a prescription`,
    type: 'appointment',
    referenceId: String(result.insertId),
    referenceType: 'prescription'
  });

  sendSuccess(res, 201, 'Prescription created successfully', { prescriptionId: result.insertId });
}));

// ============================================
// GET /api/v1/prescriptions — List prescriptions
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  let whereConditions = [];
  const params = [];

  if (req.user.role === ROLES.PATIENT) {
    whereConditions.push('p.patient_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === ROLES.DOCTOR) {
    whereConditions.push('p.doctor_id = ?');
    params.push(req.user.id);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM prescriptions p ${whereClause}`, params);

  const prescriptions = await query(
    `SELECT p.*,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            pt.first_name as patient_first_name, pt.last_name as patient_last_name,
            dp.specialization
     FROM prescriptions p
     JOIN users d ON p.doctor_id = d.id
     JOIN users pt ON p.patient_id = pt.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Prescriptions retrieved', prescriptions, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/prescriptions/:id
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const [prescription] = await query(
    `SELECT p.*,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.email as doctor_email,
            pt.first_name as patient_first_name, pt.last_name as patient_last_name,
            dp.specialization, dp.hospital_name
     FROM prescriptions p
     JOIN users d ON p.doctor_id = d.id
     JOIN users pt ON p.patient_id = pt.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     WHERE p.id = ?`,
    [req.params.id]
  );

  if (!prescription) throw AppError.notFound('Prescription not found');

  // Access check
  if (req.user.role === ROLES.PATIENT && prescription.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }
  if (req.user.role === ROLES.DOCTOR && prescription.doctor_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  sendSuccess(res, 200, 'Prescription retrieved', prescription);
}));

// ============================================
// GET /api/v1/prescriptions/:id/download
// ============================================
router.get('/:id/download', asyncHandler(async (req, res) => {
  const [prescription] = await query('SELECT * FROM prescriptions WHERE id = ?', [req.params.id]);
  if (!prescription) throw AppError.notFound('Prescription not found');

  // Access check
  if (req.user.role === ROLES.PATIENT && prescription.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }
  if (req.user.role === ROLES.DOCTOR && prescription.doctor_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  if (!prescription.prescription_file_url) {
    throw AppError.notFound('No prescription file available');
  }

  const { stream, contentType } = await storageService.getFileStream(prescription.prescription_file_url);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="prescription_${prescription.id}.pdf"`);
  stream.pipe(res);
}));

module.exports = router;
