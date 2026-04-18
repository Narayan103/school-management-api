-- ============================================================
--  School Management System — MySQL Schema
--  Run this script once to create the database and table.
-- ============================================================

-- Create the database if it does not exist
CREATE DATABASE IF NOT EXISTS school_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_management;

-- ============================================================
--  Table: schools
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id          INT            NOT NULL AUTO_INCREMENT      COMMENT 'Primary key',
  name        VARCHAR(255)   NOT NULL                     COMMENT 'School name',
  address     VARCHAR(500)   NOT NULL                     COMMENT 'Physical address',
  latitude    FLOAT(10, 6)   NOT NULL                     COMMENT 'Geographic latitude  (-90  to  90)',
  longitude   FLOAT(10, 6)   NOT NULL                     COMMENT 'Geographic longitude (-180 to 180)',
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                          COMMENT 'Record creation time',
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP  COMMENT 'Last update time',

  PRIMARY KEY (id),

  -- Composite index on lat/lng — dramatically speeds up
  -- bounding-box pre-filters before the Haversine sort.
  INDEX idx_lat_lng (latitude, longitude),

  -- Index on name — useful for future search / duplicate checks.
  INDEX idx_name (name)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores school records with geographic coordinates';

-- ============================================================
--  Sample data — useful for smoke-testing the list endpoint
-- ============================================================
INSERT IGNORE INTO schools (name, address, latitude, longitude) VALUES
  ('Delhi Public School',    'Sector 45, Gurugram, Haryana',         28.4595,  77.0266),
  ('Ryan International',     'Malad West, Mumbai, Maharashtra',      19.1876,  72.8484),
  ('Kendriya Vidyalaya',     'Navrangpura, Ahmedabad, Gujarat',      23.0330,  72.5580),
  ('St. Xavier High School', 'Mirzapur Road, Ahmedabad, Gujarat',   23.0225,  72.5714),
  ('Amity International',    'Sector 1, Noida, Uttar Pradesh',       28.5355,  77.3910),
  ('The Doon School',        'Mall Road, Dehradun, Uttarakhand',     30.3165,  78.0322);

-- Verify the insert
SELECT id, name, latitude, longitude FROM schools;
