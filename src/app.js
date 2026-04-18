/**
 * app.js — Express application factory
 *
 * Keeps application setup separate from the HTTP server so the app
 * can be imported cleanly in tests without binding a port.
 */

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const schoolRoutes = require('./routes/schoolRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Security & CORS ──────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // Reject oversized payloads
app.use(express.urlencoded({ extended: true }));

// ── Request logging ──────────────────────────────────────────────────────────
// Use concise 'dev' format in development, structured 'combined' in production
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check — no auth, no rate limiting ─────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API routes ───────────────────────────────────────────────────────────────
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/schools`, schoolRoutes);

// ── Root welcome ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Management API',
    version: apiVersion,
    docs: `GET /api/${apiVersion}/schools/listSchools?latitude=23.0225&longitude=72.5714`,
  });
});

// ── Error middleware (must be last) ──────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
