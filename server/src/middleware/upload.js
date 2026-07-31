/**
 * File Upload Middleware (Multer)
 * 
 * Configures Multer for file uploads with validation.
 * Files are stored in memory buffer for forwarding to Azure Blob Storage
 * or local filesystem.
 */

const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');
const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../utils/constants');

/**
 * Memory storage - files are buffered in memory for processing
 * before uploading to Azure Blob Storage or saving locally.
 */
const storage = multer.memoryStorage();

/**
 * File filter - validates file type based on MIME type and extension
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = Object.keys(ALLOWED_FILE_TYPES);
  const fileExt = path.extname(file.originalname).toLowerCase();

  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(`File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`, 400),
      false
    );
  }

  // Check extension matches MIME type
  const allowedExtensions = ALLOWED_FILE_TYPES[file.mimetype] || [];
  if (!allowedExtensions.includes(fileExt)) {
    return cb(
      new AppError(`File extension '${fileExt}' does not match the file type`, 400),
      false
    );
  }

  cb(null, true);
};

/**
 * Profile image filter - only allows image files
 */
const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new AppError('Only image files are allowed for profile pictures', 400), false);
  }
  cb(null, true);
};

/**
 * Single file upload - for profile images, single report uploads
 * 
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
const uploadSingle = (fieldName) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1
    }
  }).single(fieldName);
};

/**
 * Multiple file upload - for batch report uploads, verification documents
 * 
 * @param {string} fieldName - Form field name
 * @param {number} [maxCount=5] - Maximum number of files
 * @returns {Function} Multer middleware
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

/**
 * Profile image upload - restricted to image files only
 * 
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
const uploadProfileImage = (fieldName) => {
  return multer({
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB for profile images
      files: 1
    }
  }).single(fieldName);
};

/**
 * Handle Multer errors with user-friendly messages
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(AppError.badRequest(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(AppError.badRequest('Too many files uploaded'));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(AppError.badRequest(`Unexpected file field: ${err.field}`));
    }
    return next(AppError.badRequest(err.message));
  }
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadProfileImage,
  handleMulterError
};
