/**
 * ===================================================================================
 * FILE: client/src/components/MeetingIntelligence.jsx
 * PURPOSE:
 *   Visual dashboard displaying the extracted structured intelligence of a meeting.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Replaces the Streamlit main dashboard layout.
 *   Receives the completed meeting document from MongoDB and renders:
 *     1. Title banner
 *     2. Executive bulleted summary
 *     3. Action items (Task, Owner, Deadline)
 *     4. Key decisions
 *     5. Open questions
 *     6. Full searchable raw transcript in a collapsible accordion
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates clean component breakdown, responsive grid layouts in CSS,
 *   accordion state management, and semantic data presentation.
 * ===================================================================================
 */

// Import React and useState hook
import React, { useState } from 'react';
// Import icons from lucide-react
import {
  FileText,
  CheckSquare,
  Key,
  HelpCircle,
  FileCode,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

/**
 * MeetingIntelligence Component
 * @param {Object} meeting - The meeting document containing title, summary, actionItems, etc.
 */
const MeetingIntelligence = ({ meeting }) => {
  // State for toggling raw transcript visibility
  const [showTranscript, setShowTranscript] = useState(false);
  // State for showing copy feedback
  const [copied, setCopied] = useState(false);

  if (!meeting) return null;

  // Helper to copy raw transcript to clipboard
  const handleCopyTranscript = () => {
    if (meeting.transcript) {
      navigator.clipboard.writeText(meeting.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── Title Banner ── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(180deg, var(--bg-surface-elevated) 0%, var(--bg-surface) 100%)',
          borderLeft: '4px solid var(--accent-purple)',
        }}
      >
        <span className="card-title">📌 Session Title</span>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
          {meeting.title || 'Untitled Analysis'}
        </h1>
        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span className="badge badge-purple">{meeting.language}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)' }}>
            Source: {meeting.sourceUrl}
          </span>
        </div>
      </div>

      {/* ── Top Row: Executive Summary ── */}
      <div className="card">
        <div className="card-title" style={{ color: 'var(--accent-purple-glow)' }}>
          <FileText size={18} />
          Executive Summary
        </div>
        <div className="card-body">
          {meeting.summary || 'No summary available.'}
        </div>
      </div>

      {/* ── 3-Column Grid: Action Items | Decisions | Questions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
        {/* Card 1: Action Items */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title" style={{ color: 'var(--accent-emerald)' }}>
            <CheckSquare size={18} />
            Action Items
          </div>
          <div className="card-body" style={{ fontSize: '0.85rem' }}>
            {meeting.actionItems || 'No action items detected.'}
          </div>
        </div>

        {/* Card 2: Key Decisions */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title" style={{ color: 'var(--accent-cyan)' }}>
            <Key size={18} />
            Key Decisions
          </div>
          <div className="card-body" style={{ fontSize: '0.85rem' }}>
            {meeting.keyDecisions || 'No key decisions detected.'}
          </div>
        </div>

        {/* Card 3: Open Questions */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title" style={{ color: 'var(--accent-amber)' }}>
            <HelpCircle size={18} />
            Open Questions
          </div>
          <div className="card-body" style={{ fontSize: '0.85rem' }}>
            {meeting.openQuestions || 'No open questions detected.'}
          </div>
        </div>
      </div>

      {/* ── Collapsible Raw Transcript Section ── */}
      <div className="card">
        <div
          onClick={() => setShowTranscript(!showTranscript)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div className="card-title" style={{ marginBottom: 0 }}>
            <FileCode size={18} />
            Full Transcript ({meeting.transcript ? `${meeting.transcript.length} characters` : 'Empty'})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.78rem' }}>{showTranscript ? 'Hide' : 'Show'}</span>
            {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Expandable Transcript Body */}
        {showTranscript && (
          <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.6rem' }}>
              <button
                onClick={handleCopyTranscript}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.3rem 0.7rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.82rem',
                lineHeight: 1.8,
                color: 'var(--text-muted)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {meeting.transcript || 'No transcript available.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingIntelligence;
