/**
 * ===================================================================================
 * FILE: server/src/routes/meetingRoutes.js
 * PURPOSE:
 *   Express Router definitions mapping HTTP endpoints to Meeting Controller actions.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Exposes RESTful endpoints consumed by the React frontend:
 *     - POST   /api/meetings/process : Analyze a new YouTube video or local media file.
 *     - GET    /api/meetings         : Retrieve all past meeting summaries.
 *     - GET    /api/meetings/:id     : Retrieve specific meeting details & transcript.
 *     - POST   /api/meetings/:id/chat: Query the meeting via grounded RAG search.
 *     - DELETE /api/meetings/:id     : Delete a meeting record from MongoDB.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Follows REST architectural constraints with resource-oriented URLs, standard
 *   HTTP verbs (POST, GET, DELETE), and modular router decoupling.
 * ===================================================================================
 */

// Import Express framework
const express = require('express');

// Initialize Express Router instance
const router = express.Router();

// Import controller functions
const {
  processMeeting,
  getAllMeetings,
  getMeetingById,
  chatWithMeeting,
  deleteMeeting,
} = require('../controllers/meetingController');

// -----------------------------------------------------------------------------------
// ROUTE DEFINITIONS
// -----------------------------------------------------------------------------------

// POST /api/meetings/process -> Trigger analysis pipeline
router.post('/process', processMeeting);

// GET /api/meetings -> Get all processed meetings (history list)
router.get('/', getAllMeetings);

// GET /api/meetings/:id -> Get complete details of a specific meeting
router.get('/:id', getMeetingById);

// POST /api/meetings/:id/chat -> Ask questions to the meeting assistant
router.post('/:id/chat', chatWithMeeting);

// DELETE /api/meetings/:id -> Delete a meeting from MongoDB
router.delete('/:id', deleteMeeting);

// Export router instance
module.exports = router;
