<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# worker

## Purpose
A standalone **FastAPI** service (separate from the Next.js app) intended for heavy video/audio processing — transcription, EDL (Edit Decision List) generation, and rendering. Endpoints currently return **mock/stub** responses; real integrations (ElevenLabs transcription, an LLM for EDL, FFmpeg rendering) are flagged as TODO in the code. It is wired into `docker-compose.yml` as the `worker` service and the Next.js `app` depends on it.

> Note: the naming inside `main.py` (`video-use-worker`) suggests this scaffolding originated from a related video-editing project and is not yet exercised by the avatar-generation UI. Verify before assuming it is on the live path.

## Key Files

| File | Description |
|------|-------------|
| `main.py` | FastAPI app: CORS config + `GET /` health check and `POST /transcribe`, `POST /generate-edl`, `POST /render` (all stubbed) |
| `__init__.py` | Package marker |
| `requirements.txt` | Python deps: fastapi, uvicorn, ffmpeg-python, librosa, requests, pillow, numpy, python-multipart |
| `Dockerfile` | Python 3.11-slim + system `ffmpeg`; runs `uvicorn main:app --host 0.0.0.0 --port 8000` |

## Endpoints

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| GET | `/` | Health check → `{status: "ok", service: "video-use-worker"}` | live |
| POST | `/transcribe` | Upload audio/video → word-level transcript with timing/confidence | mock data |
| POST | `/generate-edl` | Transcript (+ optional prompt) → EDL with ranges/beats/quotes/reasons | mock data |
| POST | `/render` | EDL + source path → render job status (id, progress) | stub queued |

## For AI Agents

### Working In This Directory
- This is **Python**, not TypeScript — separate toolchain from the rest of the repo.
- CORS allows `localhost:3000` and `*.up.railway.app` (Railway). Update this list if adding new origins.
- `WORKER_PORT` env var controls the port (default `8000`).
- When implementing the real integrations, replace the mock returns in each handler; keep the response shapes the Next.js client expects.

### Testing Requirements
- No test suite present. Run locally with `uvicorn main:app --reload` (from `worker/`) and exercise endpoints, or build the image and run via `docker-compose up worker`.

### Common Patterns
- FastAPI handlers return plain dicts (auto-serialized to JSON).
- File uploads via `UploadFile` / `python-multipart`.

## Dependencies

### Internal
- None — independent of the Next.js `src/` code; communicates over HTTP only.

### External
- `fastapi`, `uvicorn` — web server
- `ffmpeg-python`, `librosa`, `numpy`, `pillow` — media processing (planned)
- `requests` — outbound HTTP

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
