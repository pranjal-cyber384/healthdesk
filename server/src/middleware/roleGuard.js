/**
 * Role-Based Access Control Middleware
 * 
 * Restricts route access based on user roles.
 * Must be used after the authenticate middleware.
 */

const AppError = require('../utils/AppError');
const { ROLES, VERIFICATION_STATUS } = require('../utils/constants');
const { query } = require('../config/database');

/**
 * Restrict access to specific roles.
 * 
 * @param  {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware
 * 
 * @example
 * router.get('/admin-only', authenticate, authorize(ROLES.ADMIN), handler);
 * router.get('/doctors-and-admin', authenticate, authorize(ROLES.DOCTOR, ROLES.ADMIN), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(
        `Access denied. Required role(s): ${allowedRoles.join(', ')}`
      ));
    }

    next();
  };
};

/**
 * Ensure a doctor is verified (approved) before allowing access.
 * Must be used after authenticate middleware on doctor-only routes.
 */
const requireVerifiedDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.DOCTOR) {
      return next(AppError.forbidden('This action is only available to doctors'));
    }

    const [profile] = await query(
      'SELECT verification_status FROM doctor_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (!profile) {
      return next(AppError.forbidden('Doctor profile not found. Please complete your profile first.'));
    }

    if (profile.verification_status !== VERIFICATION_STATUS.APPROVED) {
      return next(AppError.forbidden(
        `Your doctor account is ${profile.verification_status}. Only approved doctors can perform this action.`
      ));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authorize, requireVerifiedDoctor };
