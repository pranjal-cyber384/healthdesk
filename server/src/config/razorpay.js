/**
 * Razorpay Configuration
 * 
 * Provides Razorpay instance configuration.
 * The actual payment logic is abstracted in PaymentService.
 */

const razorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  currency: 'INR',
  // Webhook secret for payment verification
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
};

module.exports = razorpayConfig;
