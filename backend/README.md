# Smart Meeting Assistant Backend

FastAPI service for real-time meeting transcription synchronization, on-demand AI summaries, interactive Q&A, and GetStream token authentication.

## 🚀 Quickstart with `uv`

```bash
# 1. Install & run
uv run python main.py
```

## ⚙️ Environment Variables (`.env`)

- `NARAROUTER_API_KEY`: API Key for NaraRouter / OpenRouter
- `NARAROUTER_BASE_URL`: Base URL (default `https://openrouter.ai/api/v1`)
- `NARAROUTER_MODEL`: Model name (default `meta-llama/llama-3.3-70b-instruct`)
- `STREAM_API_KEY`: Stream API Key
- `STREAM_API_SECRET`: Stream API Secret
- `PORT`: Server port (default `8000`)
- `HOST`: Server host (default `0.0.0.0`)
