/**
 * HealthDesk Express Application
 * 
 * Configures all middleware, routes, and error handling
 * for the Express application.
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const corsMiddleware = require('./middleware/cors');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

// Import route modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const doctorRoutes = require('./modules/doctors/doctors.routes');
const patientRoutes = require('./modules/patients/patients.routes');
const appointmentRoutes = require('./modules/appointments/appointments.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescriptions.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const medicalRecordRoutes = require('./modules/medical-records/medical-records.routes');
const verificationRoutes = require('./modules/verification/verification.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const symptomRoutes = require('./modules/symptoms/symptoms.routes');
const notificationRoutes = require('./modules/notifications/notifications.routes');

const app = express();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// ==========================================
// CORS
// ==========================================
app.use(corsMiddleware);

// ==========================================
// COMPRESSION
// ==========================================
app.use(compression());

// ==========================================
// BODY PARSERS
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// REQUEST LOGGING
// ==========================================
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: { write: (message) => logger.http(message.trim()) }
}));

// ==========================================
// RATE LIMITING
// ==========================================
app.use('/api/', globalRateLimiter);

// ==========================================
// STATIC FILES (for local file storage fallback)
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HealthDesk API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==========================================
// API ROUTES (v1)
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HealthDesk API is running 🚀"
  });
});

// ==========================================
// SERVE FRONTEND IN PRODUCTION
// ==========================================
// if (process.env.NODE_ENV === 'production') {
//   const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
//   app.use(express.static(clientBuildPath));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(clientBuildPath, 'index.html'));
//   });
// }

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
