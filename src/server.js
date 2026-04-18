/**
 * server.js — HTTP server entry point
 *
 * Responsibilities:
 *  1. Load environment variables
 *  2. Initialise the DB connection pool and schema
 *  3. Start the HTTP server
 *  4. Register signal handlers for graceful shutdown
 */

require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/database');
const { initSchema } = require('./models/School');

const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Bootstrap sequence:
 *  - Verify DB connectivity
 *  - Ensure the schema exists
 *  - Bind the HTTP server
 */
const start = async () => {
  try {
    await testConnection();
    await initSchema();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`   Health:  http://localhost:${PORT}/health`);
      console.log(`   Add:     POST http://localhost:${PORT}/api/v1/schools/addSchool`);
      console.log(`   List:    GET  http://localhost:${PORT}/api/v1/schools/listSchools?latitude=23.0225&longitude=72.5714`);
    });

    // ── Graceful shutdown ──────────────────────────────────────────────────────
    // Allow in-flight requests to finish before exiting.
    const shutdown = (signal) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully…`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });

      // Force-exit if shutdown takes > 10 s
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Catch unhandled promise rejections — log and exit so the process manager restarts
    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled rejection:', reason);
      shutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
};

start();
