/**
 * ===================================================================================
 * FILE: client/src/components/Sidebar.jsx
 * PURPOSE:
 *   Left sidebar component displaying historical meetings from MongoDB.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Provides instant navigation between past processed meetings.
 *   Unlike Streamlit (which only keeps the active meeting in session memory),
 *   this component queries MongoDB via Express to show all previously analyzed
 *   videos, their creation dates, and statuses. Users can switch between meetings
 *   instantaneously without re-running compute-heavy Whisper/Mistral pipelines.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates state-driven UI rendering, dynamic list management, and optimistic
 *   deletion updates in React.
 * ===================================================================================
 */

// Import React library
import React from 'react';
// Import icons from lucide-react for modern visual cues
import { Video, PlusCircle, Trash2, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Sidebar Component
 * @param {Array} meetings - List of meetings fetched from MongoDB
 * @param {Object} activeMeeting - Currently selected meeting
 * @param {Function} onSelectMeeting - Handler when a user clicks a meeting
 * @param {Function} onNewMeeting - Handler to reset selection for analyzing a new video
 * @param {Function} onDeleteMeeting - Handler to delete a meeting
 */
const Sidebar = ({
  meetings = [],
  activeMeeting,
  onSelectMeeting,
  onNewMeeting,
  onDeleteMeeting,
}) => {
  return (
    <aside className="sidebar">
      {/* ── App Header / Branding ── */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Video size={18} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Recap<span style={{ color: 'var(--accent-purple-glow)' }}>AI</span>
          </h2>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          MERN + RAG Meeting Intelligence
        </p>

        {/* New Meeting Button */}
        <button
          onClick={onNewMeeting}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1.2rem', padding: '0.65rem' }}
        >
          <PlusCircle size={16} />
          New Analysis
        </button>
      </div>

      {/* ── Saved Meetings List Header ── */}
      <div
        style={{
          padding: '1rem 1.5rem 0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontWeight: 700,
          }}
        >
          Saved Meetings ({meetings.length})
        </span>
      </div>

      {/* ── Scrollable Meetings History List ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1rem' }}>
        {meetings.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--text-dimmed)',
              fontSize: '0.8rem',
            }}
          >
            No analyzed meetings found in MongoDB.
          </div>
        ) : (
          meetings.map((meeting) => {
            // Determine if this item is currently active/selected
            const isSelected = activeMeeting?._id === meeting._id;

            return (
              <div
                key={meeting._id}
                onClick={() => onSelectMeeting(meeting._id)}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isSelected
                    ? '1px solid var(--accent-purple)'
                    : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Meeting Title */}
                  <h4
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--accent-purple-glow)' : 'var(--text-main)',
                      marginBottom: '0.3rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px',
                    }}
                  >
                    {meeting.title || 'Untitled Meeting'}
                  </h4>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering onSelectMeeting
                      onDeleteMeeting(meeting._id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dimmed)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                    title="Delete meeting from database"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Meeting Metadata (Language badge & Date) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <span
                    className={`badge ${
                      meeting.language === 'hinglish' ? 'badge-amber' : 'badge-purple'
                    }`}
                    style={{ fontSize: '0.62rem', padding: '0.15rem 0.4rem' }}
                  >
                    {meeting.language}
                  </span>

                  {/* Status Indicator */}
                  {meeting.status === 'COMPLETED' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-emerald)', fontSize: '0.7rem' }}>
                      <CheckCircle size={11} /> Done
                    </span>
                  )}
                  {meeting.status === 'PROCESSING' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                      <Loader2 size={11} className="spin" /> Processing
                    </span>
                  )}
                  {meeting.status === 'FAILED' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--accent-rose)', fontSize: '0.7rem' }}>
                      <AlertCircle size={11} /> Failed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          color: 'var(--text-dimmed)',
          textAlign: 'center',
        }}
      >
        MongoDB Persistent Storage
      </div>
    </aside>
  );
};

export default Sidebar;
