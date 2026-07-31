/**
 * Admin Module
 * Handles admin dashboard, user management, doctor management,
 * appointment/payment monitoring, and audit logs.
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
const AppError = require('../../utils/AppError');

// All admin routes require admin role
router.use(authenticate, authorize(ROLES.ADMIN));

// ============================================
// GET /api/v1/admin/dashboard — Admin dashboard stats
// ============================================
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [rawStats] = await query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'patient') as totalPatients,
      (SELECT COUNT(*) FROM users WHERE role = 'doctor') as totalDoctors,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') as totalAdmins,
      (SELECT COUNT(*) FROM users WHERE is_blocked = 1) as blockedUsers,
      (SELECT COUNT(*) FROM appointments) as totalAppointments,
      (SELECT COUNT(*) FROM appointments WHERE status = 'pending') as pendingAppointments,
      (SELECT COUNT(*) FROM appointments WHERE status = 'completed') as completedAppointments,
      (SELECT COUNT(*) FROM doctor_profiles WHERE verification_status = 'pending') as pendingVerificationsCount,
      (SELECT COUNT(*) FROM doctor_profiles WHERE verification_status = 'approved') as approvedDoctors,
      (SELECT COUNT(*) FROM payments WHERE status = 'paid') as totalPayments,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid') as totalRevenue,
      (SELECT COUNT(*) FROM medical_records) as totalRecords
  `);

  // Compute totalUsers
  const stats = {
    ...rawStats,
    totalUsers: (rawStats.totalPatients || 0) + (rawStats.totalDoctors || 0) + (rawStats.totalAdmins || 0),
    pendingVerifications: rawStats.pendingVerificationsCount || 0
  };

  // Recent activity
  const recentUsers = await query(
    "SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5"
  );

  const recentAppointments = await query(
    `SELECT a.*, 
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN users d ON a.doctor_id = d.id
     ORDER BY a.created_at DESC LIMIT 5`
  );

  // Pending verification requests (list for dashboard cards)
  const pendingVerifications = await query(
    `SELECT dp.id, dp.user_id, dp.specialization, dp.verification_status,
            u.first_name, u.last_name, u.email
     FROM doctor_profiles dp
     JOIN users u ON dp.user_id = u.id
     WHERE dp.verification_status = 'pending'
     ORDER BY dp.updated_at DESC LIMIT 5`
  );

  // Recent payments
  const recentPayments = await query(
    `SELECT pay.*, p.first_name as patient_first_name, p.last_name as patient_last_name
     FROM payments pay
     JOIN users p ON pay.patient_id = p.id
     ORDER BY pay.created_at DESC LIMIT 5`
  );

  sendSuccess(res, 200, 'Admin dashboard data', {
    stats,
    recentUsers,
    recentAppointments,
    pendingVerifications,
    recentPayments
  });
}));

// ============================================
// GET /api/v1/admin/users — List all users
// ============================================
router.get('/users', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, role, status } = req.query;

  let whereConditions = [];
  const params = [];

  if (search) {
    whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (role) {
    whereConditions.push('u.role = ?');
    params.push(role);
  }
  if (status === 'blocked') {
    whereConditions.push('u.is_blocked = 1');
  } else if (status === 'active') {
    whereConditions.push('u.is_active = 1 AND u.is_blocked = 0');
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM users u ${whereClause}`, params);

  const users = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.profile_image_url,
            u.is_email_verified, u.is_active, u.is_blocked, u.created_at, u.updated_at
     FROM users u
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Users retrieved', users, page, limit, countResult.total);
}));

// ============================================
// PUT /api/v1/admin/users/:id/block — Block/unblock user
// ============================================
router.put('/users/:id/block', asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { block } = req.body; // true to block, false to unblock

  if (parseInt(userId) === req.user.id) {
    throw AppError.badRequest('Cannot block yourself');
  }

  const [user] = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
  if (!user) throw AppError.notFound('User not found');

  if (user.role === ROLES.ADMIN) {
    throw AppError.badRequest('Cannot block an admin user');
  }

  await query('UPDATE users SET is_blocked = ?, updated_at = NOW() WHERE id = ?', [block ? 1 : 0, userId]);

  // Audit log
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
     VALUES (?, ?, 'user', ?, ?, ?, ?, NOW())`,
    [req.user.id, block ? 'BLOCK_USER' : 'UNBLOCK_USER', userId, JSON.stringify({ blocked: block }), req.ip, req.get('user-agent')]
  );

  sendSuccess(res, 200, `User ${block ? 'blocked' : 'unblocked'} successfully`);
}));

// ============================================
// DELETE /api/v1/admin/users/:id — Delete user
// ============================================
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (parseInt(userId) === req.user.id) {
    throw AppError.badRequest('Cannot delete yourself');
  }

  const [user] = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
  if (!user) throw AppError.notFound('User not found');

  if (user.role === ROLES.ADMIN) {
    throw AppError.badRequest('Cannot delete an admin user');
  }

  // Soft delete by deactivating
  await query('UPDATE users SET is_active = 0, is_blocked = 1, updated_at = NOW() WHERE id = ?', [userId]);

  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent, created_at)
     VALUES (?, 'DELETE_USER', 'user', ?, ?, ?, NOW())`,
    [req.user.id, userId, req.ip, req.get('user-agent')]
  );

  sendSuccess(res, 200, 'User deleted successfully');
}));

// ============================================
// PUT /api/v1/admin/users/:id — Update user
// ============================================
router.put('/users/:id', asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { firstName, lastName, phone, role, isActive } = req.body;

  const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) throw AppError.notFound('User not found');

  const updates = [];
  const params = [];

  if (firstName) { updates.push('first_name = ?'); params.push(firstName); }
  if (lastName) { updates.push('last_name = ?'); params.push(lastName); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (role && [ROLES.PATIENT, ROLES.DOCTOR].includes(role)) { updates.push('role = ?'); params.push(role); }
  if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    params.push(userId);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  sendSuccess(res, 200, 'User updated successfully');
}));

// ============================================
// GET /api/v1/admin/doctors — List all doctors
// ============================================
router.get('/doctors', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = ["u.role = 'doctor'"];
  const params = [];

  if (status) {
    whereConditions.push('dp.verification_status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM users u LEFT JOIN doctor_profiles dp ON u.id = dp.user_id ${whereClause}`,
    params
  );

  const doctors = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image_url, u.is_active, u.is_blocked,
            dp.specialization, dp.qualification, dp.experience_years, dp.hospital_name,
            dp.verification_status, dp.consultation_fee, dp.created_at,
            (dp.verification_status = 'suspended') as is_suspended
     FROM users u
     LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
     ${whereClause}
     ORDER BY dp.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Doctors retrieved', doctors, page, limit, countResult.total);
}));

// ============================================
// PUT /api/v1/admin/doctors/:id/suspend — Suspend doctor
// ============================================
router.put('/doctors/:id/suspend', asyncHandler(async (req, res) => {
  const doctorId = req.params.id;
  const { suspend } = req.body; // true to suspend, false to reinstate

  const [profile] = await query('SELECT * FROM doctor_profiles WHERE user_id = ?', [doctorId]);
  if (!profile) throw AppError.notFound('Doctor profile not found');

  const newStatus = suspend ? 'suspended' : 'approved';
  await query(
    `UPDATE doctor_profiles SET verification_status = ?, is_available = ?, updated_at = NOW() WHERE user_id = ?`,
    [newStatus, suspend ? 0 : 1, doctorId]
  );

  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address, user_agent, created_at)
     VALUES (?, ?, 'doctor_profile', ?, ?, ?, ?, NOW())`,
    [req.user.id, suspend ? 'SUSPEND_DOCTOR' : 'REINSTATE_DOCTOR', profile.id, JSON.stringify({ status: newStatus }), req.ip, req.get('user-agent')]
  );

  sendSuccess(res, 200, `Doctor ${suspend ? 'suspended' : 'reinstated'} successfully`);
}));

// ============================================
// GET /api/v1/admin/appointments — All appointments
// ============================================
router.get('/appointments', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = [];
  const params = [];

  if (status) {
    whereConditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM appointments a ${whereClause}`, params);

  const appointments = await query(
    `SELECT a.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name,
            dp.specialization
     FROM appointments a
     JOIN users p ON a.patient_id = p.id
     JOIN users d ON a.doctor_id = d.id
     LEFT JOIN doctor_profiles dp ON d.id = dp.user_id
     ${whereClause}
     ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Appointments retrieved', appointments, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/admin/payments — All payments
// ============================================
router.get('/payments', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status } = req.query;

  let whereConditions = [];
  const params = [];

  if (status) {
    whereConditions.push('pay.status = ?');
    params.push(status);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM payments pay ${whereClause}`, params);

  const payments = await query(
    `SELECT pay.*,
            p.first_name as patient_first_name, p.last_name as patient_last_name,
            d.first_name as doctor_first_name, d.last_name as doctor_last_name
     FROM payments pay
     JOIN users p ON pay.patient_id = p.id
     JOIN users d ON pay.doctor_id = d.id
     ${whereClause}
     ORDER BY pay.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Payments retrieved', payments, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/admin/audit-logs
// ============================================
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { action, entityType } = req.query;

  let whereConditions = [];
  const params = [];

  if (action) {
    whereConditions.push('al.action = ?');
    params.push(action);
  }
  if (entityType) {
    whereConditions.push('al.entity_type = ?');
    params.push(entityType);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const [countResult] = await query(`SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`, params);

  const logs = await query(
    `SELECT al.*,
            CONCAT(u.first_name, ' ', u.last_name) as admin_name,
            u.email as admin_email,
            al.entity_type as target_type,
            al.entity_id as target_id,
            al.new_values as details
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  sendPaginated(res, 'Audit logs retrieved', logs, page, limit, countResult.total);
}));

module.exports = router;
