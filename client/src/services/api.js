/**
 * ===================================================================================
 * FILE: client/src/services/api.js
 * PURPOSE:
 *   Centralized Axios HTTP client for communicating with the Express.js Backend API.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Encapsulates all RESTful API communication between the React frontend and the
 *   Express API Gateway. Rather than scattering axios calls across multiple React
 *   components, all network requests are centralized here with consistent base URLs,
 *   request/response logging, and error handling.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates clean architectural separation between UI components and the data
 *   access layer (API service pattern), making code modular, testable, and maintainable.
 * ===================================================================================
 */

// Import Axios library
import axios from 'axios';

// Define the base URL for the Express API Gateway
// In development, Express runs on port 5000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a pre-configured Axios instance with defaults
const apiClient = axios.create({
  // Base URL prepended to all relative request endpoints
  baseURL: API_BASE_URL,
  // Standard JSON content header
  headers: {
    'Content-Type': 'application/json',
  },
  // Generous timeout (15 minutes) for long audio processing tasks
  timeout: 900000,
});

/**
 * 1. PROCESS A NEW VIDEO OR AUDIO RECORDING
 * @param {string} source - YouTube URL or local file path
 * @param {string} language - 'english' or 'hinglish'
 * @returns {Promise<Object>} The analyzed meeting object saved in MongoDB
 */
export const processMeeting = async (source, language = 'english') => {
  console.log(`[API SERVICE] Requesting video processing: "${source}" (${language})`);
  // Send POST request to Express /api/meetings/process
  const response = await apiClient.post('/meetings/process', { source, language });
  // Return the meeting data payload
  return response.data.data;
};

/**
 * 2. FETCH ALL HISTORICAL MEETINGS
 * @returns {Promise<Array>} List of all past meetings from MongoDB
 */
export const getAllMeetings = async () => {
  console.log('[API SERVICE] Fetching all meetings history...');
  // Send GET request to Express /api/meetings
  const response = await apiClient.get('/meetings');
  // Return array of meeting objects
  return response.data.data;
};

/**
 * 3. GET A SPECIFIC MEETING BY ID
 * @param {string} id - The MongoDB ObjectID of the meeting
 * @returns {Promise<Object>} Full meeting details including transcript & chat history
 */
export const getMeetingById = async (id) => {
  console.log(`[API SERVICE] Fetching meeting details for ID: ${id}`);
  // Send GET request to Express /api/meetings/:id
  const response = await apiClient.get(`/meetings/${id}`);
  // Return full meeting document
  return response.data.data;
};

/**
 * 4. ASK A QUESTION VIA RAG CHAT
 * @param {string} id - The MongoDB ObjectID of the meeting
 * @param {string} question - Natural language question about the meeting
 * @returns {Promise<Object>} Grounded answer and updated chat history
 */
export const chatWithMeeting = async (id, question) => {
  console.log(`[API SERVICE] Querying RAG for meeting ${id}: "${question}"`);
  // Send POST request to Express /api/meetings/:id/chat
  const response = await apiClient.post(`/meetings/${id}/chat`, { question });
  // Return answer string and updated chat history array
  return response.data;
};

/**
 * 5. DELETE A MEETING
 * @param {string} id - The MongoDB ObjectID of the meeting to delete
 * @returns {Promise<Object>} Deletion confirmation response
 */
export const deleteMeeting = async (id) => {
  console.log(`[API SERVICE] Deleting meeting ID: ${id}`);
  // Send DELETE request to Express /api/meetings/:id
  const response = await apiClient.delete(`/meetings/${id}`);
  return response.data;
};

// Export the default configured axios client for custom requests
export default apiClient;
