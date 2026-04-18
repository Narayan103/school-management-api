/**
 * School Model
 * Encapsulates all database operations for the `schools` table.
 * Uses parameterized queries to prevent SQL injection.
 */

const { pool } = require('../config/database');

/**
 * SQL to create the schools table.
 * - FLOAT(10,6) gives ~6 decimal places of precision for lat/lng.
 * - Spatial indexes on lat/lng improve proximity query performance.
 * - created_at / updated_at provide an audit trail.
 */
const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schools (
    id          INT            NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255)   NOT NULL,
    address     VARCHAR(500)   NOT NULL,
    latitude    FLOAT(10, 6)   NOT NULL,
    longitude   FLOAT(10, 6)   NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    -- Composite index for proximity queries that filter by lat/lng range
    INDEX idx_lat_lng (latitude, longitude),

    -- Full-text index for future name/address search features
    INDEX idx_name (name)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * Initialise the schema.  Called once at server startup.
 */
const initSchema = async () => {
  try {
    await pool.execute(CREATE_TABLE_SQL);
    console.log('✅ Schema ready — table `schools` exists.');
  } catch (error) {
    console.error('❌ Schema initialisation failed:', error.message);
    throw error;
  }
};

/**
 * Insert a new school record.
 *
 * @param {Object} schoolData
 * @param {string} schoolData.name
 * @param {string} schoolData.address
 * @param {number} schoolData.latitude
 * @param {number} schoolData.longitude
 * @returns {Object} The inserted row (including generated id and timestamps)
 */
const createSchool = async ({ name, address, latitude, longitude }) => {
  const sql = `
    INSERT INTO schools (name, address, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [name, address, latitude, longitude]);

  // Fetch and return the full row so callers see all fields including timestamps
  return findById(result.insertId);
};

/**
 * Fetch a single school by its primary key.
 *
 * @param {number} id
 * @returns {Object|null}
 */
const findById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM schools WHERE id = ?', [id]);
  return rows[0] || null;
};

/**
 * Fetch every school from the database.
 * Distance calculation and sorting happen in the service layer (Haversine),
 * keeping the model responsible only for persistence concerns.
 *
 * @returns {Array<Object>}
 */
const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, name, address, latitude, longitude, created_at, updated_at FROM schools'
  );
  return rows;
};

/**
 * Check whether a school with the exact same name + address already exists.
 * Used for duplicate-prevention in the service layer.
 *
 * @param {string} name
 * @param {string} address
 * @returns {Object|null}
 */
const findByNameAndAddress = async (name, address) => {
  const [rows] = await pool.execute(
    'SELECT id FROM schools WHERE name = ? AND address = ? LIMIT 1',
    [name, address]
  );
  return rows[0] || null;
};

/**
 * Return the total number of schools.
 * Used by pagination helpers.
 *
 * @returns {number}
 */
const countAll = async () => {
  const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM schools');
  return rows[0].total;
};

module.exports = {
  initSchema,
  createSchool,
  findById,
  findAll,
  findByNameAndAddress,
  countAll,
};
