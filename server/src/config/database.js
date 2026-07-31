/**
 * MySQL Database Configuration
 * 
 * Uses mysql2 with connection pooling for optimal performance.
 * Pool settings are tuned for production use.
 */

const mysql = require('mysql2/promise');
const logger = require('./logger');

/**
 * Create a connection pool with environment-based configuration.
 * Connection pooling avoids the overhead of creating new connections
 * for each query and manages connection lifecycle automatically.
 */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'healthdesk',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // MySQL 8.0+ timezone handling
  timezone: '+00:00',
  // Return dates as strings to avoid timezone conversion issues
  dateStrings: true
});

/**
 * Test the database connection on startup.
 * Throws if the connection fails so the server won't start with a broken DB.
 */
async function connectDatabase() {
  try {
    const connection = await pool.getConnection();
    logger.info(`MySQL connected to ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE}`);
    connection.release();
    return true;
  } catch (error) {
    logger.error('MySQL connection failed:', { error: error.message });
    throw error;
  }
}

/**
 * Execute a parameterized SQL query.
 * Always use parameterized queries to prevent SQL injection.
 * 
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    logger.error('Database query error:', {
      sql: sql.substring(0, 200),
      error: error.message
    });
    throw error;
  }
}

/**
 * Execute a transaction with multiple queries.
 * Automatically rolls back on error.
 * 
 * @param {Function} callback - Async function receiving the connection
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction rolled back:', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  connectDatabase
};
