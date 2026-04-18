/**
 * Database Configuration
 * Uses mysql2 connection pool for efficient connection management.
 * Pool reuses connections instead of creating new ones for each query.
 */

const mysql = require('mysql2/promise');

// Pool configuration — reads from environment variables
const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 60000,
  waitForConnections: true,     // Queue requests when pool is exhausted
  queueLimit: 0,                // Unlimited queued connection requests
  enableKeepAlive: true,        // Prevent idle connection drops
  keepAliveInitialDelay: 0,
};

// Create the connection pool
const pool = mysql.createPool(poolConfig);

/**
 * Test the database connection on startup.
 * Logs success or failure — does NOT crash the process,
 * allowing the server to start and return 503 on DB errors.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected — host: ${poolConfig.host}, db: ${poolConfig.database}`);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('   Check your .env DB_* variables and ensure MySQL is running.');
  }
};

module.exports = { pool, testConnection };
