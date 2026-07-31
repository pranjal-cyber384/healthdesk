/**
 * Notification Service
 * 
 * Manages in-app notifications for users.
 * Provides methods to create, fetch, and manage notifications.
 */

const { query } = require('../config/database');
const logger = require('../config/logger');

class NotificationService {
  /**
   * Create a notification for a user
   * 
   * @param {Object} options
   * @param {number} options.userId - Target user ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type (appointment, payment, verification, system)
   * @param {string} [options.referenceId] - Related entity ID
   * @param {string} [options.referenceType] - Related entity type
   * @returns {Promise<Object>} Created notification
   */
  async create({ userId, title, message, type, referenceId = null, referenceType = null }) {
    try {
      const result = await query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [userId, title, message, type, referenceId, referenceType]
      );

      logger.debug('Notification created:', { userId, type, title });

      return {
        id: result.insertId,
        userId,
        title,
        message,
        type,
        referenceId,
        referenceType
      };
    } catch (error) {
      // Don't throw - notifications should never break the main flow
      logger.error('Failed to create notification:', { error: error.message, userId, type });
      return null;
    }
  }

  /**
   * Create an appointment notification
   */
  async appointmentNotification(userId, appointmentId, status, doctorName = '', patientName = '') {
    const messages = {
      pending: {
        title: 'New Appointment Request',
        message: `New appointment request from ${patientName}`
      },
      accepted: {
        title: 'Appointment Accepted',
        message: `Dr. ${doctorName} has accepted your appointment request`
      },
      rejected: {
        title: 'Appointment Declined',
        message: `Dr. ${doctorName} has declined your appointment request`
      },
      completed: {
        title: 'Appointment Completed',
        message: `Your appointment with Dr. ${doctorName} has been marked as completed`
      },
      cancelled: {
        title: 'Appointment Cancelled',
        message: `An appointment has been cancelled`
      }
    };

    const notif = messages[status] || { title: 'Appointment Update', message: `Appointment status: ${status}` };

    return this.create({
      userId,
      title: notif.title,
      message: notif.message,
      type: 'appointment',
      referenceId: String(appointmentId),
      referenceType: 'appointment'
    });
  }

  /**
   * Create a payment notification
   */
  async paymentNotification(userId, paymentId, status, amount) {
    const messages = {
      paid: {
        title: 'Payment Successful',
        message: `Payment of ₹${amount} has been received successfully`
      },
      failed: {
        title: 'Payment Failed',
        message: `Payment of ₹${amount} has failed. Please try again.`
      },
      refunded: {
        title: 'Payment Refunded',
        message: `Payment of ₹${amount} has been refunded`
      }
    };

    const notif = messages[status] || { title: 'Payment Update', message: `Payment status: ${status}` };

    return this.create({
      userId,
      title: notif.title,
      message: notif.message,
      type: 'payment',
      referenceId: String(paymentId),
      referenceType: 'payment'
    });
  }

  /**
   * Create a verification notification
   */
  async verificationNotification(userId, status) {
    const messages = {
      submitted: {
        title: 'Verification Submitted',
        message: 'Your verification documents have been submitted for review'
      },
      approved: {
        title: 'Verification Approved',
        message: 'Congratulations! Your doctor verification has been approved. You can now accept appointments.'
      },
      rejected: {
        title: 'Verification Rejected',
        message: 'Your verification has been rejected. Please check the feedback and resubmit.'
      }
    };

    const notif = messages[status] || { title: 'Verification Update', message: `Verification status: ${status}` };

    return this.create({
      userId,
      title: notif.title,
      message: notif.message,
      type: 'verification',
      referenceId: null,
      referenceType: 'verification'
    });
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;
