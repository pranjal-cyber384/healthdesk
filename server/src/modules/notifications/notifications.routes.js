/**
 * Notifications Module
 * Handles notification listing, read status, and management.
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../../utils/responseHelper');
const { query } = require('../../config/database');
const { parsePagination } = require('../../utils/helpers');
const AppError = require('../../utils/AppError');

router.use(authenticate);

// ============================================
// GET /api/v1/notifications
// ============================================
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { unreadOnly } = req.query;

  let whereConditions = ['n.user_id = ?'];
  const params = [req.user.id];

  if (unreadOnly === 'true') {
    whereConditions.push('n.is_read = 0');
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  const [countResult] = await query(`SELECT COUNT(*) as total FROM notifications n ${whereClause}`, params);

  const notifications = await query(
    `SELECT * FROM notifications n ${whereClause} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Also get unread count
  const [unreadCount] = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );

  sendPaginated(res, 'Notifications retrieved', notifications, page, limit, countResult.total);
}));

// ============================================
// PUT /api/v1/notifications/:id/read
// ============================================
router.put('/:id/read', asyncHandler(async (req, res) => {
  const [notification] = await query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!notification) throw AppError.notFound('Notification not found');

  await query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  sendSuccess(res, 200, 'Notification marked as read');
}));

// ============================================
// PUT /api/v1/notifications/read-all
// ============================================
router.put('/read-all', asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
  sendSuccess(res, 200, 'All notifications marked as read');
}));

module.exports = router;
