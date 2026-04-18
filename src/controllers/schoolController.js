/**
 * School Controller
 * Handles HTTP request parsing and response formatting.
 * All business logic lives in the service layer.
 */

const schoolService = require('../services/schoolService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/v1/schools/addSchool
 *
 * Adds a new school to the database.
 * Input is pre-validated by the validate() middleware before this runs.
 */
const addSchool = async (req, res, next) => {
  try {
    const school = await schoolService.addSchool(req.body);

    return sendSuccess(
      res,
      'School added successfully.',
      school,
      201 // 201 Created
    );
  } catch (error) {
    // Duplicate school — return 409; all other errors bubble to globalErrorHandler
    if (error.statusCode === 409) {
      return sendError(res, error.message, 409);
    }
    return next(error);
  }
};

/**
 * GET /api/v1/schools/listSchools?latitude=&longitude=[&page=][&limit=]
 *
 * Returns all schools sorted by proximity to the given coordinates.
 * Supports optional pagination via `page` and `limit` query params.
 */
const listSchools = async (req, res, next) => {
  try {
    const { latitude, longitude, page, limit } = req.query;

    const { schools, pagination } = await schoolService.listSchools(
      parseFloat(latitude),
      parseFloat(longitude),
      parseInt(page, 10),
      parseInt(limit, 10)
    );

    return sendSuccess(res, 'Schools retrieved successfully.', {
      schools,
      pagination,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { addSchool, listSchools };
