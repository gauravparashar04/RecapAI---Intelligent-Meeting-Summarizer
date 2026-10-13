# 🎬 RecapAI (MERN + FastAPI Edition)
### Enterprise AI Meeting Intelligence & Video Assistant with Grounded RAG

<div align="center">

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-LCEL-green?logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Mistral AI](https://img.shields.io/badge/LLM-open--mistral--7b-FD6F00?logo=mistralai&logoColor=white)](https://mistral.ai/)
[![ChromaDB](https://img.shields.io/badge/VectorDB-ChromaDB-purple)](https://www.trychroma.com/)
[![OpenAI Whisper](https://img.shields.io/badge/STT-Whisper%20Local-412991?logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

**A decoupled full-stack meeting intelligence platform that turns video recordings into searchable knowledge with persistent storage, executive summaries, actionable insights, and transcript-grounded RAG.**

[Overview](#-overview) • [Architecture](#-architecture) • [Key Features](#-key-features) • [Project Structure](#-project-structure) • [Quickstart Guide](#-quickstart-guide) • [API Specification](#-api-specification) • [Environment Variables](#-environment-variables)

</div>

---

## 📌 Overview

**RecapAI (MERN Edition)** is a distributed AI meeting intelligence application. It decouples compute-intensive machine learning workloads (speech-to-text, audio chunking, embeddings, and vector indexing) from the user-facing web tier, delivering a scalable, persistent, and production-ready system.

Unlike single-session prototypes, RecapAI uses **MongoDB** to persist all analyzed meetings and conversational history. Users can switch between past meetings instantly without reprocessing heavy audio files.

---

## 🏛️ Architecture

```
 ┌───────────────────────────────────────────────────────────────┐
 │                   React 18 Frontend (client/)                 │
 │   - Meeting ingestion form    - Executive summary cards       │
 │   - Past session sidebar      - Conversational RAG chat box   │
 └───────────────────────────────┬───────────────────────────────┘
                                 │ HTTP / CORS (Port 5173 ➔ 5000)
                                 ▼
 ┌───────────────────────────────────────────────────────────────┐
 │                 Node.js + Express Gateway (server/)           │
 │   - RESTful API routing       - Meeting lifecycle controllers │
 │   - Error handling & CORS     - Inter-service Axios calls     │
 └───────────────┬───────────────────────────────┬───────────────┘
                 │ Mongoose                      │ HTTP (Port 5000 ➔ 8000)
                 ▼                               ▼
 ┌───────────────────────────────┐ ┌─────────────────────────────┐
 │       MongoDB Database        │ │    Python AI Microservice   │
 │   - Saved meetings collection │ │           (api.py)          │
 │   - Full transcripts          │ │  - Whisper STT (or Sarvam)  │
 │   - Persistent chat histories │ │  - Mistral AI Extraction    │
 │   - Action items & decisions  │ │  - ChromaDB Vector Store    │
 └───────────────────────────────┘ └─────────────────────────────┘
```

---

## ✨ Key Features

- **🌐 Ingestion Pipeline**: Ingests direct YouTube links via `yt-dlp` or local audio/video file paths (`.mp4`, `.wav`, `.mp3`).
- **🔊 Audio Normalization & Chunking**: Standardizes media to mono 16 kHz WAV via FFmpeg and `pydub`, splitting long recordings into 10-minute segments.
- **🗣️ Multilingual Speech-to-Text**:
  - Local, offline **OpenAI Whisper** inference for English.
  - **Sarvam AI (`saaras:v2.5`)** speech-to-text translation for Hinglish with 25-second chunking.
- **🧠 Map-Reduce Summarization**: Overcomes token context limits by summarizing chunks individually before merging them into a unified executive overview using Mistral AI (`open-mistral-7b`).
- **🎯 Structured Extraction**:
  - **Action Items**: Task description, responsible owner, and deadline.
  - **Key Decisions**: Strategic agreements and resolutions.
  - **Open Questions**: Unresolved topics and follow-up inquiries.
- **💬 Multi-Tenant RAG Engine**: Indexes transcript chunks into isolated ChromaDB collections (`meeting_<id>`) using `all-MiniLM-L6-v2` embeddings, ensuring zero cross-meeting context leakage.
- **💾 Full Persistence via MongoDB**: Every processed session, summary, and chat interaction is permanently stored in MongoDB.
- **🎨 Futuristic Cyberpunk Dark UI**: Built with React 18, featuring Google Fonts (`Syne` and `JetBrains Mono`), responsive layouts, copy-to-clipboard transcript modals, and auto-scrolling chat widgets.

---

## 📁 Project Structure

```text
AI Video Assistant with RAG/
├── client/                         # React 18 SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Historical meetings navigation
│   │   │   ├── MediaInput.jsx      # Video ingestion form with language toggle
│   │   │   ├── MeetingIntelligence.jsx # Summary, actions, decisions, transcript
│   │   │   └── ChatWidget.jsx      # Conversational RAG chat box with auto-scroll
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios client calling Express
│   │   ├── App.jsx                 # Root layout and state coordinator
│   │   └── index.css               # Design system and dark theme tokens
│   └── package.json
│
├── server/                         # Node.js + Express API Gateway
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # MongoDB Mongoose connection manager
│   │   ├── models/
│   │   │   └── Meeting.js          # Meeting schema with embedded chatHistory
│   │   ├── controllers/
│   │   │   └── meetingController.js# Express business logic & Axios calls to AI
│   │   ├── routes/
│   │   │   └── meetingRoutes.js    # RESTful route definitions
│   │   └── server.js               # Express application entry point
│   ├── package.json
│   └── .env
│
├── api.py                          # Python FastAPI AI Microservice (Port 8000)
├── core/
│   ├── transcriber.py              # Whisper STT & Sarvam AI translation
│   ├── summarize.py                # Map-reduce summarization with rate-limit retry
│   ├── extractor.py                # Action items, decisions, and questions extractor
│   ├── vector_store.py             # ChromaDB indexer with collection isolation
│   └── rag_engine.py               # Grounded LangChain LCEL RAG pipeline
├── utils/
│   └── audio_processor.py          # Media downloading and WAV 16kHz chunking
├── vector_db/                      # ChromaDB persistent vector storage
├── .env                            # Python AI secrets (Mistral & Sarvam keys)
├── .env.example                    # Python environment template
├── README.md                       # Streamlit version documentation
└── README_MERN.md                  # MERN version documentation (this file)
```

---

## 🚀 Quickstart Guide

### Prerequisites

1. **Node.js** (v18+) and **npm**
2. **Python** (3.10+) with virtual environment activated
3. **MongoDB** running locally (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI
4. **FFmpeg** installed and accessible in your system `PATH`

---

### Step 1: Start the Python AI Microservice (FastAPI)

In your first terminal tab:

```powershell
# From project root:
.\.venv\Scripts\activate
python api.py
```

> ✅ *Service starts at **`http://localhost:8000`**.*  
> *Interactive Swagger documentation is available at **`http://localhost:8000/docs`**.*

---

### Step 2: Start the Express.js Backend API

In your second terminal tab:

```powershell
cd server
npm start
```

> ✅ *Express Gateway connects to MongoDB and starts on **`http://localhost:5000`**.*

---

### Step 3: Start the React Frontend (Vite)

In your third terminal tab:

```powershell
cd client
npm run dev
```

> ✅ *Vite starts the React development server at **`http://localhost:5173`**.*

---

### Step 4: Open the Application

Open your browser to **`http://localhost:5173`**:
1. Paste a **YouTube URL** or local video path.
2. Choose your language mode (**`English`** or **`Hinglish`**).
3. Click **"Analyze Recording"**.
4. Review your session title, executive summary, action items, and chat with your meeting!

---

## 📡 API Specification

### Express Gateway Endpoints (Port 5000)

| Endpoint | Method | Description | Payload |
| :--- | :--- | :--- | :--- |
| `/api/meetings/process` | `POST` | Analyze a new video or audio file | `{ "source": string, "language": "english"\|"hinglish" }` |
| `/api/meetings` | `GET` | Get all past meetings for sidebar navigation | — |
| `/api/meetings/:id` | `GET` | Get full details of a specific meeting | — |
| `/api/meetings/:id/chat`| `POST` | Ask a question about the meeting transcript | `{ "question": string }` |
| `/api/meetings/:id` | `DELETE`| Remove a meeting from MongoDB | — |
| `/health` | `GET` | Backend health check | — |

### Python AI Microservice Endpoints (Port 8000)

| Endpoint | Method | Description | Payload |
| :--- | :--- | :--- | :--- |
| `/api/ai/process` | `POST` | Run audio extraction, STT, and LLM analysis | `{ "meeting_id": string, "source": string, "language": string }` |
| `/api/ai/chat` | `POST` | Run semantic vector search and grounded RAG | `{ "meeting_id": string, "question": string }` |
| `/health` | `GET` | Microservice health check | — |

---

## ⚙️ Environment Variables

### 1. Python AI Service ([`.env`](file:///c:/Users/LENOVO/Desktop/Projects/AI%20Video%20Assistant%20with%20RAG/.env))
```ini
# Mistral AI API key (free-tier supported)
MISTRAL_API_KEY=your_mistral_api_key_here
MISTRAL_MODEL=open-mistral-7b

# Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL=small

# Sarvam AI API key (for Hinglish transcription)
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_STT_MODEL=saaras:v2.5
```

### 2. Node.js Express Server ([`server/.env`](file:///c:/Users/LENOVO/Desktop/Projects/AI%20Video%20Assistant%20with%20RAG/server/.env))
```ini
# Express Server Port
PORT=5000

# MongoDB Connection String
MONGO_URI=mongodb://127.0.0.1:27017/recapai

# Base URL of Python AI Microservice
PYTHON_AI_URL=http://127.0.0.1:8000
```

---

## 🛡️ Grounded RAG Guardrails

RecapAI eliminates hallucinations through three protective layers:
1. **Semantic Text Chunking**: 500-character segments with 50-character overlap preserve contextual coherence.
2. **Top-$k$ Retrieval**: Only the top-4 most relevant chunks are retrieved from ChromaDB.
3. **Strict System Directives**: The Mistral prompt strictly restricts answers to the provided context; if a topic is not in the recording, the assistant outputs:
   > *"I could not find this information in the meeting transcript."*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Built with ❤️ using React 18, Express.js, MongoDB, FastAPI, LangChain, OpenAI Whisper, and Mistral AI.
</div>
