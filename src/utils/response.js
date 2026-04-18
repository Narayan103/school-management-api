/**
 * API Response Helpers
 * Centralises response shaping so every endpoint returns a consistent envelope.
 */

/**
 * Send a successful response.
 *
 * @param {import('express').Response} res
 * @param {string}  message    Human-readable success message
 * @param {*}       data       Payload to include in `data`
 * @param {number}  [statusCode=200]
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 *
 * @param {import('express').Response} res
 * @param {string}  message       Human-readable error message
 * @param {number}  [statusCode=500]
 * @param {*}       [errors=null] Validation errors or extra detail
 */
const sendError = (res, message, statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Build a pagination metadata object to include in list responses.
 *
 * @param {number} total   Total number of matching records
 * @param {number} page    Current page (1-based)
 * @param {number} limit   Items per page
 * @returns {Object}
 */
const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
};

module.exports = { sendSuccess, sendError, buildPagination };
