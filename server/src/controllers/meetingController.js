/**
 * ===================================================================================
 * FILE: server/src/controllers/meetingController.js
 * PURPOSE:
 *   Controller logic for Meeting operations and AI microservice orchestration.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Acts as the brain of the Express API Gateway:
 *     1. Receives requests from the React client.
 *     2. Persists metadata in MongoDB.
 *     3. Calls the Python FastAPI microservice via Axios to perform heavy AI work.
 *     4. Updates MongoDB with extracted summaries and chat logs.
 *     5. Returns clean JSON responses back to the React UI.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates API gateway design, asynchronous inter-service HTTP communication,
 *   graceful error handling, and separation of business logic from route definitions.
 * ===================================================================================
 */

// Import Axios for making HTTP requests to the Python FastAPI microservice
const axios = require('axios');
// Import the Mongoose Meeting model
const Meeting = require('../models/Meeting');

// Read the Python AI microservice base URL from environment or default to local port 8000
const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://127.0.0.1:8000';

/**
 * 1. PROCESS NEW MEETING
 * Route: POST /api/meetings/process
 * Body: { source: string, language: string }
 * Description:
 *   Creates a pending meeting record in MongoDB, delegates transcription and
 *   LLM analytics to the Python FastAPI microservice, and stores the results.
 */
exports.processMeeting = async (req, res) => {
  try {
    const { source, language = 'english' } = req.body;

    // Validate that a media source was provided
    if (!source || !source.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid YouTube URL or local file path.',
      });
    }

    console.log(`[EXPRESS CONTROLLER] Initiating processing for: ${source}`);

    // Step 1: Create initial placeholder document in MongoDB with status 'PROCESSING'
    const meeting = new Meeting({
      sourceUrl: source.trim(),
      language: language.toLowerCase(),
      status: 'PROCESSING',
      title: 'Analyzing video recording...',
    });
    await meeting.save();

    console.log(`[EXPRESS CONTROLLER] Created MongoDB Meeting ID: ${meeting._id}`);

    // Step 2: Call the Python FastAPI microservice
    // Extended timeout (15 minutes = 900,000ms) to accommodate large audio files
    try {
      console.log(`[EXPRESS CONTROLLER] Calling Python AI Service at ${PYTHON_AI_URL}/api/ai/process...`);
      
      const aiResponse = await axios.post(
        `${PYTHON_AI_URL}/api/ai/process`,
        {
          meeting_id: meeting._id.toString(),
          source: source.trim(),
          language: language.toLowerCase(),
        },
        { timeout: 900000 }
      );

      const aiData = aiResponse.data;
      console.log(`[EXPRESS CONTROLLER] Python AI returned analysis successfully!`);

      // Step 3: Update the MongoDB meeting record with extracted AI intelligence
      meeting.title = aiData.title || 'Meeting Summary';
      meeting.summary = aiData.summary || '';
      meeting.actionItems = aiData.action_items || '';
      meeting.keyDecisions = aiData.key_decisions || '';
      meeting.openQuestions = aiData.open_questions || '';
      meeting.transcript = aiData.transcript || '';
      meeting.status = 'COMPLETED';
      meeting.errorMessage = null;

      // Save the updated record to MongoDB
      await meeting.save();

      // Return the completed meeting object to the React client
      return res.status(200).json({
        success: true,
        data: meeting,
      });

    } catch (aiError) {
      // If the Python service fails (e.g. invalid URL or transcription error)
      console.error(`[EXPRESS CONTROLLER ERROR] Python AI microservice failed:`, aiError.message);

      // Update MongoDB status to 'FAILED'
      meeting.status = 'FAILED';
      meeting.errorMessage = aiError.response?.data?.detail || aiError.message;
      await meeting.save();

      return res.status(500).json({
        success: false,
        error: 'AI analysis failed during processing.',
        details: meeting.errorMessage,
        meetingId: meeting._id,
      });
    }

  } catch (error) {
    console.error(`[EXPRESS CONTROLLER ERROR] Server exception:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing meeting.',
      details: error.message,
    });
  }
};

/**
 * 2. GET ALL MEETINGS
 * Route: GET /api/meetings
 * Description: Fetches list of all saved meetings sorted by newest first (for React history sidebar).
 */
exports.getAllMeetings = async (req, res) => {
  try {
    // Query MongoDB for all meetings, selecting essential fields for sidebar list
    const meetings = await Meeting.find({})
      .select('title sourceUrl language status createdAt updatedAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    console.error(`[EXPRESS CONTROLLER ERROR] Failed fetching meetings:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve meetings from database.',
    });
  }
};

/**
 * 3. GET SINGLE MEETING BY ID
 * Route: GET /api/meetings/:id
 * Description: Fetches full meeting details including summary, transcript, and chat history.
 */
exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the meeting document in MongoDB
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: `Meeting with ID '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    console.error(`[EXPRESS CONTROLLER ERROR] Failed fetching meeting ${req.params.id}:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Invalid meeting ID or database error.',
    });
  }
};

/**
 * 4. CHAT WITH MEETING VIA RAG
 * Route: POST /api/meetings/:id/chat
 * Body: { question: string }
 * Description:
 *   Appends user question to chat history, delegates vector search & grounded
 *   answer generation to Python FastAPI, saves answer in MongoDB, and returns it.
 */
exports.chatWithMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    // Validate query parameter
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question text is required.',
      });
    }

    // Locate target meeting document
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found.',
      });
    }

    console.log(`[EXPRESS CONTROLLER] RAG chat request for meeting ${id}: "${question}"`);

    // Record user query in MongoDB chat history
    meeting.chatHistory.push({
      sender: 'user',
      message: question.trim(),
      timestamp: new Date(),
    });

    try {
      // Query the Python FastAPI microservice's RAG endpoint
      const aiResponse = await axios.post(`${PYTHON_AI_URL}/api/ai/chat`, {
        meeting_id: id,
        question: question.trim(),
      });

      const answer = aiResponse.data.answer;

      // Append assistant grounded response to chat history
      meeting.chatHistory.push({
        sender: 'assistant',
        message: answer,
        timestamp: new Date(),
      });

      // Save updated conversation to MongoDB
      await meeting.save();

      return res.status(200).json({
        success: true,
        answer: answer,
        chatHistory: meeting.chatHistory,
      });

    } catch (aiError) {
      console.error(`[EXPRESS CONTROLLER ERROR] Python RAG query failed:`, aiError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve answer from AI service.',
        details: aiError.response?.data?.detail || aiError.message,
      });
    }

  } catch (error) {
    console.error(`[EXPRESS CONTROLLER ERROR] Chat controller error:`, error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing chat question.',
    });
  }
};

/**
 * 5. DELETE MEETING
 * Route: DELETE /api/meetings/:id
 * Description: Removes meeting record from MongoDB.
 */
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByIdAndDelete(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully.',
      id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete meeting.',
    });
  }
};
