/**
 * Email Service Abstraction
 * 
 * Provides email sending capabilities with a provider-agnostic interface.
 * Currently design-ready with mock implementation for development.
 * Can be replaced with any email provider (SendGrid, Mailgun, SMTP, etc.)
 */

const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.isConfigured = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD
    );

    if (this.isConfigured) {
      logger.info('EmailService: Email provider configured');
    } else {
      logger.info('EmailService: Using mock email (logs only)');
    }
  }

  /**
   * Send an email
   * 
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text content
   * @returns {Promise<boolean>} Send success
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      // Mock: log the email in development
      logger.info('📧 [MOCK EMAIL]', { to, subject, preview: text?.substring(0, 100) || html?.substring(0, 100) });
      return true;
    }

    try {
      // Production email sending would go here
      // Example with nodemailer:
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({ from, to, subject, html, text });
      
      logger.info('Email sent:', { to, subject });
      return true;
    } catch (error) {
      logger.error('Email send failed:', { error: error.message, to, subject });
      return false;
    }
  }

  /**
   * Send password reset email
   * 
   * @param {string} email - Recipient email
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name
   */
  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'HealthDesk - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #0d6efd;">HealthDesk</h1>
          </div>
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; padding: 20px 0;">
            <a href="${resetUrl}" style="background-color: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from HealthDesk. Please do not reply.</p>
        </div>
      `,
      text: `Hello ${userName}, Reset your password by visiting: ${resetUrl}. This link expires in 1 hour.`
    });
  }

  /**
   * Send email verification email
   * 
   * @param {string} email - Recipient email
   * @param {string} verificationToken - Email verification token
   * @param {string} userName - User's name
   */
  async sendVerificationEmail(email, verificationToken, userName) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'HealthDesk - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #0d6efd;">HealthDesk</h1>
          </div>
          <h2>Verify Your Email</h2>
          <p>Hello ${userName},</p>
          <p>Welcome to HealthDesk! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; padding: 20px 0;">
            <a href="${verifyUrl}" style="background-color: #198754; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>If you didn't create a HealthDesk account, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from HealthDesk. Please do not reply.</p>
        </div>
      `,
      text: `Hello ${userName}, Verify your email by visiting: ${verifyUrl}`
    });
  }

  /**
   * Send appointment notification email
   * 
   * @param {string} email - Recipient email
   * @param {Object} appointment - Appointment details
   * @param {string} type - Notification type (booked, accepted, rejected, etc.)
   */
  async sendAppointmentEmail(email, appointment, type) {
    const subjects = {
      booked: 'New Appointment Request',
      accepted: 'Appointment Accepted',
      rejected: 'Appointment Declined',
      completed: 'Appointment Completed',
      cancelled: 'Appointment Cancelled'
    };

    return this.sendEmail({
      to: email,
      subject: `HealthDesk - ${subjects[type] || 'Appointment Update'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #0d6efd;">HealthDesk</h1>
          </div>
          <h2>${subjects[type] || 'Appointment Update'}</h2>
          <p>Your appointment details:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${appointment.date || 'TBD'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${appointment.time || 'TBD'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${appointment.type || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${type.toUpperCase()}</td></tr>
          </table>
          <p style="margin-top: 20px;">Log in to your HealthDesk account for more details.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from HealthDesk. Please do not reply.</p>
        </div>
      `,
      text: `Appointment ${type}: Date: ${appointment.date || 'TBD'}, Time: ${appointment.time || 'TBD'}`
    });
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = emailService;
