/**
 * Symptoms Module
 * Handles symptom recording, history, and AI assessment integration.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/roleGuard');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const aiService = require('../../services/AIService');
const { ROLES } = require('../../utils/constants');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');
const { body } = require('express-validator');
const { validate } = require('../../middleware/validate');

router.use(authenticate);

// ============================================
// POST /api/v1/symptoms — Record symptoms
// ============================================
const createSymptomValidator = [
  body('description').notEmpty().withMessage('Symptom description is required').isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('severity').optional().isIn(['mild', 'moderate', 'severe']).withMessage('Invalid severity level')
];

router.post('/', authorize(ROLES.PATIENT), createSymptomValidator, validate, asyncHandler(async (req, res) => {
  const { description, severity } = req.body;

  const result = await query(
    `INSERT INTO symptoms (patient_id, description, severity, recorded_at, created_at)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [req.user.id, description, severity || 'mild']
  );

  sendSuccess(res, 201, 'Symptoms recorded successfully', { symptomId: result.insertId });
}));

// ============================================
// GET /api/v1/symptoms — Symptom history
// ============================================
router.get('/', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);


  const [countResult] = await query('SELECT COUNT(*) as total FROM symptoms WHERE patient_id = ?', [req.user.id]);

  const symptoms = await query(
    'SELECT * FROM symptoms WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT ? OFFSET ?',
    [req.user.id, limit, offset]
  );

  sendPaginated(res, 'Symptoms history retrieved', symptoms, page, limit, countResult.total);
}));

// ============================================
// GET /api/v1/symptoms/:id
// ============================================
router.get('/:id', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const [symptom] = await query('SELECT * FROM symptoms WHERE id = ? AND patient_id = ?', [req.params.id, req.user.id]);
  if (!symptom) throw AppError.notFound('Symptom record not found');
  sendSuccess(res, 200, 'Symptom record retrieved', symptom);
}));

// ============================================
// POST /api/v1/symptoms/:id/assess — AI Assessment (Future-ready)
// ============================================
router.post('/:id/assess', authorize(ROLES.PATIENT), asyncHandler(async (req, res) => {
  const [symptom] = await query('SELECT * FROM symptoms WHERE id = ? AND patient_id = ?', [req.params.id, req.user.id]);
  if (!symptom) throw AppError.notFound('Symptom record not found');

  // Get patient info for context
  const [patientProfile] = await query(
    `SELECT pp.date_of_birth, pp.gender, pp.allergies, pp.chronic_conditions
     FROM patient_profiles pp WHERE pp.user_id = ?`,
    [req.user.id]
  );

  // Calculate age from DOB
  let age = null;
  if (patientProfile && patientProfile.date_of_birth) {
    const dob = new Date(patientProfile.date_of_birth);
    age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
  }

  // Call AI service
  const assessment = await aiService.analyzeSymptoms(symptom.description, {
    age: age ? String(age) : undefined,
    gender: patientProfile?.gender,
    medicalHistory: [patientProfile?.allergies, patientProfile?.chronic_conditions].filter(Boolean).join(', ')
  });

  // Save assessment
  await query(
    'UPDATE symptoms SET ai_assessment = ?, severity = ?, recorded_at = recorded_at WHERE id = ?',
    [assessment.assessment, assessment.severity, symptom.id]
  );

  sendSuccess(res, 200, 'AI assessment generated', assessment);
}));

module.exports = router;
