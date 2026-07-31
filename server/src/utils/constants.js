/**
 * Application Constants
 * 
 * Central location for all magic values used across the application.
 * Prevents string duplication and makes refactoring easier.
 */

const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
};

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const PAYMENT_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

const DOCUMENT_TYPES = {
  MEDICAL_LICENSE: 'medical_license',
  GOVERNMENT_ID: 'government_id',
  CERTIFICATE: 'certificate',
  EDUCATION: 'education',
  OTHER: 'other'
};

const RECORD_TYPES = {
  REPORT: 'report',
  IMAGE: 'image',
  PRESCRIPTION: 'prescription',
  DIAGNOSIS: 'diagnosis'
};

const CONSULTATION_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  PAYMENT: 'payment',
  VERIFICATION: 'verification',
  SYSTEM: 'system'
};

const SEVERITY_LEVELS = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe'
};

const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday'
];

const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf']
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760; // 10MB

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

module.exports = {
  ROLES,
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  VERIFICATION_STATUS,
  DOCUMENT_TYPES,
  RECORD_TYPES,
  CONSULTATION_TYPES,
  NOTIFICATION_TYPES,
  SEVERITY_LEVELS,
  GENDER,
  BLOOD_GROUPS,
  DAYS_OF_WEEK,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  PAGINATION
};
