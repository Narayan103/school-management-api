/**
 * Validation Schemas — Schools
 * Uses Joi for declarative, composable input validation.
 */

const Joi = require('joi');

/**
 * Schema for POST /api/v1/schools/addSchool
 */
const addSchoolSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'School name cannot be empty.',
      'string.min': 'School name must be at least 2 characters.',
      'string.max': 'School name must not exceed 255 characters.',
      'any.required': 'School name is required.',
    }),

  address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Address cannot be empty.',
      'string.min': 'Address must be at least 5 characters.',
      'string.max': 'Address must not exceed 500 characters.',
      'any.required': 'Address is required.',
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a number.',
      'number.min': 'Latitude must be between -90 and 90.',
      'number.max': 'Latitude must be between -90 and 90.',
      'any.required': 'Latitude is required.',
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a number.',
      'number.min': 'Longitude must be between -180 and 180.',
      'number.max': 'Longitude must be between -180 and 180.',
      'any.required': 'Longitude is required.',
    }),
});

/**
 * Schema for GET /api/v1/schools/listSchools
 * All query params arrive as strings — Joi coerces them to numbers.
 */
const listSchoolsSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Query param `latitude` must be a number.',
      'number.min': 'Query param `latitude` must be between -90 and 90.',
      'number.max': 'Query param `latitude` must be between -90 and 90.',
      'any.required': 'Query param `latitude` is required.',
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Query param `longitude` must be a number.',
      'number.min': 'Query param `longitude` must be between -180 and 180.',
      'number.max': 'Query param `longitude` must be between -180 and 180.',
      'any.required': 'Query param `longitude` is required.',
    }),

  // Pagination — optional, with safe defaults
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Query param `page` must be a positive integer.',
      'number.min': 'Query param `page` must be at least 1.',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(parseInt(process.env.MAX_LIMIT, 10) || 100)
    .default(parseInt(process.env.DEFAULT_LIMIT, 10) || 10)
    .messages({
      'number.base': 'Query param `limit` must be a positive integer.',
      'number.min': 'Query param `limit` must be at least 1.',
      'number.max': `Query param \`limit\` must not exceed ${process.env.MAX_LIMIT || 100}.`,
    }),
});

module.exports = { addSchoolSchema, listSchoolsSchema };
