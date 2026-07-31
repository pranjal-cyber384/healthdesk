/**
 * Payments Module
 * Handles Razorpay order creation, payment verification, and history.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const paymentService = require('../../services/PaymentService');
const notificationService = require('../../services/NotificationService');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/payments/create-order — Create Razorpay order
// ============================================
const createOrderValidator = [
  body('appointmentId').isInt().withMessage('Appointment ID is required')
];

router.post('/create-order', authorize(ROLES.PATIENT), createOrderValidator, validate, asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;

  // Verify appointment exists and belongs to patient
  const [appointment] = await query(
    `SELECT a.*, dp.consultation_fee
     FROM appointments a
     JOIN doctor_profiles dp ON a.doctor_id = dp.user_id
     WHERE a.id = ? AND a.patient_id = ? AND a.status = 'accepted'`,
    [appointmentId, req.user.id]
  );

  if (!appointment) {
    throw AppError.notFound('Accepted appointment not found');
  }

  if (appointment.is_paid) {
    throw AppError.badRequest('This appointment has already been paid for');
  }

  const amount = parseFloat(appointment.consultation_fee);
  if (amount <= 0) {
    throw AppError.badRequest('Invalid consultation fee');
  }

  // Check if payment service is available
  if (!paymentService.isAvailable()) {
    throw AppError.internal('Payment service is not configured');
  }

  // Create Razorpay order
  const order = await paymentService.createOrder({
    amount,
    currency: 'INR',
    receipt: `appt_${appointmentId}_${Date.now()}`,
    notes: {
      appointmentId: String(appointmentId),
      patientId: String(req.user.id),
      doctorId: String(appointment.doctor_id)
    }
  });

  // Save payment record
  await query(
    `INSERT INTO payments (appointment_id, patient_id, doctor_id, amount, currency, razorpay_order_id, status, created_at)
     VALUES (?, ?, ?, ?, 'INR', ?, 'created', NOW())`,
    [appointmentId, req.user.id, appointment.doctor_id, amount, order.id]
  );

  sendSuccess(res, 201, 'Payment order created', {
    orderId: order.id,
    amount: amount,
    currency: 'INR',
    keyId: paymentService.getPublicKey(),
    appointmentId
  });
}));

// ============================================
// POST /api/v1/payments/verify — Verify payment
// ============================================
const verifyPaymentValidator = [
  body('razorpayOrderId').notEmpty().withMessage('Order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Signature is required')
];

router.post('/verify', authorize(ROLES.PATIENT), verifyPaymentValidator, validate, asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // Verify signature
  const isValid = paymentService.verifyPayment({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });

  if (!isValid) {
    // Update payment as failed
    await query(
      `UPDATE payments SET status = 'failed', failure_reason = 'Signature verification failed' WHERE razorpay_order_id = ?`,
      [razorpayOrderId]
    );
    throw AppError.badRequest('Payment verification failed');
  }

  // Update payment as successful
  await query(
    `UPDATE payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ?, paid_at = NOW() WHERE razorpay_order_id = ?`,
    [razorpayPaymentId, razorpaySignature, razorpayOrderId]
  );

  // Get payment details and mark appointment as paid
  const [payment] = await query('SELECT * FROM payments WHERE razorpay_order_id = ?', [razorpayOrderId]);

  if (payment) {
    await query('UPDATE appointments SET is_paid = 1, updated_at = NOW() WHERE id = ?', [payment.appointment_id]);

    // Notify both parties
    await notificationService.paymentNotification(payment.patient_id, payment.id, 'paid', payment.amount);
    await notificationService.paymentNotification(payment.doctor_id, payment.id, 'paid', payment.amount);
  }

  sendSuccess(res, 200, 'Payment verified successfully', { paymentId: payment?.id });
}));

// ============================================
// GET /api/v1/payments — Payment history
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = [];
  const params = [];

  if (req.user.role === ROLES.PATIENT) {
    whereConditions.push('pay.patient_id = ?');
    params.push(req.user.id);
  } else if (req.user.role === ROLES.DOCTOR) {
    whereConditions.push('pay.doctor_id = ?');
    params.push(req.user.id);
  }

  if (status) {
    whereConditions.push('pay.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM payments pay ${whereClause}`, params);

  const payments = await query(
    `SELECT pay.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            dp.specialization
     FROM payments pay
     JOIN users p ON pay.patient_id = p.id
     JOIN users d ON pay.doctor_id = d.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     ${whereClause}
     ORDER BY pay.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Payments retrieved', payments, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/payments/:id — Payment details
// ============================================
router.get('/:id', asyncHandler(async (req, res) => {
  const [payment] = await query(
    `SELECT pay.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            a.appointment_date, a.appointment_time, a.consultation_type
     FROM payments pay
     JOIN users p ON pay.patient_id = p.id
     JOIN users d ON pay.doctor_id = d.id
     LEFT JOIN appointments a ON pay.appointment_id = a.id
     WHERE pay.id = ?`,
    [req.params.id]
  );

  if (!payment) throw AppError.notFound('Payment not found');

  if (req.user.role === ROLES.PATIENT && payment.patient_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }
  if (req.user.role === ROLES.DOCTOR && payment.doctor_id !== req.user.id) {
    throw AppError.forbidden('Access denied');
  }

  sendSuccess(res, 200, 'Payment details retrieved', payment);
}));

module.exports = router;
