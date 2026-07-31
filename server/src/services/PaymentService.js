/**
 * Payment Service Abstraction
 * 
 * Wraps Razorpay SDK operations behind a clean interface.
 * Can be swapped with any payment provider without changing business logic.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const razorpayConfig = require('../config/razorpay');
const logger = require('../config/logger');

class PaymentService {
  constructor() {
    this.isConfigured = !!(razorpayConfig.keyId && razorpayConfig.keySecret);
    this.instance = null;

    if (this.isConfigured) {
      this.instance = new Razorpay({
        key_id: razorpayConfig.keyId,
        key_secret: razorpayConfig.keySecret
      });
      logger.info('PaymentService: Razorpay configured');
    } else {
      logger.warn('PaymentService: Razorpay not configured - payment features disabled');
    }
  }

  /**
   * Create a payment order
   * 
   * @param {Object} options
   * @param {number} options.amount - Amount in smallest currency unit (paise for INR)
   * @param {string} options.currency - Currency code (default: INR)
   * @param {string} options.receipt - Unique receipt ID
   * @param {Object} [options.notes] - Additional metadata
   * @returns {Promise<Object>} Razorpay order object
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.isConfigured) {
      throw new Error('Payment service is not configured');
    }

    try {
      const order = await this.instance.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt,
        notes
      });

      logger.info('Payment order created:', { orderId: order.id, amount, currency });
      return order;
    } catch (error) {
      logger.error('Failed to create payment order:', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify payment signature to confirm authenticity
   * 
   * @param {Object} params
   * @param {string} params.razorpayOrderId - Razorpay order ID
   * @param {string} params.razorpayPaymentId - Razorpay payment ID
   * @param {string} params.razorpaySignature - Razorpay signature
   * @returns {boolean} Whether the payment is verified
   */
  verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    try {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayConfig.keySecret)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === razorpaySignature;
      
      if (isValid) {
        logger.info('Payment verified successfully:', { paymentId: razorpayPaymentId });
      } else {
        logger.warn('Payment verification failed:', { paymentId: razorpayPaymentId });
      }

      return isValid;
    } catch (error) {
      logger.error('Payment verification error:', { error: error.message });
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  async getPaymentDetails(paymentId) {
    if (!this.isConfigured) {
      throw new Error('Payment service is not configured');
    }

    try {
      const payment = await this.instance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Failed to fetch payment details:', { error: error.message });
      throw error;
    }
  }

  /**
   * Initiate a refund for a payment
   * 
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} [amount] - Refund amount (full refund if not specified)
   * @returns {Promise<Object>} Refund details
   */
  async initiateRefund(paymentId, amount = null) {
    if (!this.isConfigured) {
      throw new Error('Payment service is not configured');
    }

    try {
      const refundOptions = {};
      if (amount) {
        refundOptions.amount = Math.round(amount * 100);
      }

      const refund = await this.instance.payments.refund(paymentId, refundOptions);
      logger.info('Refund initiated:', { paymentId, refundId: refund.id });
      return refund;
    } catch (error) {
      logger.error('Refund failed:', { error: error.message, paymentId });
      throw error;
    }
  }

  /**
   * Check if payment service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.isConfigured;
  }

  /**
   * Get the Razorpay key ID (safe to send to frontend)
   * @returns {string}
   */
  getPublicKey() {
    return razorpayConfig.keyId;
  }
}

// Singleton instance
const paymentService = new PaymentService();

module.exports = paymentService;
