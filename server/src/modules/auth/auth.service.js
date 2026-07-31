/**
 * Auth Service
 * 
 * Business logic for authentication operations.
 * Handles registration, login, token management, and password reset.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const { verifyGoogleToken } = require('../../config/passport');
const emailService = require('../../services/EmailService');
const AppError = require('../../utils/AppError');
const { generateToken, hashToken, sanitizeUser } = require('../../utils/helpers');
const { ROLES } = require('../../utils/constants');

class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Register a new user
   */
  async register({ email, password, firstName, lastName, role, phone }) {
    // Check if email already exists
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw AppError.conflict('An account with this email already exists');
    }

    // Validate role
    const allowedRoles = [ROLES.PATIENT, ROLES.DOCTOR];
    if (role && !allowedRoles.includes(role)) {
      throw AppError.badRequest('Invalid role. Must be patient or doctor.');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await authRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: role || ROLES.PATIENT,
      phone,
      isEmailVerified: false
    });

    // Create role-specific profile
    if (newUser.role === ROLES.PATIENT) {
      await authRepository.createPatientProfile(newUser.id);
    } else if (newUser.role === ROLES.DOCTOR) {
      await authRepository.createDoctorProfile(newUser.id);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    // Store refresh token
    await authRepository.updateRefreshToken(newUser.id, refreshToken);

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail(email, generateToken(), `${firstName} ${lastName}`).catch(() => {});

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Login with email and password
   */
  async login({ email, password }) {
    // Find user
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check if user has a password (might be Google-only account)
    if (!user.password_hash) {
      throw AppError.unauthorized('This account uses Google Sign-In. Please login with Google.');
    }

    // Check if account is blocked
    if (user.is_blocked) {
      throw AppError.forbidden('Your account has been blocked. Contact support.');
    }

    // Check if account is active
    if (!user.is_active) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await authRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticate via Google OAuth
   */
  async googleAuth(idToken) {
    // Verify Google token
    let googleUser;
    try {
      googleUser = await verifyGoogleToken(idToken);
    } catch (error) {
      throw AppError.unauthorized('Invalid Google token');
    }

    // Check if user exists with this Google ID
    let user = await authRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      // Check if email already exists (link accounts)
      user = await authRepository.findByEmail(googleUser.email);

      if (user) {
        // Existing user - link Google account
        const { query: dbQuery } = require('../../config/database');
        await dbQuery('UPDATE users SET google_id = ?, profile_image_url = COALESCE(profile_image_url, ?), is_email_verified = 1 WHERE id = ?', 
          [googleUser.googleId, googleUser.profileImage, user.id]
        );
        user = await authRepository.findById(user.id);
      } else {
        // New user - create account
        const newUser = await authRepository.create({
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          role: ROLES.PATIENT,
          googleId: googleUser.googleId,
          profileImageUrl: googleUser.profileImage,
          isEmailVerified: true
        });

        // Create patient profile
        await authRepository.createPatientProfile(newUser.id);
        user = await authRepository.findById(newUser.id);
      }
    }

    // Check blocked/active status
    if (user.is_blocked) {
      throw AppError.forbidden('Your account has been blocked. Contact support.');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Your account has been deactivated');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    await authRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token is required');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find user with matching refresh token
    const user = await authRepository.findById(decoded.id);
    if (!user || user.refresh_token !== refreshToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    if (user.is_blocked || !user.is_active) {
      throw AppError.forbidden('Account is not active');
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(user);

    return { accessToken: newAccessToken };
  }

  /**
   * Logout - clear refresh token
   */
  async logout(userId) {
    await authRepository.clearRefreshToken(userId);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    // Generate reset token
    const resetToken = generateToken();
    const hashedResetToken = hashToken(resetToken);
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.setResetToken(user.id, hashedResetToken, expiryDate);

    // Send reset email (non-blocking)
    emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      `${user.first_name} ${user.last_name}`
    ).catch(() => {});

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
    const hashedToken = hashToken(token);
    const user = await authRepository.findByResetToken(hashedToken);

    if (!user) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await authRepository.updatePassword(user.id, passwordHash);

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return sanitizeUser(user);
  }
}

module.exports = new AuthService();
