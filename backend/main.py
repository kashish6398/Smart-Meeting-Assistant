import os
import sys
import time
import logging
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

# Stream Chat SDK (optional if stream keys configured)
try:
    from stream_chat import StreamChat
    STREAM_AVAILABLE = True
except ImportError:
    STREAM_AVAILABLE = False

# Load environment variables
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart-meeting-assistant")

# ==============================================================================
# Configuration Helpers
# ==============================================================================

def get_nararouter_api_key() -> str:
    return os.getenv("NARAROUTER_API_KEY") or os.getenv("OPENAI_API_KEY") or ""

def get_nararouter_base_url() -> str:
    return os.getenv("NARAROUTER_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://openrouter.ai/api/v1"

def get_nararouter_model() -> str:
    return os.getenv("NARAROUTER_MODEL") or os.getenv("OPENAI_MODEL") or "meta-llama/llama-3.3-70b-instruct"

def get_stream_api_key() -> str:
    return os.getenv("STREAM_API_KEY") or os.getenv("NEXT_PUBLIC_STREAM_API_KEY") or ""

def get_stream_api_secret() -> str:
    return os.getenv("STREAM_API_SECRET") or ""

def get_openai_client() -> AsyncOpenAI:
    api_key = get_nararouter_api_key()
    base_url = get_nararouter_base_url()
    
    if not api_key:
        logger.warning("No NARAROUTER_API_KEY or OPENAI_API_KEY found in environment variables.")
        api_key = "dummy_key_to_allow_startup"
        
    return AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        default_headers={
            "HTTP-Referer": "https://localhost:3000",
            "X-Title": "Smart Meeting Assistant",
        }
    )

# In-Memory Storage for Meeting Transcripts and Summaries
# Keyed by call_id
meeting_transcripts: Dict[str, List[Dict[str, Any]]] = {}
meeting_summaries: Dict[str, Dict[str, Any]] = {}

# ==============================================================================
# FastAPI Application & Lifespan
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("Smart Meeting Assistant Backend Starting...")
    logger.info(f"NaraRouter Base URL: {get_nararouter_base_url()}")
    logger.info(f"NaraRouter Model:    {get_nararouter_model()}")
    logger.info(f"NaraRouter API Key:  {'Configured' if get_nararouter_api_key() else 'NOT SET'}")
    logger.info(f"Stream API Key:      {'Configured' if get_stream_api_key() else 'NOT SET'}")
    logger.info("=" * 60)
    yield
    logger.info("Smart Meeting Assistant Backend Stopping...")

