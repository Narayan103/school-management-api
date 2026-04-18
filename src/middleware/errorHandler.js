/**
 * Error Handling Middleware
 *
 * Two middleware functions registered last in the Express stack:
 *  1. notFoundHandler  — catches any request that fell through all routes
 *  2. globalErrorHandler — catches any error passed via next(err)
 */

const { sendError } = require('../utils/response');

/**
 * 404 Not Found handler.
 * Registered AFTER all route definitions.
 */
const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

/**
 * Global error handler.
 * Registered AFTER notFoundHandler (must have 4 params for Express to treat it as error middleware).
 *
 * Handles:
 *  - MySQL errors (ER_DUP_ENTRY, ER_BAD_DB_ERROR, etc.)
 *  - Generic application errors
 *  - Unknown/unexpected errors
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  // Log the full stack in development; just the message in production
  if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Unhandled error:', err);
  } else {
    console.error(`💥 Error [${req.method} ${req.originalUrl}]:`, err.message);
  }

  // ── MySQL-specific error codes ──────────────────────────────────────────────
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 'Duplicate entry — this record already exists.', 409);
  }

  if (err.code === 'ER_BAD_DB_ERROR' || err.code === 'ECONNREFUSED') {
    return sendError(res, 'Database connection error. Please try again later.', 503);
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    return sendError(res, 'Database access denied.', 503);
  }

  // ── Application errors with an explicit status ──────────────────────────────
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.errors || null);
  }

  // ── Joi / express validation errors ────────────────────────────────────────
  if (err.isJoi) {
    return sendError(res, 'Validation error.', 422, err.details);
  }

  // ── Fallback: 500 Internal Server Error ─────────────────────────────────────
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';

  return sendError(res, message, 500);
};

module.exports = { notFoundHandler, globalErrorHandler };
