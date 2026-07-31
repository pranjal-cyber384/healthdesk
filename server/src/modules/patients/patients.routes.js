/**
 * Patients Module
 * Handles patient-specific profile, medical history, and dashboard.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

// All routes require patient role
router.use(authenticate);

// ============================================
// GET /api/v1/patients/profile
// ============================================
router.get('/profile', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const [profile] = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.profile_image_url,
            p.date_of_birth, p.gender, p.blood_group, p.address, p.city, p.state, p.pincode,
            p.emergency_contact_name, p.emergency_contact_phone, p.allergies, p.chronic_conditions
     FROM users u
     LEFT JOIN patient_profiles p ON u.id = p.user_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  if (!profile) {
    return sendSuccess(res, 404, 'Patient profile not found');
  }

  sendSuccess(res, 200, 'Patient profile retrieved', profile);
}));

// ============================================
// PUT /api/v1/patients/profile
// ============================================
const updatePatientValidator = [
  body('dateOfBirth').optional().isDate().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('city').optional().trim().isLength({ max: 100 }),
  body('state').optional().trim().isLength({ max: 100 }),
  body('pincode').optional().trim().matches(/^\d{5,10}$/).withMessage('Invalid pincode'),
  body('emergencyContactPhone').optional().trim().matches(/^\+?[1-9]\d{7,14}$/).withMessage('Invalid phone')
];

router.put('/profile', authorize(ROLES.PATIENT), updatePatientValidator, validate, asyncHandler(async (req, res) => {
  const { dateOfBirth, gender, bloodGroup, address, city, state, pincode,
          emergencyContactName, emergencyContactPhone, allergies, chronicConditions,
          firstName, lastName, phone } = req.body;

  // Update user table
  const userUpdates = [];
  const userParams = [];
  if (firstName) { userUpdates.push('first_name = ?'); userParams.push(firstName); }
  if (lastName) { userUpdates.push('last_name = ?'); userParams.push(lastName); }
  if (phone !== undefined) { userUpdates.push('phone = ?'); userParams.push(phone); }

  if (userUpdates.length > 0) {
    userUpdates.push('updated_at = NOW()');
    userParams.push(req.user.id);
    await query(`UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, userParams);
  }

  // Update patient profile
  const profileUpdates = [];
  const profileParams = [];

  if (dateOfBirth !== undefined) { profileUpdates.push('date_of_birth = ?'); profileParams.push(dateOfBirth); }
  if (gender !== undefined) { profileUpdates.push('gender = ?'); profileParams.push(gender); }
  if (bloodGroup !== undefined) { profileUpdates.push('blood_group = ?'); profileParams.push(bloodGroup); }
  if (address !== undefined) { profileUpdates.push('address = ?'); profileParams.push(address); }
  if (city !== undefined) { profileUpdates.push('city = ?'); profileParams.push(city); }
  if (state !== undefined) { profileUpdates.push('state = ?'); profileParams.push(state); }
  if (pincode !== undefined) { profileUpdates.push('pincode = ?'); profileParams.push(pincode); }
  if (emergencyContactName !== undefined) { profileUpdates.push('emergency_contact_name = ?'); profileParams.push(emergencyContactName); }
  if (emergencyContactPhone !== undefined) { profileUpdates.push('emergency_contact_phone = ?'); profileParams.push(emergencyContactPhone); }
  if (allergies !== undefined) { profileUpdates.push('allergies = ?'); profileParams.push(allergies); }
  if (chronicConditions !== undefined) { profileUpdates.push('chronic_conditions = ?'); profileParams.push(chronicConditions); }

  if (profileUpdates.length > 0) {
    profileUpdates.push('updated_at = NOW()');
    profileParams.push(req.user.id);
    await query(`UPDATE patient_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`, profileParams);
  }

  // Fetch updated profile
  const [updatedProfile] = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.profile_image_url,
            p.date_of_birth, p.gender, p.blood_group, p.address, p.city, p.state, p.pincode,
            p.emergency_contact_name, p.emergency_contact_phone, p.allergies, p.chronic_conditions
     FROM users u
     LEFT JOIN patient_profiles p ON u.id = p.user_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  sendSuccess(res, 200, 'Profile updated successfully', updatedProfile);
}));

// ============================================
// GET /api/v1/patients/medical-history
// ============================================
router.get('/medical-history', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  // Fetch all medical data in parallel
  const [reports, symptoms, prescriptions, appointments] = await Promise.all([
    query('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC', [req.user.id]),
    query('SELECT * FROM symptoms WHERE patient_id = ? ORDER BY recorded_at DESC', [req.user.id]),
    query(
      `SELECT p.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM prescriptions p
       JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    ),
    query(
      `SELECT a.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name,
              dp.specialization, dp.hospital_name
       FROM appointments a
       JOIN users u ON a.doctor_id = u.id
       LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE a.patient_id = ? ORDER BY a.created_at DESC`,
      [req.user.id]
    )
  ]);

  sendSuccess(res, 200, 'Medical history retrieved', {
    reports,
    symptoms,
    prescriptions,
    appointments
  });
}));

// ============================================
// GET /api/v1/patients/dashboard
// ============================================
router.get('/dashboard', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const [
    upcomingAppointments,
    recentAppointments,
    recentPrescriptions,
    recentReports,
    unreadNotifications,
    paymentStats
  ] = await Promise.all([
    // Upcoming appointments
    query(
      `SELECT a.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name,
              u.profile_image_url as doctor_image, dp.specialization, dp.hospital_name
       FROM appointments a
       JOIN users u ON a.doctor_id = u.id
       LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE a.patient_id = ? AND a.status IN ('accepted', 'pending') 
       AND (a.appointment_date >= CURDATE() OR a.appointment_date IS NULL)
       ORDER BY a.appointment_date ASC, a.appointment_time ASC
       LIMIT 5`,
      [req.user.id]
    ),
    // Recent completed appointments
    query(
      `SELECT a.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name,
              dp.specialization
       FROM appointments a
       JOIN users u ON a.doctor_id = u.id
       LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
       WHERE a.patient_id = ? AND a.status = 'completed'
       ORDER BY a.updated_at DESC LIMIT 5`,
      [req.user.id]
    ),
    // Recent prescriptions
    query(
      `SELECT p.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM prescriptions p
       JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ? ORDER BY p.created_at DESC LIMIT 5`,
      [req.user.id]
    ),
    // Recent medical records
    query(
      'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    ),
    // Unread notifications count
    query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    ),
    // Payment summary
    query(
      `SELECT COUNT(*) as totalPayments, COALESCE(SUM(amount), 0) as totalSpent
       FROM payments WHERE patient_id = ? AND status = 'paid'`,
      [req.user.id]
    )
  ]);

  sendSuccess(res, 200, 'Dashboard data retrieved', {
    upcomingAppointments,
    recentAppointments,
    recentPrescriptions,
    recentReports,
    unreadNotifications: unreadNotifications[0]?.count || 0,
    paymentStats: paymentStats[0] || { totalPayments: 0, totalSpent: 0 }
  });
}));

module.exports = router;
