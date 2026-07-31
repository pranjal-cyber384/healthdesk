/**
 * Appointments Module
 * Handles appointment CRUD, status management, and scheduling.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize, requireVerifiedDoctor } = require('../../middleware/roleGuard');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const notificationService = require('../../services/NotificationService');
const emailService = require('../../services/EmailService');
const { ROLES, APPOINTMENT_STATUS } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/appointments — Request appointment (Patient)
// ============================================
const createAppointmentValidator = [
  body('doctorId').isInt().withMessage('Doctor ID is required'),
  body('consultationType').isIn(['online', 'offline']).withMessage('Invalid consultation type'),
  body('reason').optional().trim().isLength({ max: 1000 }),
  body('preferredDate').optional().isDate().withMessage('Invalid date'),
  body('preferredTime').optional().matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Invalid time format')
];

router.post('/', authorize(ROLES.PATIENT), createAppointmentValidator, validate, asyncHandler(async (req, res) => {
  const { doctorId, consultationType, reason, preferredDate, preferredTime } = req.body;

  // Verify doctor exists and is approved
  const [doctor] = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, dp.consultation_fee, dp.verification_status, dp.is_available
     FROM users u JOIN doctor_profiles dp ON u.id = dp.user_id
     WHERE u.id = ? AND u.role = 'doctor'`,
    [doctorId]
  );

  if (!doctor) {
    throw AppError.notFound('Doctor not found');
  }

  if (doctor.verification_status !== 'approved') {
    throw AppError.badRequest('Doctor is not yet verified');
  }

  if (!doctor.is_available) {
    throw AppError.badRequest('Doctor is currently not available');
  }

  // Check for duplicate pending appointment
  const [existing] = await query(
    `SELECT id FROM appointments WHERE patient_id = ? AND doctor_id = ? AND status = 'pending'`,
    [req.user.id, doctorId]
  );

  if (existing) {
    throw AppError.conflict('You already have a pending appointment request with this doctor');
  }

  // Create appointment
  const result = await query(
    `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, consultation_type, status, reason, consultation_fee, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
    [req.user.id, doctorId, preferredDate || null, preferredTime || null, consultationType, reason || null, doctor.consultation_fee]
  );

  // Notify doctor
  await notificationService.appointmentNotification(
    doctorId, result.insertId, 'pending', '', `${req.user.firstName} ${req.user.lastName}`
  );

  // Send email to doctor
  emailService.sendAppointmentEmail(doctor.email, {
    date: preferredDate || 'TBD',
    time: preferredTime || 'TBD',
    type: consultationType
  }, 'booked').catch(() => {});

  sendSuccess(res, 201, 'Appointment request sent successfully', { appointmentId: result.insertId });
}));

// ============================================
// GET /api/v1/appointments — List appointments (role-based)
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = [];
  const params = [];

  if (req.user.role === ROLES.PATIENT) {
    whereConditions.push('a.patient_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === ROLES.DOCTOR) {
    whereConditions.push('a.doctor_id = ?');
    params.push(req.user.id);
  }
  // Admin sees all

  if (status) {
    whereConditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM appointments a ${whereClause}`, params);

  const appointments = await query(
    `SELECT a.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name, p.profile_image_url as patient_image,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.profile_image_url as doctor_image,
            dp.specialization, dp.hospital_name, dp.upi_id, dp.upi_qr_url
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN users d ON a.doctor_id = d.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Appointments retrieved', appointments, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/appointments/:id — Get appointment details
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const [appointment] = await query(
    `SELECT a.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name, p.email as patient_email, p.phone as patient_phone, p.profile_image_url as patient_image,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.email as doctor_email, d.phone as doctor_phone, d.profile_image_url as doctor_image,
            dp.specialization, dp.hospital_name, dp.hospital_address, dp.consultation_fee as doctor_fee, dp.upi_id, dp.upi_qr_url
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN users d ON a.doctor_id = d.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     WHERE a.id = ?`,
    [req.params.id]
  );

  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }

  // Check access
  if (req.user.role === ROLES.PATIENT && appointment.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }
  if (req.user.role === ROLES.DOCTOR && appointment.doctor_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  // Fetch prescription if completed
  let prescription = null;
  if (appointment.status === 'completed') {
    const [pres] = await query('SELECT * FROM prescriptions WHERE appointment_id = ?', [appointment.id]);
    prescription = pres || null;
  }

  // Fetch payment if exists
  const [payment] = await query('SELECT * FROM payments WHERE appointment_id = ?', [appointment.id]);

  sendSuccess(res, 200, 'Appointment details retrieved', { ...appointment, prescription, payment: payment || null });
}));

// ============================================
// PUT /api/v1/appointments/:id/accept — Doctor accepts
// ============================================
const acceptValidator = [
  body('appointmentDate').isDate().withMessage('Appointment date is required'),
  body('appointmentTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Appointment time is required')
];

router.put('/:id/accept', authorize(ROLES.DOCTOR), requireVerifiedDoctor, acceptValidator, validate, asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime, notes } = req.body;
  const appointmentId = req.params.id;

  const [appointment] = await query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, req.user.id]);
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.status !== 'pending') throw AppError.badRequest(`Cannot accept an appointment with status: ${appointment.status}`);

  // Check date is in future
  if (new Date(appointmentDate) < new Date(new Date().toDateString())) {
    throw AppError.badRequest('Appointment date must be in the future');
  }

  await query(
    `UPDATE appointments SET status = 'accepted', appointment_date = ?, appointment_time = ?, notes = ?, updated_at = NOW() WHERE id = ?`,
    [appointmentDate, appointmentTime, notes || null, appointmentId]
  );

  // Notify patient
  await notificationService.appointmentNotification(
    appointment.patient_id, appointmentId, 'accepted', `${req.user.firstName} ${req.user.lastName}`
  );

  sendSuccess(res, 200, 'Appointment accepted');
}));

// ============================================
// PUT /api/v1/appointments/:id/reject — Doctor rejects
// ============================================
router.put('/:id/reject', authorize(ROLES.DOCTOR), asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const appointmentId = req.params.id;

  const [appointment] = await query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, req.user.id]);
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.status !== 'pending') throw AppError.badRequest(`Cannot reject an appointment with status: ${appointment.status}`);

  await query(
    `UPDATE appointments SET status = 'rejected', rejection_reason = ?, updated_at = NOW() WHERE id = ?`,
    [rejectionReason || 'No reason provided', appointmentId]
  );

  await notificationService.appointmentNotification(
    appointment.patient_id, appointmentId, 'rejected', `${req.user.firstName} ${req.user.lastName}`
  );

  sendSuccess(res, 200, 'Appointment rejected');
}));

// ============================================
// PUT /api/v1/appointments/:id/reschedule — Doctor reschedules
// ============================================
router.put('/:id/reschedule', authorize(ROLES.DOCTOR), requireVerifiedDoctor, asyncHandler(async (req, res) => {
  const { appointmentDate, appointmentTime } = req.body;
  const appointmentId = req.params.id;

  const [appointment] = await query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, req.user.id]);
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (!['pending', 'accepted'].includes(appointment.status)) {
    throw AppError.badRequest('Cannot reschedule this appointment');
  }

  // Check one-day-before rule for accepted appointments
  if (appointment.status === 'accepted' && appointment.appointment_date) {
    const apptDate = new Date(appointment.appointment_date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (apptDate <= tomorrow) {
      throw AppError.badRequest('Cannot reschedule less than one day before the appointment');
    }
  }

  await query(
    `UPDATE appointments SET appointment_date = ?, appointment_time = ?, updated_at = NOW() WHERE id = ?`,
    [appointmentDate, appointmentTime, appointmentId]
  );

  await notificationService.create({
    userId: appointment.patient_id,
    title: 'Appointment Rescheduled',
    message: `Dr. ${req.user.firstName} ${req.user.lastName} has rescheduled your appointment to ${appointmentDate} at ${appointmentTime}`,
    type: 'appointment',
    referenceId: String(appointmentId),
    referenceType: 'appointment'
  });

  sendSuccess(res, 200, 'Appointment rescheduled');
}));

// ============================================
// PUT /api/v1/appointments/:id/complete — Doctor completes
// ============================================
router.put('/:id/complete', authorize(ROLES.DOCTOR), requireVerifiedDoctor, asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  const [appointment] = await query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, req.user.id]);
  
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.status !== 'accepted') throw AppError.badRequest('Only accepted appointments can be completed');

  await query(`UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE id = ?`, [appointmentId]);

  await notificationService.appointmentNotification(
    appointment.patient_id, appointmentId, 'completed', `${req.user.firstName} ${req.user.lastName}`
  );

  sendSuccess(res, 200, 'Appointment marked as completed');
}));

// ============================================
// PUT /api/v1/appointments/:id/cancel — Patient cancels
// ============================================
router.put('/:id/cancel', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;
  const [appointment] = await query('SELECT * FROM appointments WHERE id = ? AND patient_id = ?', [appointmentId, req.user.id]);

  if (!appointment) throw AppError.notFound('Appointment not found');
  if (!['pending', 'accepted'].includes(appointment.status)) {
    throw AppError.badRequest('Cannot cancel this appointment');
  }

  await query(`UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?`, [appointmentId]);

  await notificationService.appointmentNotification(appointment.doctor_id, appointmentId, 'cancelled');

  sendSuccess(res, 200, 'Appointment cancelled');
}));

module.exports = router;
