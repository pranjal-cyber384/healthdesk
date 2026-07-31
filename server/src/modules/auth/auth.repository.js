/**
 * Auth Repository
 * 
 * Data access layer for authentication-related database operations.
 * All queries use parameterized statements to prevent SQL injection.
 */

const { query, transaction } = require('../../config/database');

class AuthRepository {
  /**
   * Find a user by email
   */
  async findByEmail(email) {
    const results = await query('SELECT * FROM users WHERE email = ?', [email]);
    return results[0] || null;
  }

  /**
   * Find a user by ID
   */
  async findById(id) {
    const results = await query('SELECT * FROM users WHERE id = ?', [id]);
    return results[0] || null;
  }

  /**
   * Find a user by Google ID
   */
  async findByGoogleId(googleId) {
    const results = await query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return results[0] || null;
  }

  /**
   * Create a new user
   */
  async create({ email, passwordHash, firstName, lastName, role, phone, googleId, profileImageUrl, isEmailVerified }) {
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, google_id, profile_image_url, is_email_verified, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [email, passwordHash || null, firstName, lastName, role || 'patient', phone || null, googleId || null, profileImageUrl || null, isEmailVerified ? 1 : 0]
    );
    return { id: result.insertId, email, firstName, lastName, role: role || 'patient' };
  }

  /**
   * Update user's refresh token
   */
  async updateRefreshToken(userId, refreshToken) {
    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, userId]);
  }

  /**
   * Clear user's refresh token (logout)
   */
  async clearRefreshToken(userId) {
    await query('UPDATE users SET refresh_token = NULL WHERE id = ?', [userId]);
  }

  /**
   * Find user by refresh token
   */
  async findByRefreshToken(refreshToken) {
    const results = await query('SELECT * FROM users WHERE refresh_token = ?', [refreshToken]);
    return results[0] || null;
  }

  /**
   * Set password reset token and expiry
   */
  async setResetToken(userId, resetToken, expiryDate) {
    await query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, expiryDate, userId]
    );
  }

  /**
   * Find user by valid (non-expired) reset token
   */
  async findByResetToken(resetToken) {
    const results = await query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [resetToken]
    );
    return results[0] || null;
  }

  /**
   * Update password and clear reset token
   */
  async updatePassword(userId, passwordHash) {
    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId) {
    await query('UPDATE users SET is_email_verified = 1, updated_at = NOW() WHERE id = ?', [userId]);
  }

  /**
   * Create patient profile
   */
  async createPatientProfile(userId) {
    await query(
      'INSERT INTO patient_profiles (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())',
      [userId]
    );
  }

  /**
   * Create doctor profile
   */
  async createDoctorProfile(userId) {
    await query(
      `INSERT INTO doctor_profiles (user_id, verification_status, is_available, created_at, updated_at) 
       VALUES (?, 'pending', 0, NOW(), NOW())`,
      [userId]
    );
  }
}

module.exports = new AuthRepository();
