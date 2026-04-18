/**
 * School Routes
 * Maps HTTP methods + paths to controller actions.
 * Validation middleware runs before each controller.
 */

const express = require('express');
const router = express.Router();

const schoolController = require('../controllers/schoolController');
const { validate } = require('../middleware/validateRequest');
const { addSchoolSchema, listSchoolsSchema } = require('../middleware/validators');

/**
 * @route   POST /api/v1/schools/addSchool
 * @desc    Add a new school
 * @access  Public
 */
router.post(
  '/addSchool',
  validate(addSchoolSchema, 'body'),
  schoolController.addSchool
);

/**
 * @route   GET /api/v1/schools/listSchools
 * @desc    List all schools sorted by distance from a given location
 * @access  Public
 * @query   latitude  {number} required
 * @query   longitude {number} required
 * @query   page      {number} optional (default: 1)
 * @query   limit     {number} optional (default: 10)
 */
router.get(
  '/listSchools',
  validate(listSchoolsSchema, 'query'),
  schoolController.listSchools
);

module.exports = router;