app = FastAPI(
    title="Smart Meeting Assistant API",
    description="Backend API powering real-time transcription, summaries, and Q&A via NaraRouter / OpenRouter",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Request/Response Schemas
# ==============================================================================

class TranscriptItem(BaseModel):
    speaker: str = Field(default="Participant")
    text: str
    timestamp: Optional[str] = None

class IngestTranscriptRequest(BaseModel):
    call_id: str
    transcript: TranscriptItem

class SummarizeRequest(BaseModel):
    call_id: Optional[str] = "default"
    transcripts: Optional[List[TranscriptItem]] = None
    custom_prompt: Optional[str] = None

class AskQuestionRequest(BaseModel):
    call_id: Optional[str] = "default"
    question: str
    transcripts: Optional[List[TranscriptItem]] = None

class TokenRequest(BaseModel):
    userId: str

class PostSummaryRequest(BaseModel):
    call_id: str
    summary_text: str

# ==============================================================================
# Core AI Functions using NaraRouter / OpenRouter
# ==============================================================================

def format_transcript_text(items: List[TranscriptItem]) -> str:
    if not items:
        return "No transcript recorded yet."
    lines = []
    for item in items:
        t = f"[{item.timestamp}] " if item.timestamp else ""
        lines.append(f"{t}{item.speaker}: {item.text}")
    return "\n".join(lines)

async def generate_meeting_summary(transcript_text: str, custom_prompt: Optional[str] = None) -> Dict[str, Any]:
    api_key = get_nararouter_api_key()
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="NARAROUTER_API_KEY is not set in backend/.env. Please configure it to use AI summarization."
        )

    model_name = get_nararouter_model()
    client = get_openai_client()

    system_prompt = (
        "You are an expert Executive AI Meeting Assistant. "
        "Analyze the provided meeting transcript and produce a structured, high-value summary.\n"
        "Format your output in clean Markdown with the following sections:\n"
        "### 📌 Executive Summary\n"
        "(A 2-3 sentence overview of the meeting purpose and key outcomes)\n\n"
        "### 🔑 Key Discussion Points\n"
        "(Bullet points highlighting important topics discussed)\n\n"
        "### ✅ Action Items & Next Steps\n"
        "(Action items in format: - [ ] [Assignee/Team] Task description)\n\n"
        "### 💡 Decisions Made\n"
        "(Any explicit decisions or consensus reached)"
    )

    user_content = f"Meeting Transcript:\n---\n{transcript_text}\n---"
    if custom_prompt:
        user_content += f"\n\nAdditional Instructions: {custom_prompt}"

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        summary = response.choices[0].message.content
        return {
            "summary": summary,
            "model": model_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        logger.error(f"NaraRouter API error in generate_meeting_summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"NaraRouter LLM generation error: {str(e)}"
        )

async def answer_meeting_question(question: str, transcript_text: str) -> Dict[str, Any]:
    api_key = get_nararouter_api_key()
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="NARAROUTER_API_KEY is not set in backend/.env. Please configure it to use AI assistant Q&A."
        )

    model_name = get_nararouter_model()
    client = get_openai_client()

    system_prompt = (
        "You are a helpful and intelligent AI Meeting Assistant participating in a live meeting. "
        "Answer questions accurately based on the meeting transcript provided. "
        "If the answer is not mentioned in the transcript, state that clearly and offer helpful context if appropriate. "
        "Keep answers concise, actionable, and formatted in clean Markdown."
    )

    user_content = f"Meeting Transcript Context:\n---\n{transcript_text}\n---\n\nQuestion: {question}"

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        answer = response.choices[0].message.content
        return {
            "answer": answer,
            "model": model_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    except Exception as e:
        logger.error(f"NaraRouter API error in answer_meeting_question: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"NaraRouter LLM Q&A error: {str(e)}"
        )

# ==============================================================================
# API Routes
# ==============================================================================

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Smart Meeting Assistant API",
        "model": get_nararouter_model(),
        "base_url": get_nararouter_base_url(),
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    nararouter_configured = bool(get_nararouter_api_key())
    stream_configured = bool(get_stream_api_key() and get_stream_api_secret())
    
    return {
        "status": "healthy",
        "nararouter_configured": nararouter_configured,
        "stream_configured": stream_configured,
        "model": get_nararouter_model(),
        "base_url": get_nararouter_base_url(),
    }

@app.get("/api/config")
async def get_config():
    """Returns non-sensitive configuration details."""
    return {
        "model": get_nararouter_model(),
        "base_url": get_nararouter_base_url(),
        "has_api_key": bool(get_nararouter_api_key()),
        "has_stream_key": bool(get_stream_api_key()),
    }

@app.post("/api/transcripts")
async def ingest_transcript(req: IngestTranscriptRequest):
    """Save transcript line in memory for the call."""
    if req.call_id not in meeting_transcripts:
        meeting_transcripts[req.call_id] = []
    
    item_dict = req.transcript.model_dump()
    if not item_dict.get("timestamp"):
        item_dict["timestamp"] = time.strftime("%H:%M:%S")
        
    meeting_transcripts[req.call_id].append(item_dict)
    return {"status": "success", "count": len(meeting_transcripts[req.call_id])}

@app.get("/api/transcripts/{call_id}")
async def get_transcripts(call_id: str):
    """Retrieve full transcript for a given call_id."""
    items = meeting_transcripts.get(call_id, [])
    return {"call_id": call_id, "transcripts": items, "count": len(items)}

@app.post("/api/summarize")
async def summarize_meeting(req: SummarizeRequest):
    """Generate structured summary of the meeting."""
    items_to_summarize: List[TranscriptItem] = []
    
    if req.transcripts and len(req.transcripts) > 0:
        items_to_summarize = req.transcripts
    elif req.call_id and req.call_id in meeting_transcripts:
        raw_items = meeting_transcripts[req.call_id]
        items_to_summarize = [TranscriptItem(**item) for item in raw_items]

    if not items_to_summarize:
        return {
            "summary": "No transcript content available yet. Speak during the meeting to generate transcripts before summarizing.",
            "model": get_nararouter_model(),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }

    formatted_text = format_transcript_text(items_to_summarize)
    result = await generate_meeting_summary(formatted_text, req.custom_prompt)
    
    if req.call_id:
        meeting_summaries[req.call_id] = result
        
    return result

@app.post("/api/ask")
async def ask_assistant(req: AskQuestionRequest):
    """Ask AI Assistant a question about the meeting."""
    items_context: List[TranscriptItem] = []
    
    if req.transcripts and len(req.transcripts) > 0:
        items_context = req.transcripts
    elif req.call_id and req.call_id in meeting_transcripts:
        raw_items = meeting_transcripts[req.call_id]
        items_context = [TranscriptItem(**item) for item in raw_items]

    formatted_text = format_transcript_text(items_context)
    result = await answer_meeting_question(req.question, formatted_text)
    return result

@app.post("/api/token")
async def generate_stream_token(req: TokenRequest):
    """Generate Stream User Token using Python Stream Chat SDK."""
    stream_key = get_stream_api_key()
    stream_secret = get_stream_api_secret()

    if not stream_key or not stream_secret:
        raise HTTPException(
            status_code=500,
            detail="Stream API credentials not configured in backend/.env"
        )

    if not STREAM_AVAILABLE:
        raise HTTPException(
            status_code=500,
            detail="stream-chat package is not installed."
        )

    try:
        server_client = StreamChat(api_key=stream_key, api_secret=stream_secret)
        token = server_client.create_token(req.userId)
        return {"token": token}
    except Exception as e:
        logger.error(f"Stream token creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bot/post-summary")
async def post_summary_to_chat(req: PostSummaryRequest):
    """Broadcast AI Summary message to Stream Chat channel."""
    stream_key = get_stream_api_key()
    stream_secret = get_stream_api_secret()

    if not stream_key or not stream_secret or not STREAM_AVAILABLE:
        return {"status": "skipped", "message": "Stream chat not configured"}

    try:
        server_client = StreamChat(api_key=stream_key, api_secret=stream_secret)
        
        # Ensure bot user exists
        server_client.upsert_user({
            "id": "meeting-assistant-bot",
            "name": "Smart Meeting Assistant",
            "role": "admin",
        })

        # Send message to livestream or videocall channel
        channel = server_client.channel("livestream", req.call_id)
        channel.send_message({
            "text": req.summary_text,
            "user_id": "meeting-assistant-bot"
        }, user_id="meeting-assistant-bot")

        return {"status": "success", "message": "Summary posted to chat channel"}
    except Exception as e:
        logger.error(f"Failed to post summary to Stream channel: {e}")
        return {"status": "error", "error": str(e)}

# ==============================================================================
# Entry Point
# ==============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)