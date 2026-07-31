/**
 * Doctors Module
 * Handles doctor profiles, search, availability, patient management, and dashboard.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize, requireVerifiedDoctor } = require('../../middleware/roleGuard');
const { uploadProfileImage, uploadSingle, handleMulterError } = require('../../middleware/upload');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const storageService = require('../../services/StorageService');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const { body, param, query: queryValidator } = require('express-validator');
const { validate } = require('../../middleware/validate');

// ============================================
// GET /api/v1/doctors — Search/Browse Doctors (Public for authenticated users)
// ============================================
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, specialization, hospital, city, available } = req.query;

  let whereConditions = ["dp.verification_status = 'approved'"];
  const params = [];

  if (search) {
    whereConditions.push("(u.first_name LIKE ? OR u.last_name LIKE ? OR dp.specialization LIKE ? OR dp.hospital_name LIKE ?)");
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  if (specialization) {
    whereConditions.push('dp.specialization LIKE ?');
    params.push(`%${specialization}%`);
  }
  if (hospital) {
    whereConditions.push('dp.hospital_name LIKE ?');
    params.push(`%${hospital}%`);
  }
  if (city) {
    whereConditions.push('(dp.hospital_address LIKE ? OR dp.clinic_address LIKE ?)');
    params.push(`%${city}%`, `%${city}%`);
  }
  if (available === 'true') {
    whereConditions.push('dp.is_available = 1');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Count total
  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM doctor_profiles dp JOIN users u ON dp.user_id = u.id ${whereClause}`,
    params
  );
  const total = countResult.total;

  // Fetch doctors
  const doctors = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            dp.specialization, dp.qualification, dp.experience_years, dp.hospital_name,
            dp.hospital_address, dp.clinic_address, dp.consultation_fee, dp.biography,
            dp.is_available, dp.verification_status
     FROM doctor_profiles dp
     JOIN users u ON dp.user_id = u.id
     ${whereClause}
     ORDER BY dp.experience_years DESC, u.first_name ASC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Doctors retrieved', doctors, page, limit, total);
}));

// // ============================================
// // GET /api/v1/doctors/:id — Get Doctor Profile
// // ============================================
// router.get('/:id', authenticate, asyncHandler(async (req, res) => {
//   const doctorId = req.params.id;

//   const [doctor] = await query(
//     `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
//             dp.specialization, dp.qualification, dp.experience_years, dp.hospital_name,
//             dp.hospital_address, dp.clinic_address, dp.consultation_fee, dp.biography,
//             dp.is_available, dp.verification_status, dp.upi_id, dp.upi_qr_url
//      FROM users u
//      JOIN doctor_profiles dp ON u.id = dp.user_id
//      WHERE u.id = ? AND dp.verification_status = 'approved'`,
//     [doctorId]
//   );

//   if (!doctor) {
//     return sendSuccess(res, 404, 'Doctor not found');
//   }

//   // Fetch availability
//   const availability = await query(
//     `SELECT da.* FROM doctor_availability da
//      JOIN doctor_profiles dp ON da.doctor_id = dp.id
//      WHERE dp.user_id = ? AND da.is_active = 1
//      ORDER BY FIELD(da.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')`,
//     [doctorId]
//   );

//   sendSuccess(res, 200, 'Doctor profile retrieved', { ...doctor, availability });
// }));

// ============================================
// PUT /api/v1/doctors/profile — Update Doctor Profile
// ============================================
const updateDoctorValidator = [
  body('specialization').optional().trim().isLength({ max: 200 }),
  body('qualification').optional().trim().isLength({ max: 300 }),
  body('experienceYears').optional().isInt({ min: 0, max: 60 }),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('biography').optional().trim().isLength({ max: 2000 }),
  body('licenseNumber').optional().trim().isLength({ max: 100 }),
  body('upiId').optional().trim().isLength({ max: 100 })
];

router.put('/profile', authenticate, authorize(ROLES.DOCTOR), updateDoctorValidator, validate, asyncHandler(async (req, res) => {
  const { specialization, qualification, experienceYears, hospitalName, hospitalAddress,
    clinicAddress, consultationFee, biography, licenseNumber, upiId, isAvailable,
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

  // Update doctor profile
  const profileUpdates = [];
  const profileParams = [];

  if (specialization !== undefined) { profileUpdates.push('specialization = ?'); profileParams.push(specialization); }
  if (qualification !== undefined) { profileUpdates.push('qualification = ?'); profileParams.push(qualification); }
  if (experienceYears !== undefined) { profileUpdates.push('experience_years = ?'); profileParams.push(experienceYears); }
  if (hospitalName !== undefined) { profileUpdates.push('hospital_name = ?'); profileParams.push(hospitalName); }
  if (hospitalAddress !== undefined) { profileUpdates.push('hospital_address = ?'); profileParams.push(hospitalAddress); }
  if (clinicAddress !== undefined) { profileUpdates.push('clinic_address = ?'); profileParams.push(clinicAddress); }
  if (consultationFee !== undefined) { profileUpdates.push('consultation_fee = ?'); profileParams.push(consultationFee); }
  if (biography !== undefined) { profileUpdates.push('biography = ?'); profileParams.push(biography); }
  if (licenseNumber !== undefined) { profileUpdates.push('license_number = ?'); profileParams.push(licenseNumber); }
  if (upiId !== undefined) { profileUpdates.push('upi_id = ?'); profileParams.push(upiId); }
  if (isAvailable !== undefined) { profileUpdates.push('is_available = ?'); profileParams.push(isAvailable ? 1 : 0); }

  if (profileUpdates.length > 0) {
    profileUpdates.push('updated_at = NOW()');
    profileParams.push(req.user.id);
    await query(`UPDATE doctor_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`, profileParams);
  }

  // Fetch updated profile
  const [updatedProfile] = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            dp.*
     FROM users u
     JOIN doctor_profiles dp ON u.id = dp.user_id
     WHERE u.id = ?`,
    [req.user.id]
  );

  sendSuccess(res, 200, 'Doctor profile updated successfully', updatedProfile);
}));

// ============================================
// PUT /api/v1/doctors/profile/image
// ============================================
router.put('/profile/image', authenticate, authorize(ROLES.DOCTOR), uploadProfileImage('profileImage'), handleMulterError, asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendSuccess(res, 400, 'No image file provided');
  }

  const [user] = await query('SELECT profile_image_url FROM users WHERE id = ?', [req.user.id]);
  if (user && user.profile_image_url) {
    await storageService.deleteFile(user.profile_image_url);
  }

  const uploaded = await storageService.uploadFile(req.file.buffer, req.file.originalname, 'profiles', req.file.mimetype);
  await query('UPDATE users SET profile_image_url = ?, updated_at = NOW() WHERE id = ?', [uploaded.url, req.user.id]);

  sendSuccess(res, 200, 'Profile image updated', { profileImageUrl: uploaded.url });
}));

// ============================================
// POST /api/v1/doctors/availability — Set availability
// ============================================
const availabilityValidator = [
  body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid day'),
  body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Invalid start time (HH:MM)'),
  body('endTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Invalid end time (HH:MM)'),
  body('maxPatients').optional().isInt({ min: 1, max: 100 }).withMessage('Max patients must be 1-100')
];

router.post('/availability', authenticate, authorize(ROLES.DOCTOR), availabilityValidator, validate, asyncHandler(async (req, res) => {
  const { dayOfWeek, startTime, endTime, maxPatients } = req.body;

  // Get doctor profile id
  const [profile] = await query('SELECT id FROM doctor_profiles WHERE user_id = ?', [req.user.id]);
  if (!profile) {
    return sendSuccess(res, 404, 'Doctor profile not found');
  }

  const result = await query(
    `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, max_patients, is_active)
     VALUES (?, ?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time), max_patients = VALUES(max_patients), is_active = 1`,
    [profile.id, dayOfWeek, startTime, endTime, maxPatients || 10]
  );

  sendSuccess(res, 201, 'Availability set successfully');
}));

// ============================================
// PUT /api/v1/doctors/availability/:id
// ============================================
router.put('/availability/:id', authenticate, authorize(ROLES.DOCTOR), asyncHandler(async (req, res) => {
  const { startTime, endTime, maxPatients, isActive } = req.body;
  const slotId = req.params.id;

  const [profile] = await query('SELECT id FROM doctor_profiles WHERE user_id = ?', [req.user.id]);
  const [slot] = await query('SELECT * FROM doctor_availability WHERE id = ? AND doctor_id = ?', [slotId, profile.id]);

  if (!slot) {
    return sendSuccess(res, 404, 'Availability slot not found');
  }

  const updates = [];
  const params = [];
  if (startTime) { updates.push('start_time = ?'); params.push(startTime); }
  if (endTime) { updates.push('end_time = ?'); params.push(endTime); }
  if (maxPatients) { updates.push('max_patients = ?'); params.push(maxPatients); }
  if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

  if (updates.length > 0) {
    params.push(slotId);
    await query(`UPDATE doctor_availability SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  sendSuccess(res, 200, 'Availability updated');
}));

// ============================================
// DELETE /api/v1/doctors/availability/:id
// ============================================
router.delete('/availability/:id', authenticate, authorize(ROLES.DOCTOR), asyncHandler(async (req, res) => {
  const [profile] = await query('SELECT id FROM doctor_profiles WHERE user_id = ?', [req.user.id]);
  await query('DELETE FROM doctor_availability WHERE id = ? AND doctor_id = ?', [req.params.id, profile.id]);
  sendSuccess(res, 200, 'Availability slot removed');
}));

// ============================================
// PUT /api/v1/doctors/upi — Update UPI details
// ============================================
router.put('/upi', authenticate, authorize(ROLES.DOCTOR), uploadSingle('qrCode'), handleMulterError, asyncHandler(async (req, res) => {
  const { upiId } = req.body;
  let qrUrl = null;

  if (req.file) {
    const uploaded = await storageService.uploadFile(req.file.buffer, req.file.originalname, 'qrcodes', req.file.mimetype);
    qrUrl = uploaded.url;
  }

  const updates = [];
  const params = [];
  if (upiId !== undefined) { updates.push('upi_id = ?'); params.push(upiId); }
  if (qrUrl) { updates.push('upi_qr_url = ?'); params.push(qrUrl); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    params.push(req.user.id);
    await query(`UPDATE doctor_profiles SET ${updates.join(', ')} WHERE user_id = ?`, params);
  }

  sendSuccess(res, 200, 'UPI details updated', { upiId, upiQrUrl: qrUrl });
}));

// ============================================
// GET /api/v1/doctors/patients — Doctor's patient list
// ============================================
router.get('/patients', authenticate, authorize(ROLES.DOCTOR), requireVerifiedDoctor, asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, disease } = req.query;

  let whereConditions = ['a.doctor_id = ?'];
  const params = [req.user.id];

  if (search) {
    whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const [countResult] = await query(
    `SELECT COUNT(DISTINCT a.patient_id) as total FROM appointments a JOIN users u ON a.patient_id = u.id ${whereClause}`,
    params
  );

  const patients = await query(
    `SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            pp.date_of_birth, pp.gender, pp.blood_group,
            (SELECT COUNT(*) FROM appointments WHERE patient_id = u.id AND doctor_id = ?) as total_appointments,
            (SELECT MAX(appointment_date) FROM appointments WHERE patient_id = u.id AND doctor_id = ?) as last_visit
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     LEFT JOIN patient_profiles pp ON u.id = pp.user_id
     ${whereClause}
     ORDER BY last_visit DESC
     LIMIT ? OFFSET ?`,
    [req.user.id, req.user.id, ...params, limit, offset]
  );

  sendPaginated(res, 'Patients retrieved', patients, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/doctors/patients/:id/history — Patient medical history (for doctor)
// ============================================
router.get('/patients/:id/history', authenticate, authorize(ROLES.DOCTOR), requireVerifiedDoctor, asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  // Verify doctor has treated this patient
  const [relationship] = await query(
    'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND patient_id = ?',
    [req.user.id, patientId]
  );

  if (relationship.count === 0) {
    return sendSuccess(res, 403, 'You can only view history of your patients');
  }

  const [patient] = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            pp.date_of_birth, pp.gender, pp.blood_group, pp.allergies, pp.chronic_conditions
     FROM users u
     LEFT JOIN patient_profiles pp ON u.id = pp.user_id
     WHERE u.id = ?`,
    [patientId]
  );

  const [reports, symptoms, prescriptions, appointments] = await Promise.all([
    query('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC', [patientId]),
    query('SELECT * FROM symptoms WHERE patient_id = ? ORDER BY recorded_at DESC', [patientId]),
    query(
      `SELECT p.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM prescriptions p JOIN users u ON p.doctor_id = u.id
       WHERE p.patient_id = ? ORDER BY p.created_at DESC`,
      [patientId]
    ),
    query(
      `SELECT a.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM appointments a JOIN users u ON a.doctor_id = u.id
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
      [patientId]
    )
  ]);

  sendSuccess(res, 200, 'Patient history retrieved', {
    patient,
    reports,
    symptoms,
    prescriptions,
    appointments
  });
}));

// ============================================
// GET /api/v1/doctors/dashboard
// ============================================
router.get('/dashboard', authenticate, authorize(ROLES.DOCTOR), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [
    todayAppointments,
    upcomingAppointments,
    pendingRequests,
    stats,
    recentPatients
  ] = await Promise.all([
    // Today's patients
    query(
      `SELECT a.*, u.first_name as patient_first_name, u.last_name as patient_last_name,
              u.profile_image_url as patient_image
       FROM appointments a JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.status = 'accepted'
       ORDER BY a.appointment_time ASC`,
      [req.user.id, today]
    ),
    // Upcoming appointments
    query(
      `SELECT a.*, u.first_name as patient_first_name, u.last_name as patient_last_name,
              u.profile_image_url as patient_image
       FROM appointments a JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = ? AND a.appointment_date > ? AND a.status = 'accepted'
       ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 10`,
      [req.user.id, today]
    ),
    // Pending consultation requests
    query(
      `SELECT a.*, u.first_name as patient_first_name, u.last_name as patient_last_name,
              u.profile_image_url as patient_image
       FROM appointments a JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = ? AND a.status = 'pending'
       ORDER BY a.created_at ASC`,
      [req.user.id]
    ),
    // Statistics
    query(
      `SELECT 
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = ?) as total_appointments,
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND status = 'completed') as completed_appointments,
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = ? AND status = 'pending') as pending_appointments,
         (SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = ?) as total_patients,
         (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE doctor_id = ? AND status = 'paid') as total_earnings`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    ),
    // Recent patients
    query(
      `SELECT DISTINCT u.id, u.first_name, u.last_name, u.profile_image_url,
              MAX(a.appointment_date) as last_visit
       FROM appointments a JOIN users u ON a.patient_id = u.id
       WHERE a.doctor_id = ? AND a.status = 'completed'
       GROUP BY u.id ORDER BY last_visit DESC LIMIT 5`,
      [req.user.id]
    )
  ]);

  sendSuccess(res, 200, 'Dashboard data retrieved', {
    todayAppointments,
    upcomingAppointments,
    pendingRequests,
    stats: stats[0],
    recentPatients
  });
}));




// ============================================
// GET /api/v1/doctors/:id — Get Doctor Profile
// ============================================
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const doctorId = req.params.id;

  const [doctor] = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url,
            dp.specialization, dp.qualification, dp.experience_years, dp.hospital_name,
            dp.hospital_address, dp.clinic_address, dp.consultation_fee, dp.biography,
            dp.is_available, dp.verification_status, dp.upi_id, dp.upi_qr_url
     FROM users u
     JOIN doctor_profiles dp ON u.id = dp.user_id
     WHERE u.id = ? AND dp.verification_status = 'approved'`,
    [doctorId]
  );

  if (!doctor) {
    return sendSuccess(res, 404, 'Doctor not found');
  }

  // Fetch availability
  const availability = await query(
    `SELECT da.* FROM doctor_availability da
     JOIN doctor_profiles dp ON da.doctor_id = dp.id
     WHERE dp.user_id = ? AND da.is_active = 1
     ORDER BY FIELD(da.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')`,
    [doctorId]
  );

  sendSuccess(res, 200, 'Doctor profile retrieved', { ...doctor, availability });
}));

module.exports = router;
