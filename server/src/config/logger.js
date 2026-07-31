/**
 * Winston Logger Configuration
 * 
 * Provides structured logging with different transports
 * for development and production environments.
 */

const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * Custom log format for development (human-readable)
 */
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  let log = `${ts} [${level}]: ${stack || message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  return log;
});

/**
 * Create the Winston logger instance
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  defaultMeta: { service: 'healthdesk-api' },
  transports: []
});

// Development: colorized console output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      devFormat
    )
  }));
} else {
  // Production: JSON format to files
  const logDir = process.env.LOG_DIR || path.join(__dirname, '..', '..', 'logs');

  logger.add(new winston.transports.Console({
    format: combine(json())
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: combine(json()),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: combine(json()),
    maxsize: 5242880,
    maxFiles: 5
  }));
}

module.exports = logger;
