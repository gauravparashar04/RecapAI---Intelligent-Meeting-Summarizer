/**
 * ===================================================================================
 * FILE: client/src/App.jsx
 * PURPOSE:
 *   Root Application Component orchestrating state, views, and workflows in RecapAI.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Acts as the central State Container and Layout Coordinator of the React client:
 *     1. Fetches historical meetings from MongoDB via Express on initial mount.
 *     2. Manages active meeting selection, loading spinners, and error alerts.
 *     3. Switches between the "Media Ingestion Form" and the "Meeting Intelligence Dashboard".
 *     4. Feeds real-time chat interactions into the RAG Chat Widget.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates clean component composition, unidirectional data flow, async error
 *   handling, and production-ready state lifecycle management.
 * ===================================================================================
 */

// Import React and hooks
import React, { useState, useEffect } from 'react';
// Import child components
import Sidebar from './components/Sidebar';
import MediaInput from './components/MediaInput';
import MeetingIntelligence from './components/MeetingIntelligence';
import ChatWidget from './components/ChatWidget';
// Import API service functions
import {
  getAllMeetings,
  getMeetingById,
  processMeeting,
  chatWithMeeting,
  deleteMeeting,
} from './services/api';
// Import Lucide icons
import { AlertTriangle, Sparkles, Video } from 'lucide-react';

function App() {
  // List of all meetings stored in MongoDB (for the sidebar)
  const [meetings, setMeetings] = useState([]);
  // Currently active meeting being viewed / chatted with
  const [activeMeeting, setActiveMeeting] = useState(null);
  // Loading state during video audio processing & transcription
  const [isProcessing, setIsProcessing] = useState(false);
  // Loading state during RAG question answering
  const [isThinking, setIsThinking] = useState(false);
  // Error banner message
  const [errorMessage, setErrorMessage] = useState(null);

  // ---------------------------------------------------------------------------------
  // 1. INITIAL MOUNT: Fetch historical meetings from MongoDB
  // ---------------------------------------------------------------------------------
  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await getAllMeetings();
      setMeetings(data || []);
      // If meetings exist and none selected, select the most recent one
      if (data && data.length > 0 && !activeMeeting) {
        loadMeetingDetails(data[0]._id);
      }
    } catch (err) {
      console.warn('Could not fetch past meetings (Express server or MongoDB might be starting):', err.message);
    }
  };

  // ---------------------------------------------------------------------------------
  // 2. LOAD SPECIFIC MEETING DETAILS (Transcript & Chat History)
  // ---------------------------------------------------------------------------------
  const loadMeetingDetails = async (id) => {
    setErrorMessage(null);
    try {
      const fullMeeting = await getMeetingById(id);
      setActiveMeeting(fullMeeting);
    } catch (err) {
      console.error('Failed to load meeting details:', err.message);
      setErrorMessage('Failed to load meeting details. Please try again.');
    }
  };

  // ---------------------------------------------------------------------------------
  // 3. PROCESS NEW MEDIA (Trigger Python Pipeline via Express)
  // ---------------------------------------------------------------------------------
  const handleProcessMedia = async (source, language) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      console.log(`Starting processing for source: ${source}`);
      const newMeeting = await processMeeting(source, language);
      
      // Update local state with the completed meeting
      setActiveMeeting(newMeeting);
      // Prepend to meetings list
      setMeetings((prev) => [newMeeting, ...prev]);
    } catch (err) {
      console.error('Processing failed:', err);
      const detail = err.response?.data?.details || err.response?.data?.error || err.message;
      setErrorMessage(`Processing error: ${detail}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ---------------------------------------------------------------------------------
  // 4. SEND QUESTION TO RAG CHAT
  // ---------------------------------------------------------------------------------
  const handleSendMessage = async (question) => {
    if (!activeMeeting?._id) return;

    setIsThinking(true);
    setErrorMessage(null);

    // Optimistically append user message to local state
    const optimisticMessage = {
      sender: 'user',
      message: question,
      timestamp: new Date(),
    };
    setActiveMeeting((prev) => ({
      ...prev,
      chatHistory: [...(prev.chatHistory || []), optimisticMessage],
    }));

    try {
      const res = await chatWithMeeting(activeMeeting._id, question);
      
      // Update with server's confirmed chat history
      setActiveMeeting((prev) => ({
        ...prev,
        chatHistory: res.chatHistory,
      }));
    } catch (err) {
      console.error('RAG Chat failed:', err);
      const detail = err.response?.data?.details || err.message;
      setErrorMessage(`Chat error: ${detail}`);
    } finally {
      setIsThinking(false);
    }
  };

  // ---------------------------------------------------------------------------------
  // 5. DELETE MEETING
  // ---------------------------------------------------------------------------------
  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      await deleteMeeting(id);
      // Remove from sidebar list
      setMeetings((prev) => prev.filter((m) => m._id !== id));
      // If deleted meeting was active, reset active meeting
      if (activeMeeting?._id === id) {
        setActiveMeeting(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setErrorMessage('Failed to delete meeting.');
    }
  };

  // ---------------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------------
  return (
    <div className="app-container">
      {/* ── Left Sidebar (History & Navigation) ── */}
      <Sidebar
        meetings={meetings}
        activeMeeting={activeMeeting}
        onSelectMeeting={(id) => loadMeetingDetails(id)}
        onNewMeeting={() => {
          setActiveMeeting(null);
          setErrorMessage(null);
        }}
        onDeleteMeeting={handleDeleteMeeting}
      />

      {/* ── Main Viewport ── */}
      <main className="main-viewport">
        {/* Top Header */}
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
              AI Video Assistant <span style={{ color: 'var(--accent-purple-glow)' }}>with RAG</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Full-Stack MERN Architecture powered by OpenAI Whisper, Mistral AI, and ChromaDB
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <span className="badge badge-purple">React 18</span>
            <span className="badge badge-cyan">Express.js</span>
            <span className="badge badge-green">MongoDB</span>
            <span className="badge badge-amber">FastAPI</span>
          </div>
        </header>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={20} color="var(--accent-rose)" />
            <div style={{ fontSize: '0.88rem' }}>{errorMessage}</div>
          </div>
        )}

        {/* If no meeting is active, or user clicked "New Analysis", show MediaInput */}
        {!activeMeeting ? (
          <div>
            <MediaInput onSubmit={handleProcessMedia} isLoading={isProcessing} />

            {/* Empty state informative graphic */}
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                }}
              >
                <Video size={28} color="var(--accent-purple)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Ready to Analyze Your First Video
              </h3>
              <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Paste a YouTube URL or local file path above, select language, and click "Analyze Recording".
                Previous sessions are saved in the sidebar.
              </p>
            </div>
          </div>
        ) : (
          /* Active Meeting Dashboard */
          <div>
            {/* Structured Insights (Summary, Actions, Decisions, Questions, Transcript) */}
            <MeetingIntelligence meeting={activeMeeting} />

            {/* Conversational RAG Chat Box */}
            <ChatWidget
              meetingId={activeMeeting._id}
              chatHistory={activeMeeting.chatHistory || []}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
