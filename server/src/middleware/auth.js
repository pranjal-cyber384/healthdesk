/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens from the Authorization header
 * and attaches the decoded user to req.user.
 */

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { query } = require('../config/database');

/**
 * Authenticate requests by verifying JWT token.
 * Expects: Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw AppError.unauthorized('Access token has expired', 'TOKEN_EXPIRED');
      }
      if (err.name === 'JsonWebTokenError') {
        throw AppError.unauthorized('Invalid access token', 'INVALID_TOKEN');
      }
      throw AppError.unauthorized('Authentication failed');
    }

    // Check if user still exists and is active
    const [user] = await query(
      'SELECT id, email, first_name, last_name, role, is_active, is_blocked, profile_image_url FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      throw AppError.unauthorized('User no longer exists');
    }

    if (user.is_blocked) {
      throw AppError.forbidden('Your account has been blocked. Contact support.');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      profileImageUrl: user.profile_image_url
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token provided.
 * Useful for endpoints that behave differently for authenticated users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await query(
      'SELECT id, email, first_name, last_name, role, is_active, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );

    if (user && user.is_active && !user.is_blocked) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      };
    } else {
      req.user = null;
    }

    next();
  } catch {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, optionalAuth };
