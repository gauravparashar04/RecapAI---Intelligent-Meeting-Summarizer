/**
 * ===================================================================================
 * FILE: client/src/components/MediaInput.jsx
 * PURPOSE:
 *   Input form component for ingesting YouTube URLs or local media file paths.
 * 
 * ROLE IN MERN ARCHITECTURE:
 *   Replaces the Streamlit sidebar input form.
 *   Captures user inputs (URL/path and language), performs client-side validation,
 *   and triggers the analysis workflow via Express API.
 * 
 * INTERVIEW HIGHLIGHT:
 *   Demonstrates controlled form handling, user feedback during asynchronous loading,
 *   and clean state binding in React.
 * ===================================================================================
 */

// Import React and hooks
import React, { useState } from 'react';
// Import icons from lucide-react
import { Sparkles, Video, FileVideo, Globe, Loader2 } from 'lucide-react';

/**
 * MediaInput Component
 * @param {Function} onSubmit - Handler triggered when user submits media for processing
 * @param {boolean} isLoading - Loading state during processing
 */
const MediaInput = ({ onSubmit, isLoading = false }) => {
  // Local state for the media source string (YouTube URL or local path)
  const [source, setSource] = useState('');
  // Local state for the spoken language mode ('english' or 'hinglish')
  const [language, setLanguage] = useState('english');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate that the input is not empty
    if (!source.trim()) {
      alert('Please enter a YouTube video URL or a valid local file path.');
      return;
    }
    // Call parent handler
    onSubmit(source.trim(), language);
  };

  return (
    <div className="card" style={{ maxWidth: '850px', margin: '0 auto 2rem auto' }}>
      {/* ── Component Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
        <Sparkles size={20} color="var(--accent-purple-glow)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Ingest & Analyze Meeting Video
        </h3>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Provide a <strong>YouTube URL</strong> or a local media file path (e.g.,{' '}
        <code>C:/recordings/meeting.mp4</code>). The AI pipeline will normalize audio, transcribe speech,
        synthesize an executive summary, and index the transcript for conversational RAG search.
      </p>

      {/* ── Form Container ── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Row 1: Source Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
            MEDIA SOURCE (YOUTUBE URL OR FILE PATH)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="https://www.youtube.com/watch?v=... or /path/to/meeting.mp4"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={isLoading}
              style={{ paddingLeft: '2.5rem' }}
            />
            <Video
              size={18}
              color="var(--text-dimmed)"
              style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Row 2: Language Selector & Submit Button */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Language Selector */}
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              SPOKEN LANGUAGE
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
              className="input-field"
              style={{ cursor: 'pointer' }}
            >
              <option value="english">English (OpenAI Whisper Local)</option>
              <option value="hinglish">Hinglish / Hindi (Sarvam AI Translation)</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading || !source.trim()}
            style={{ padding: '0.75rem 2rem', minWidth: '180px' }}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing Audio...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Recording
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Feature Highlights ── */}
      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.8rem',
          flexWrap: 'wrap',
        }}
      >
        <span className="badge badge-purple">OpenAI Whisper STT</span>
        <span className="badge badge-cyan">Mistral AI LCEL</span>
        <span className="badge badge-green">ChromaDB Vector Store</span>
        <span className="badge badge-amber">Context-Grounded RAG</span>
      </div>
    </div>
  );
};

export default MediaInput;
