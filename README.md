# 🏫 School Management API

A production-ready REST API for managing schools with proximity-based sorting, built with **Node.js**, **Express.js**, and **MySQL**.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Postman Collection](#postman-collection)
- [Deployment on Render](#deployment-on-render)
- [Architecture Notes](#architecture-notes)

---

## Features

- **Add School** — validated POST endpoint with duplicate detection
- **List Schools** — sorted by Haversine distance from the user's coordinates
- **Pagination** — `page` and `limit` query params on the list endpoint
- **Input validation** — Joi schemas with field-level error messages
- **Global error handling** — MySQL error codes mapped to HTTP responses
- **Connection pooling** — `mysql2` pool with configurable limits
- **Graceful shutdown** — SIGTERM/SIGINT handlers drain in-flight requests
- **CORS + Morgan** — cross-origin and request logging

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Runtime    | Node.js >= 18           |
| Framework  | Express.js 4            |
| Database   | MySQL 8 / MariaDB 10.6+ |
| Validation | Joi 17                  |
| DB Driver  | mysql2 (promise API)    |
| Logging    | Morgan                  |
| Config     | dotenv                  |

---

## Project Structure

```
school-management-api/
├── src/
│   ├── config/
│   │   └── database.js          # mysql2 pool + testConnection()
│   ├── controllers/
│   │   └── schoolController.js  # HTTP layer: parse req, send res
│   ├── middleware/
│   │   ├── errorHandler.js      # 404 + global error middleware
│   │   ├── validateRequest.js   # Joi middleware factory
│   │   └── validators.js        # Joi schemas (addSchool, listSchools)
│   ├── models/
│   │   └── School.js            # All SQL queries, schema init
│   ├── routes/
│   │   └── schoolRoutes.js      # Route -> middleware -> controller wiring
│   ├── services/
│   │   └── schoolService.js     # Business logic (duplicate check, sort, paginate)
│   ├── utils/
│   │   ├── haversine.js         # Haversine formula + sortSchoolsByDistance()
│   │   └── response.js          # sendSuccess / sendError / buildPagination
│   ├── app.js                   # Express app factory (no port binding)
│   └── server.js                # Entry point: DB init -> listen -> shutdown
├── schema.sql                   # SQL to create DB + table + sample data
├── School_Management_API.postman_collection.json
├── .env.example
├── .gitignore
└── package.json
```

---

## Prerequisites

- **Node.js** >= 18 (https://nodejs.org)
- **MySQL 8+** or **MariaDB 10.6+** running locally or remotely
- **npm** (ships with Node)

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/school-management-api.git
cd school-management-api

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in your values
cp .env.example .env
```

---

## Database Setup

### Option A — Run the provided SQL file

```bash
mysql -u root -p < schema.sql
```

This creates the `school_management` database, the `schools` table with indexes, and loads six sample schools for testing.

### Option B — Manual steps

```sql
CREATE DATABASE IF NOT EXISTS school_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE school_management;

CREATE TABLE IF NOT EXISTS schools (
  id          INT            NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)   NOT NULL,
  address     VARCHAR(500)   NOT NULL,
  latitude    FLOAT(10, 6)   NOT NULL,
  longitude   FLOAT(10, 6)   NOT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_lat_lng (latitude, longitude),
  INDEX idx_name    (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> **Performance note:** The composite index `idx_lat_lng` supports future bounding-box
> pre-filters (WHERE latitude BETWEEN ? AND ?) before the in-process Haversine sort.

---

## Environment Variables

| Variable              | Default              | Description                              |
|-----------------------|----------------------|------------------------------------------|
| `PORT`                | `3000`               | HTTP port                                |
| `NODE_ENV`            | `development`        | `development` or `production`            |
| `DB_HOST`             | `localhost`          | MySQL host                               |
| `DB_PORT`             | `3306`               | MySQL port                               |
| `DB_USER`             | `root`               | MySQL username                           |
| `DB_PASSWORD`         | *(empty)*            | MySQL password                           |
| `DB_NAME`             | `school_management`  | Database name                            |
| `DB_CONNECTION_LIMIT` | `10`                 | Max pool connections                     |
| `CORS_ORIGIN`         | `*`                  | Allowed origins (comma-separated or `*`) |
| `DEFAULT_LIMIT`       | `10`                 | Default page size for listSchools        |
| `MAX_LIMIT`           | `100`                | Maximum allowed page size                |

---

## Running the Server

```bash
# Development (auto-restart on file changes via nodemon)
npm run dev

# Production
npm start
```

On startup you will see:

```
✅ MySQL connected — host: localhost, db: school_management
✅ Schema ready — table `schools` exists.
🚀 Server running on port 3000 [development]
   Health:  http://localhost:3000/health
   Add:     POST http://localhost:3000/api/v1/schools/addSchool
   List:    GET  http://localhost:3000/api/v1/schools/listSchools?latitude=23.0225&longitude=72.5714
```

---

## API Reference

### Base URL

```
http://localhost:3000/api/v1
```

---

### GET /health

Server health check — no authentication required.

**Response 200**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

---

### POST /schools/addSchool

Add a new school to the database.

**Request body**

| Field       | Type   | Required | Constraints   |
|-------------|--------|----------|---------------|
| `name`      | string | Yes      | 2–255 chars   |
| `address`   | string | Yes      | 5–500 chars   |
| `latitude`  | number | Yes      | -90 to 90     |
| `longitude` | number | Yes      | -180 to 180   |

**Example**
```bash
curl -X POST http://localhost:3000/api/v1/schools/addSchool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "St. Xavier High School",
    "address": "Mirzapur Road, Ahmedabad, Gujarat",
    "latitude": 23.0225,
    "longitude": 72.5714
  }'
```

**201 Created**
```json
{
  "success": true,
  "message": "School added successfully.",
  "data": {
    "id": 1,
    "name": "St. Xavier High School",
    "address": "Mirzapur Road, Ahmedabad, Gujarat",
    "latitude": 23.0225,
    "longitude": 72.5714,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**422 Validation Error**
```json
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "errors": [
    { "field": "name",     "message": "School name cannot be empty." },
    { "field": "latitude", "message": "Latitude must be between -90 and 90." }
  ]
}
```

**409 Duplicate**
```json
{
  "success": false,
  "message": "A school named \"St. Xavier\" at \"Ahmedabad\" already exists."
}
```

---

### GET /schools/listSchools

Fetch all schools sorted by distance (ascending) from the provided coordinates.

**Query parameters**

| Param       | Type    | Required | Default | Description              |
|-------------|---------|----------|---------|--------------------------|
| `latitude`  | number  | Yes      | —       | User's latitude          |
| `longitude` | number  | Yes      | —       | User's longitude         |
| `page`      | integer | No       | `1`     | Page number (>= 1)       |
| `limit`     | integer | No       | `10`    | Results per page (<= 100)|

**Example**
```bash
curl "http://localhost:3000/api/v1/schools/listSchools?latitude=23.0225&longitude=72.5714&page=1&limit=5"
```

**200 OK**
```json
{
  "success": true,
  "message": "Schools retrieved successfully.",
  "data": {
    "schools": [
      {
        "id": 1,
        "name": "St. Xavier High School",
        "address": "Mirzapur Road, Ahmedabad, Gujarat",
        "latitude": 23.0225,
        "longitude": 72.5714,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "distance_km": 0
      },
      {
        "id": 3,
        "name": "Kendriya Vidyalaya",
        "address": "Navrangpura, Ahmedabad, Gujarat",
        "latitude": 23.0330,
        "longitude": 72.5580,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "distance_km": 1.72
      }
    ],
    "pagination": {
      "total": 6,
      "page": 1,
      "limit": 5,
      "total_pages": 2,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

## Postman Collection

Import `School_Management_API.postman_collection.json`:

1. Open Postman > **Import** > select the JSON file
2. The `baseUrl` collection variable is pre-set to `http://localhost:3000`
3. Run in order: **Add School** -> **List Schools**

Included scenarios: success, validation error, duplicate, paginated list, missing params.

---

## Deployment on Render

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your-username/school-management-api.git
git push -u origin main
```

### 2. Create a managed MySQL database

| Provider      | Free tier | Notes                        |
|---------------|-----------|------------------------------|
| PlanetScale   | Yes       | Serverless MySQL             |
| Railway       | Yes       | One-click MySQL              |
| Aiven         | Yes       | 5 GB free                    |
| Clever Cloud  | Yes       | 256 MB free MySQL            |

Run `schema.sql` against the remote DB once it is provisioned:
```bash
mysql -h HOST -P PORT -u USER -pPASSWORD DATABASE < schema.sql
```

### 3. Create a Web Service on Render

1. Go to https://render.com > **New > Web Service**
2. Connect your GitHub repository
3. Set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** `Node`
4. Add environment variables:

```
NODE_ENV=production
DB_HOST=<remote-db-host>
DB_PORT=3306
DB_USER=<db-user>
DB_PASSWORD=<db-password>
DB_NAME=school_management
CORS_ORIGIN=https://your-frontend.com
```

5. Click **Deploy**. Your API will be live at `https://your-service.onrender.com`.

---

## Architecture Notes

### Request lifecycle

```
HTTP Request
    |
    v
Router (schoolRoutes.js)         path + method matching
    |
    v
Middleware (validateRequest.js)  Joi schema validation -> 422 on failure
    |
    v
Controller (schoolController.js) parse req, call service, send res
    |
    v
Service (schoolService.js)       business logic, Haversine sort, pagination
    |
    v
Model (School.js)                parameterised SQL queries
    |
    v
Database (mysql2 pool)           connection pool, query execution
```

### Haversine formula

```
a = sin^2(delta_lat / 2) + cos(lat1) * cos(lat2) * sin^2(delta_lon / 2)
d = 2 * R * atan2(sqrt(a), sqrt(1 - a))      R = 6371 km
```

### Why sort in-process rather than SQL?

MySQL's `ST_Distance_Sphere` can compute Haversine distances, but it still requires a full table scan for arbitrary distance sorting — no index can satisfy ORDER BY distance. Sorting in Node is equivalent in query cost and keeps the SQL layer simple. The `idx_lat_lng` index is reserved for future bounding-box pre-filters (`WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?`) that reduce the working set before sorting.
