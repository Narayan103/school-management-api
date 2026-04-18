/**
 * School Service
 * Business logic layer — sits between controllers and the model.
 * Controllers call service methods; service methods call model methods.
 */

const School = require('../models/School');
const { sortSchoolsByDistance } = require('../utils/haversine');
const { buildPagination } = require('../utils/response');

/**
 * Create a new school after checking for duplicates.
 *
 * @param {Object} data  Validated body from the controller
 * @returns {Object}     The newly created school record
 * @throws               AppError (409) if a school with same name+address exists
 */
const addSchool = async (data) => {
  const { name, address, latitude, longitude } = data;

  // Duplicate check — same name AND address
  const existing = await School.findByNameAndAddress(name, address);
  if (existing) {
    const err = new Error(
      `A school named "${name}" at "${address}" already exists.`
    );
    err.statusCode = 409;
    throw err;
  }

  const school = await School.createSchool({ name, address, latitude, longitude });
  return school;
};

/**
 * Fetch all schools, calculate distances from the user's position,
 * sort ascending, and apply pagination.
 *
 * @param {number} userLat   User's latitude
 * @param {number} userLon   User's longitude
 * @param {number} page      Page number (1-based)
 * @param {number} limit     Items per page
 * @returns {{ schools: Array, pagination: Object }}
 */
const listSchools = async (userLat, userLon, page, limit) => {
  // 1. Fetch every school (distance sort happens in-process)
  const allSchools = await School.findAll();

  if (allSchools.length === 0) {
    return {
      schools: [],
      pagination: buildPagination(0, page, limit),
    };
  }

  // 2. Calculate distance from user and sort by proximity
  const sorted = sortSchoolsByDistance(allSchools, userLat, userLon);

  // 3. Apply pagination
  const total = sorted.length;
  const startIndex = (page - 1) * limit;
  const paginated = sorted.slice(startIndex, startIndex + limit);

  return {
    schools: paginated,
    pagination: buildPagination(total, page, limit),
  };
};

module.exports = { addSchool, listSchools };
