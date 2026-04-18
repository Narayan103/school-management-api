/**
 * Validation Middleware Factory
 *
 * Returns an Express middleware that validates request data against a Joi schema.
 * On failure it short-circuits with a 422 response listing every field error.
 *
 * Usage:
 *   router.post('/addSchool', validate(addSchoolSchema, 'body'), controller.addSchool);
 *   router.get('/listSchools', validate(listSchoolsSchema, 'query'), controller.listSchools);
 */

const { sendError } = require('../utils/response');

/**
 * @param {import('joi').ObjectSchema} schema   Joi schema to validate against
 * @param {'body'|'query'|'params'}   source    Which part of req to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,    // Collect ALL errors, not just the first
      stripUnknown: true,   // Drop keys not present in the schema
      convert: true,        // Coerce strings → numbers, etc.
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return sendError(res, 'Validation failed. Please check your input.', 422, errors);
    }

    // Replace req[source] with the sanitised + coerced value
    req[source] = value;
    return next();
  };
};

module.exports = { validate };
