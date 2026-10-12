# 🎬 RecapAI — AI Video Assistant with RAG

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.35%2B-FF4B4B?logo=streamlit&logoColor=white)](https://streamlit.io/)
[![LangChain](https://img.shields.io/badge/LangChain-LCEL-green?logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Mistral AI](https://img.shields.io/badge/LLM-Mistral--Small-FD6F00?logo=mistralai&logoColor=white)](https://mistral.ai/)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-purple)](https://www.trychroma.com/)
[![OpenAI Whisper](https://img.shields.io/badge/STT-Whisper%20Local-412991?logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

**An intelligent meeting intelligence platform that turns long YouTube recordings and local media into structured summaries, actionable insights, and a searchable, transcript-grounded RAG knowledge base.**

[Key Features](#-key-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Project Structure](#-project-structure) • [Roadmap](#-roadmap)

</div>

---

## 📌 Overview

**RecapAI (AI Video Assistant with RAG)** solves the problem of information overload from lengthy meetings, lectures, and conference videos. Instead of scrubbing through hours of recordings:

1. **Ingest**: Provide a **YouTube URL** or a **local audio/video file** (`.mp4`, `.wav`, `.mp3`, etc.).
2. **Normalize & Chunk**: Audio is extracted, converted to mono 16 kHz WAV via FFmpeg & `pydub`, and segmented into manageable chunks.
3. **Transcribe Multilingually**:
   - **English audio**: Transcribed locally using **OpenAI Whisper** (runs offline on CPU/GPU).
   - **Hinglish audio**: Transcribed & translated into English using **Sarvam AI (`saaras:v2.5`)**.
4. **Extract Structured Intelligence**: Uses **Mistral AI** via LangChain LCEL to automatically produce:
   - 📌 **Session Title**: Context-aware meeting header.
   - 📋 **Executive Summary**: Map-reduce bulleted summary covering all segments.
   - ✅ **Action Items**: Explicit table of tasks, owners, and deadlines.
   - 🔑 **Key Decisions**: Crucial conclusions agreed upon during the discussion.
   - ❓ **Open Questions**: Unresolved topics needing follow-up.
5. **Chat with Your Meeting (RAG)**: Indexes transcript chunks in **ChromaDB** with Hugging Face embeddings (`all-MiniLM-L6-v2`) and enables conversational Q&A backed by **Mistral AI**, strictly grounded in the meeting context to eliminate hallucinations.

---

## ✨ Key Features

- **🌐 Versatile Input Handling**: Supports direct YouTube video ingestion via `yt-dlp` or local audio/video file paths.
- **⚡ Robust Audio Processing**: Automated format normalization (16 kHz, single channel WAV) and 10-minute segment chunking for handling long recordings smoothly.
- **🗣️ Multilingual Speech-to-Text**:
  - Local, zero-cloud Whisper inference for English.
  - Sarvam AI speech-to-text translation for mixed Indic/Hinglish speech with intelligent 25s sub-chunking.
- **🧠 Map-and-Combine LLM Summarization**: Overcomes context window bottlenecks by summarizing individual sections and combining them into an executive overview.
- **🎯 Structured Extraction**:
  - **Action Items**: Task description, responsible owner, and deadline.
  - **Decisions**: Key agreements and resolutions.
  - **Open Inquiries**: Unanswered questions and agenda items for future syncs.
- **💬 Transcript-Grounded RAG Engine**: Semantic vector search with LangChain LCEL, ChromaDB, and Mistral AI. If something was not said in the meeting, the model explicitly admits it rather than hallucinating.
- **🎨 Modern Dark UI / Dashboard**: Streamlit interface featuring a cyberpunk-inspired dark palette, real-time pipeline status trackers, card layouts, and responsive chat bubbles.
- **💻 CLI & Web Interfaces**: Run seamlessly in the browser (`app.py`) or directly in terminal environments (`main.py`).

---

## 🏗️ Architecture

```
                    YouTube URL or Local Media File
                                  │
                                  ▼
                    Audio Extraction & Conversion
                      (yt-dlp, pydub, FFmpeg)
                                  │
                                  ▼
                         Audio Preprocessing
                     (16 kHz Mono WAV Chunking)
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
    [ English ]                                       [ Hinglish ]
         │                                                 │
  OpenAI Whisper                                       Sarvam AI
  (Local Inference)                            (Speech-to-Text Translation)
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  │
                                  ▼
                           Full Transcript
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         ▼                                                 ▼
   LLM Intelligence                                 Vector Indexing
 (Mistral AI via LCEL)                         (ChromaDB + all-MiniLM-L6-v2)
         │                                                 │
 ├─ Automated Title                                        ▼
 ├─ Executive Summary (Map-Reduce)                  RAG Retriever (k=4)
 ├─ Action Items (Task, Owner, Deadline)                   │
 ├─ Key Decisions                                          ▼
 └─ Unresolved Questions                             Mistral AI LLM
                                                           │
                                                           ▼
                                                Interactive Meeting Chat
```

---

## 🛠️ Tech Stack

| Category | Tools & Libraries |
| :--- | :--- |
| **Interface** | [Streamlit](https://streamlit.io/), [Streamlit Extras](https://github.com/arnaudmiribel/streamlit-extras) |
| **LLM & Orchestration** | [LangChain](https://www.langchain.com/) (LCEL), [Mistral AI](https://mistral.ai/) (`mistral-small-latest`) |
| **Speech-to-Text (STT)** | [OpenAI Whisper](https://github.com/openai/whisper) (Local), [Sarvam AI](https://www.sarvam.ai/) (`saaras:v2.5`) |
| **Embeddings & Vector Store** | [ChromaDB](https://www.trychroma.com/), [Hugging Face sentence-transformers](https://huggingface.co/sentence-transformers) (`all-MiniLM-L6-v2`) |
| **Audio & Video Processing** | [yt-dlp](https://github.com/yt-dlp/yt-dlp), [pydub](https://github.com/jiaaro/pydub), [FFmpeg](https://ffmpeg.org/) |
| **Runtime & Core** | Python 3.10+, PyTorch, python-dotenv, Requests, NumPy |

---

## 📁 Project Structure

```text
AI Video Assistant with RAG/
├── core/
│   ├── extractor.py        # Structured extraction (action items, decisions, questions)
│   ├── rag_engine.py       # LangChain LCEL RAG chain and retrieval-augmented Q&A
│   ├── summarize.py        # Map-reduce hierarchical summarizer & title generation
│   ├── transcriber.py      # OpenAI Whisper (local) and Sarvam AI (Hinglish) transcription
│   └── vector_store.py     # ChromaDB vector index builder and retriever configuration
├── utils/
│   └── audio_processor.py  # Media downloading, format conversion (WAV 16kHz), and chunking
├── downloades/             # Cache directory for downloaded media files and audio chunks
├── vector_db/              # Persistent ChromaDB vector database directory
├── .env.example            # Environment variables template
├── .env                    # Local environment variables (API keys)
├── app.py                  # Streamlit web application frontend
├── main.py                 # Command-line interface (CLI) entry point
├── PROJECT_REPORT.md       # Comprehensive project report & interview guide
├── Requirements.txt        # Python dependency manifest
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

1. **Python 3.10+**: Ensure Python is installed.
2. **FFmpeg**: Required by `pydub` and `yt-dlp` for media extraction and audio conversion.
   - **Windows (via winget or Chocolatey)**:
     ```powershell
     winget install "FFmpeg (Essentials Build)"
     # or
     choco install ffmpeg
     ```
   - **macOS (via Homebrew)**:
     ```bash
     brew install ffmpeg
     ```
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install ffmpeg
     ```
   Verify installation with:
   ```bash
   ffmpeg -version
   ```

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-video-assistant-rag.git
cd "ai-video-assistant-rag"
```

### 2. Create and Activate a Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r Requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Open `.env` and configure your API credentials:

```ini
# Mistral AI API Key (required for summarization, extraction, and RAG chat)
# Obtain from: https://console.mistral.ai/
MISTRAL_API_KEY=your_mistral_api_key_here

# Whisper model size: tiny, base, small, medium, large (default: small)
WHISPER_MODEL=small

# Sarvam AI API Key (required only if processing Hinglish audio)
# Obtain from: https://www.sarvam.ai/
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_STT_MODEL=saaras:v2.5
```

---

## 💻 Usage

### Option 1: Streamlit Web Application (Recommended)

Launch the interactive web dashboard:

```bash
streamlit run app.py
```

1. Open your browser at `http://localhost:8501`.
2. In the sidebar, paste a **YouTube URL** or provide a **local file path** (e.g. `C:/recordings/meeting.mp4`).
3. Select the language mode: **`english`** or **`hinglish`**.
4. Click **⚡ Analyse**.
5. Watch real-time pipeline status as audio is converted, transcribed, and indexed.
6. Review the generated **Title**, **Summary**, **Action Items**, **Key Decisions**, **Open Questions**, and **Raw Transcript**.
7. Chat with your meeting recording in the interactive **Meeting Chat** section!

---

### Option 2: Command-Line Interface (CLI)

Run the end-to-end pipeline directly in your terminal:

```bash
python main.py
```

**Interactive CLI Session Example:**
```text
Enter YouTube URL or local file path: https://www.youtube.com/watch?v=example
Language (english/hinglish): english
starting AI Video Assistant
Detected YouTube URL. Downloading audio...
Chunking audio...
Audio ready — 2 chunk(s) created.
Loading Whisper model: small ...
Whisper model loaded.
Building vector Store

============================================================
📌 Title: Q3 Product Roadmap & Architecture Sync

📋 Summary:
- Discussed the migration to a microservices architecture for user authentication.
- Evaluated latency benchmarks between local embeddings and cloud vector search.
- Agreed to finalize deployment pipelines before next sprint.

✅ Action Items:
1. Complete performance benchmarks — Owner: Alex — Deadline: Friday 5 PM
2. Update API documentation — Owner: Sarah — Deadline: Next Tuesday

🔑 Key Decisions:
1. Adopt ChromaDB for initial local vector indexing.
2. Standardize audio sample rates at 16 kHz mono.

❓ Open Questions:
1. Which caching layer will be used for recurring user queries?
============================================================

💬 Chat with your meeting (type 'exit' to quit)

You: Who is responsible for performance benchmarks?
🤖 Assistant: Alex is responsible for completing the performance benchmarks, with a deadline of Friday 5 PM.

You: exit
👋 Goodbye!
```

---

## ⚙️ Configuration Reference

| Environment Variable | Description | Default | Required? |
| :--- | :--- | :--- | :--- |
| `MISTRAL_API_KEY` | Mistral AI API key for LLM analysis & RAG answers | — | **Yes** |
| `WHISPER_MODEL` | Whisper model size (`tiny`, `base`, `small`, `medium`, `large`) | `small` | No (optional) |
| `SARVAM_API_KEY` | Sarvam AI API subscription key for Hinglish translation | — | Conditional (for Hinglish) |
| `SARVAM_STT_MODEL` | Model identifier for Sarvam STT translation | `saaras:v2.5` | No (optional) |

---

## 🛡️ Grounded RAG & Anti-Hallucination

RecapAI prevents hallucinations by enforcing explicit guardrails in the RAG prompt template:
- Retrieves top-$k$ ($k=4$) most relevant transcript chunks via vector similarity search.
- Answers are restricted **strictly** to facts contained within retrieved context.
- If the queried detail was never discussed in the recording, the system explicitly outputs:
  > *"I could not find this information in the meeting transcript."*

---

## 🔮 Roadmap & Future Enhancements

- [ ] **Speaker Diarization**: Attribute transcript segments to specific speakers (e.g., Speaker A, Speaker B).
- [ ] **Timestamp Mapping**: Interactive timestamps linking summary points directly to video playback offsets.
- [ ] **Export Options**: One-click PDF, Markdown, and Word document report generation.
- [ ] **Persistent History**: Session and meeting archive storage across browser reloads.
- [ ] **Asynchronous Processing**: Background job queues for processing multi-hour recordings.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Built with ❤️ using Streamlit, LangChain, OpenAI Whisper, and Mistral AI.
</div>
