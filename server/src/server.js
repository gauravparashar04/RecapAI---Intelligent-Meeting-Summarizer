/**
 * ===================================================================================
 * FILE: server/src/server.js
 * PURPOSE:
 *   Main entry point and server bootstrap for the RecapAI Express.js backend.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Acts as the central API Gateway of the entire system:
 *     1. Loads environment variables from .env.
 *     2. Connects to MongoDB via Mongoose.
 *     3. Configures global middleware (CORS, JSON Body Parser).
 *     4. Registers RESTful API routes under /api/meetings.
 *     5. Provides central error handling and health check endpoints.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Clean server architecture showcasing middleware pipelines, environment separation,
 *   graceful startup, and centralized error logging.
 * ===================================================================================
 */

// Load environment variables from .env file into process.env
require('dotenv').config();

// Import Express framework
const express = require('express');
// Import Cross-Origin Resource Sharing (CORS) middleware
const cors = require('cors');
// Import database connection manager
const connectDB = require('./config/db');
// Import meeting route definitions
const meetingRoutes = require('./routes/meetingRoutes');

// Initialize Express application instance
const app = express();

// Determine listening port (defaults to 5000 if not specified in environment)
const PORT = process.env.PORT || 5000;

// ===================================================================================
// DATABASE INITIALIZATION
// ===================================================================================
// Connect to MongoDB
connectDB();

// ===================================================================================
// GLOBAL MIDDLEWARE PIPELINE
// ===================================================================================

// Enable CORS for all incoming origins (permits React frontend on port 5173 to call API)
app.use(
  cors({
    origin: '*', // In production, replace with specific frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Built-in JSON body parser middleware (replaces need for body-parser package)
app.use(express.json({ limit: '50mb' }));

// Built-in URL-encoded parser middleware for standard form submissions
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware for server visibility during development
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// ===================================================================================
// API ROUTES
// ===================================================================================

// Root endpoint: Returns status and architecture metadata
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'RecapAI Express API Gateway',
    status: 'online',
    version: '1.0.0',
    architecture: 'MERN + FastAPI Microservices',
    endpoints: {
      health: '/health',
      meetings: '/api/meetings',
    },
  });
});

// Health check endpoint for system monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount Meeting Resource Routes at /api/meetings
app.use('/api/meetings', meetingRoutes);

// ===================================================================================
// 404 AND ERROR HANDLING MIDDLEWARE
// ===================================================================================

// Catch-all route handler for non-existent routes (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot find requested route: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ===================================================================================
// START SERVER LISTENER
// ===================================================================================
app.listen(PORT, () => {
  console.log('=================================================================');
  console.log(`🚀 RecapAI Express Gateway running on: http://localhost:${PORT}`);
  console.log(`📡 Connected to Python AI Service at: ${process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000'}`);
  console.log('=================================================================');
});
