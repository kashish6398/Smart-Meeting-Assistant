# Smart Meeting Assistant

A modern AI-powered meeting assistant that provides real-time transcription, live insights, executive summaries, and interactive Q&A powered by GetStream and NaraRouter (OpenRouter-compatible LLM endpoint).

---

## 🚀 Features

- **Live Video & Audio Rooms**: High-quality video meetings powered by GetStream Video SDK.
- **Real-Time Closed Captions & Transcription**: Live speech-to-text streamed and synchronized in real-time.
- **NaraRouter AI Integration**: Configurable API key, base URL, and model via `.env`.
- **Executive AI Summaries**: On-demand structured meeting notes with key points, action items, and decisions.
- **Interactive AI Meeting Q&A**: Ask the AI assistant questions about the meeting in real-time.
- **Meeting Chat Broadcast**: Share AI summaries directly into the room's Stream Chat.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Stream Video & Chat React SDKs (`pnpm`)
- **Backend**: Python 3.11+, FastAPI, Uvicorn, OpenAI SDK, Stream Chat Python SDK (`uv`)
- **AI / LLM**: NaraRouter / OpenRouter (`NARAROUTER_API_KEY`, `NARAROUTER_BASE_URL`, `NARAROUTER_MODEL`)

---

## ⚙️ Setup & Configuration

### 1. Backend Environment Setup (`backend/.env`)

In `backend/.env`:
```env
# GetStream Credentials
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# NaraRouter / OpenRouter LLM Configuration
NARAROUTER_API_KEY=your_nararouter_api_key
NARAROUTER_BASE_URL=https://openrouter.ai/api/v1
NARAROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

# Server Port & Host
PORT=8000
HOST=0.0.0.0
```

### 2. Frontend Environment Setup (`.env.local`)

In root `.env.local`:
```env
# GetStream Public & Secret Keys
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Defaults
NEXT_PUBLIC_CALL_ID=smart-meeting-room
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 🏃 Running the Application

### 1. Start the Backend (FastAPI + NaraRouter)
```bash
cd backend
uv run python main.py
```
Backend runs on `http://localhost:8000` (Swagger docs available at `http://localhost:8000/docs`).

### 2. Start the Frontend (Next.js)
```bash
# In the project root
pnpm dev
```
Frontend runs on `http://localhost:3000`.
