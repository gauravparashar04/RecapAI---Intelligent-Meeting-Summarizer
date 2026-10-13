/**
 * ===================================================================================
 * FILE: server/src/config/db.js
 * PURPOSE:
 *   Establishes and manages the connection to MongoDB using Mongoose.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   MongoDB serves as the central persistence layer in our MERN stack.
 *   Unlike Streamlit (which loses analysis once the session ends), MongoDB stores:
 *     - Meeting metadata (Title, Source URL, Audio Language, Timestamps)
 *     - Extracted intelligence (Summary, Action items, Key decisions, Open questions)
 *     - Raw full transcript
 *     - Conversational RAG chat history for every meeting
 * 
 * INTERVIEW HIGHLIGHT:
 *   Using Mongoose provides schema validation, type casting, connection pooling,
 *   and automatic reconnection logic in enterprise environments.
 * ===================================================================================
 */

// Import Mongoose ODM (Object Data Modeling) library for MongoDB
const mongoose = require('mongoose');

/**
 * Connects to the MongoDB instance using connection URI defined in environment variables.
 * Includes graceful connection error handling and status logging.
 */
const connectDB = async () => {
  try {
    // Read the MongoDB URI from environment variables or fallback to local default
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/recapai';

    // Log attempt for system observability
    console.log(`[DATABASE] Connecting to MongoDB at: ${connUri}...`);

    // Establish the connection with recommended options
    const conn = await mongoose.connect(connUri, {
      // Automatically build indexes defined in schemas
      autoIndex: true,
      // Maximum time in ms Mongoose will wait before timing out a query
      serverSelectionTimeoutMS: 5000,
    });

    // Successfully connected; log host name
    console.log(`[DATABASE] MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    // Log failure message with error details
    console.error(`[DATABASE ERROR] MongoDB Connection Failed: ${error.message}`);
    console.warn(`[DATABASE WARNING] The server will still run, but operations requiring MongoDB will fail until MongoDB is active.`);
  }
};

// Export the connectDB function to be called in server.js on startup
module.exports = connectDB;
