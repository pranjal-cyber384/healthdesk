/**
 * HealthDesk Server Entry Point
 * 
 * Initializes the Express application, connects to MySQL,
 * and starts listening on the configured port.
 */

const dotenv = require('dotenv');

// Load environment variables before anything else
dotenv.config();

const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

/**
 * Start the server after establishing database connection
 */
async function startServer() {
  try {
    // Test database connection
    await connectDatabase();
    logger.info('✅ MySQL database connected successfully');

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 HealthDesk server running on port ${PORT}`);
      logger.info(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason: reason?.message || reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', { error: error.message });
    process.exit(1);
  }
}

startServer();
