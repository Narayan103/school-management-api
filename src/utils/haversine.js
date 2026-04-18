/**
 * Haversine Distance Utility
 *
 * Calculates the great-circle distance between two points on a sphere
 * (the Earth) using the Haversine formula.
 *
 * Formula reference: https://en.wikipedia.org/wiki/Haversine_formula
 */

const EARTH_RADIUS_KM = 6371; // Mean radius of the Earth in kilometres

/**
 * Convert degrees to radians.
 * @param {number} degrees
 * @returns {number} radians
 */
const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Calculate the distance between two geographic coordinates.
 *
 * @param {number} lat1  Latitude  of point 1 (degrees)
 * @param {number} lon1  Longitude of point 1 (degrees)
 * @param {number} lat2  Latitude  of point 2 (degrees)
 * @param {number} lon2  Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometres, rounded to 2 decimal places
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = EARTH_RADIUS_KM * c;

  // Round to 2 decimal places for a clean API response
  return Math.round(distanceKm * 100) / 100;
};

/**
 * Attach a `distance_km` field to each school object and sort by proximity.
 *
 * @param {Array<Object>} schools   Array of school rows from the DB
 * @param {number}        userLat   User's latitude
 * @param {number}        userLon   User's longitude
 * @returns {Array<Object>} Sorted schools with `distance_km` added
 */
const sortSchoolsByDistance = (schools, userLat, userLon) => {
  return schools
    .map((school) => ({
      ...school,
      distance_km: haversineDistance(userLat, userLon, school.latitude, school.longitude),
    }))
    .sort((a, b) => a.distance_km - b.distance_km);
};

module.exports = { haversineDistance, sortSchoolsByDistance };
