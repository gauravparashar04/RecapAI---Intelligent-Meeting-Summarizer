/**
 * ===================================================================================
 * FILE: client/src/components/ChatWidget.jsx
 * PURPOSE:
 *   Conversational RAG Chat interface for querying meeting transcripts.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Replaces the Streamlit st.chat_input section.
 *   Enables users to ask questions grounded strictly in the meeting transcript.
 *   When the user submits a question:
 *     1. Calls Express: POST /api/meetings/:id/chat.
 *     2. Express asks Python FastAPI: POST /api/ai/chat.
 *     3. Python executes LangChain RAG with ChromaDB vector search + Mistral AI.
 *     4. Express stores both question & answer in MongoDB chatHistory.
 *     5. React updates local state and automatically scrolls to the newest message.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates chat UI patterns, automatic scrolling via React refs (useRef),
 *   asynchronous state updates, and real-time interaction feedback.
 * ===================================================================================
 */

// Import React and hooks
import React, { useState, useRef, useEffect } from 'react';
// Import icons from lucide-react
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';

/**
 * ChatWidget Component
 * @param {string} meetingId - The ID of the currently selected meeting
 * @param {Array} chatHistory - Array of { sender: 'user'|'assistant', message: string, timestamp: Date }
 * @param {Function} onSendMessage - Handler to submit a new question
 * @param {boolean} isThinking - Flag indicating that the RAG model is generating an answer
 */
const ChatWidget = ({
  meetingId,
  chatHistory = [],
  onSendMessage,
  isThinking = false,
}) => {
  // Local state for the input field text
  const [question, setQuestion] = useState('');
  // Ref pointing to the bottom of the message container for auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom whenever chatHistory or isThinking changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isThinking]);

  // Handle message submission
  const handleSend = (e) => {
    e.preventDefault();
    if (!question.trim() || isThinking) return;

    // Call parent handler
    onSendMessage(question.trim());
    // Clear input field
    setQuestion('');
  };

  return (
    <div className="card" style={{ maxWidth: '1000px', margin: '2rem auto 0 auto' }}>
      {/* ── Chat Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquare size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Chat with Your Meeting (RAG)
          </h3>
        </div>
        <span className="badge badge-cyan">Mistral Grounded</span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
        Ask any specific question about topics, deadlines, or decisions discussed in this meeting.
        Answers are verified against the transcript embeddings stored in ChromaDB.
      </p>

      {/* ── Scrollable Chat Messages Container ── */}
      <div
        className="chat-container"
        style={{
          minHeight: '220px',
          maxHeight: '380px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {chatHistory.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
              color: 'var(--text-dimmed)',
              textAlign: 'center',
            }}
          >
            <Bot size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem' }}>No questions asked yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Try: <em>"What were the main action items?"</em> or <em>"Who is responsible for the deadline?"</em>
            </p>
          </div>
        ) : (
          chatHistory.map((msg, index) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '0.5rem',
                }}
              >
                {/* Sender Label */}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: isUser ? 'var(--accent-purple-glow)' : 'var(--accent-cyan)',
                    marginBottom: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  {isUser ? <User size={12} /> : <Bot size={12} />}
                  {isUser ? 'You' : 'RecapAI Assistant'}
                </span>

                {/* Message Bubble */}
                <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', padding: '0.5rem 0' }}>
            <Loader2 size={16} className="spin" />
            <span>Consulting ChromaDB transcript context & Mistral AI...</span>
          </div>
        )}

        {/* Ref for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Box Form ── */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Ask a question about this meeting..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isThinking || !meetingId}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isThinking || !question.trim() || !meetingId}
          style={{ padding: '0.75rem 1.4rem' }}
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
