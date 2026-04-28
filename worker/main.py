"""Video-use worker — FastAPI service for transcription, EDL generation, and rendering."""

import logging
import os
import time
import uuid
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("video-use-worker")

# ── App ────────────────────────────────────────────────────────────────────

app = FastAPI(title="Video-Use Worker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://atom-avatar-studio-production.up.railway.app", "https://*.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Video-use worker starting on port %s", os.getenv("WORKER_PORT", "8000"))


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("Video-use worker shutting down")


# ── Health check ───────────────────────────────────────────────────────────

@app.get("/")
async def health() -> dict:
    return {"status": "ok", "service": "video-use-worker"}


# ── Pydantic models ────────────────────────────────────────────────────────

class TranscriptionWord(BaseModel):
    word: str
    start: float
    end: float
    confidence: float


class TranscriptionData(BaseModel):
    id: str
    words: list[TranscriptionWord]
    language: str
    duration: float


class EdlRange(BaseModel):
    start: float
    end: float
    beat: Optional[str] = None
    quote: Optional[str] = None
    reason: str


class EdlData(BaseModel):
    source: str
    ranges: list[EdlRange]
    grade: Optional[float] = None
    overlays: Optional[list[str]] = None
    subtitles: Optional[bool] = None


class RenderRequest(BaseModel):
    edl: EdlData
    source_video_path: str


class RenderStatus(BaseModel):
    id: str
    status: str
    progress: float
    output_url: Optional[str] = None
    error: Optional[str] = None


# ── POST /transcribe ───────────────────────────────────────────────────────

@app.post("/transcribe", response_model=TranscriptionData)
async def transcribe(
    file: UploadFile = File(..., description="Video or audio file to transcribe"),
) -> TranscriptionData:
    """Accept a video/audio file upload and return word-level transcription.

    Stub — real ElevenLabs integration in T16.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    allowed_types = {
        "video/mp4", "video/webm", "video/quicktime",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
    }
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type: {file.content_type}",
        )

    logger.info("Transcribe request: %s (%s)", file.filename, file.content_type)

    # Stub: return mock transcription
    mock_words = [
        TranscriptionWord(word="Hello", start=0.0, end=0.35, confidence=0.98),
        TranscriptionWord(word="world", start=0.40, end=0.72, confidence=0.96),
        TranscriptionWord(word="this", start=0.80, end=1.00, confidence=0.94),
        TranscriptionWord(word="is", start=1.05, end=1.18, confidence=0.92),
        TranscriptionWord(word="a", start=1.22, end=1.28, confidence=0.99),
        TranscriptionWord(word="test", start=1.32, end=1.60, confidence=0.95),
    ]

    return TranscriptionData(
        id=str(uuid.uuid4()),
        words=mock_words,
        language="en",
        duration=1.60,
    )


# ── POST /generate-edl ────────────────────────────────────────────────────

class GenerateEdlRequest(BaseModel):
    transcription: TranscriptionData
    prompt: Optional[str] = None


@app.post("/generate-edl", response_model=EdlData)
async def generate_edl(request: GenerateEdlRequest) -> EdlData:
    """Accept TranscriptionData + optional prompt, return EDL.

    Stub — real LLM integration in T17.
    """
    logger.info(
        "Generate-EDL request: transcription_id=%s, prompt=%s",
        request.transcription.id,
        request.prompt or "(none)",
    )

    # Stub: return mock EDL based on transcription duration
    duration = request.transcription.duration

    mock_ranges = [
        EdlRange(
            start=0.0,
            end=min(0.72, duration),
            beat="intro",
            quote="Hello world",
            reason="Opening hook — strong greeting",
        ),
        EdlRange(
            start=0.80,
            end=min(1.60, duration),
            beat="body",
            quote="this is a test",
            reason="Core content delivery",
        ),
    ]

    return EdlData(
        source=f"transcription:{request.transcription.id}",
        ranges=mock_ranges,
        grade=7.5,
        overlays=["lower-third"],
        subtitles=True,
    )


# ── POST /render ───────────────────────────────────────────────────────────

@app.post("/render", response_model=RenderStatus)
async def render(request: RenderRequest) -> RenderStatus:
    """Accept EDL + source video path, return render status.

    Stub — real FFmpeg integration in later tasks.
    """
    logger.info(
        "Render request: source=%s, ranges=%d",
        request.source_video_path,
        len(request.edl.ranges),
    )

    if not request.source_video_path:
        raise HTTPException(status_code=400, detail="source_video_path is required")

    # Stub: return mock render status
    return RenderStatus(
        id=str(uuid.uuid4()),
        status="queued",
        progress=0.0,
        output_url=None,
        error=None,
    )


# ── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WORKER_PORT", "8000"))
    logger.info("Starting video-use worker on port %d", port)
    uvicorn.run(app, host="0.0.0.0", port=port)