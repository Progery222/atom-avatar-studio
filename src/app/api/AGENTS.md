<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# api

## Purpose
Server-side route handlers (App Router) — the secure boundary between the browser and external provider APIs. Each handler reads secrets from `process.env`, validates the request, delegates to a typed client in `@/lib/*`, and returns JSON. Grouped by feature: Seedance/Kling video (top-level `generate`/`status`/`credits`), GPT-Image, HeyGen, and TTS.

Each route lives in its own folder as `route.ts` (Next.js convention). They're documented together here rather than with one `AGENTS.md` per single-file folder.

## Routes

### Seedance / Kling video (KIE.ai) — env: `KIE_API_KEY`
| Route | Method | Purpose | lib |
|-------|--------|---------|-----|
| `generate/route.ts` | POST | Create a video task (Seedance/Kling). For external-audio (Kling) models, generates TTS if needed and uploads to Supabase. | `@/lib/kie`, `@/lib/tts`, `@/lib/supabase`, `@/lib/prompt-builder` |
| `status/route.ts` | GET | Poll task state (`?taskId=`) → video URL on completion or error code/message. | `@/lib/kie` |
| `credits/route.ts` | GET | Remaining KIE credits. Also the Railway health-check endpoint. | `@/lib/kie` |

### GPT-Image (KIE.ai) — env: `KIE_API_KEY`
| Route | Method | Purpose | lib |
|-------|--------|---------|-----|
| `gpt-image/generate/route.ts` | POST | Create image task (text/image-to-image). Validates prompt ≤2000 chars, ≤5 input URLs, invalid combos. | `@/lib/gpt-image`, `@/constants/gpt-image` |
| `gpt-image/status/route.ts` | GET | Poll (`?taskId=`) → result URLs or failCode/failMsg. | `@/lib/gpt-image` |
| `gpt-image/credits/route.ts` | GET | GPT-Image credit balance. | `@/lib/gpt-image` |

### HeyGen — env: `HEYGEN_API_KEY`
| Route | Method | Purpose | lib |
|-------|--------|---------|-----|
| `heygen/generate/route.ts` | POST | Create video from image or photo-avatar (motion_prompt/expressiveness for avatars). | `@/lib/heygen` |
| `heygen/status/route.ts` | GET | Poll (`?videoId=`) → status/video URL. | `@/lib/heygen` |
| `heygen/balance/route.ts` | GET | Account balance. | `@/lib/heygen` |
| `heygen/voices/route.ts` | GET | List voices, filterable by `gender`/`language`/`limit` (default 100). | `@/lib/heygen` |

### TTS — env: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, Google keys (see `@/lib/tts`)
| Route | Method | Purpose | lib |
|-------|--------|---------|-----|
| `tts/route.ts` | POST | Generate speech (OpenAI / ElevenLabs / Gemini Flash), upload blob to Supabase, return audio URL. | `@/lib/tts`, `@/lib/supabase` |
| `tts/voice-preview/route.ts` | POST | Short Gemini Flash preview clip for the voice picker; returns audio. | `@/lib/tts` |

## For AI Agents

### Working In This Directory
- **Secrets stay here.** Read `process.env` in handlers only; never forward keys to the client. Clients reach providers exclusively through these routes.
- Keep handlers thin — validation + delegation to `@/lib`. Put real provider logic in `@/lib/*`, option/limit/error data in `@/constants/*`.
- Validate against `@/constants/*` (`GPT_IMAGE_CONSTRAINTS`, `*_LIMITS`) and translate provider errors via `*_ERROR_MESSAGES` using the `code` on the thrown `*ApiError`.
- Note inconsistent error conventions: GPT-Image routes return real HTTP status codes (400/200); HeyGen handlers tend to return 200 with the error in the body. Match the convention of the feature you're editing.
- Provider APIs need publicly reachable URLs — upload local files via `@/lib/supabase` first, then pass the public URL.

### Testing Requirements
- `gpt-image/generate` is tested in `src/__tests__/gpt-image/generate-route.test.ts` (construct a `Request`, mock `@/lib/gpt-image`). Add equivalent tests for new/changed routes. Run `npm test`.

### Common Patterns
- Export `GET`/`POST` async functions taking the standard `Request`.
- Async generation = `generate` (returns id) + `status` (polled by the client/UI).

## Dependencies

### Internal
- `@/lib/*` (kie, gpt-image, heygen, tts, supabase, prompt-builder), `@/constants/*`, `@/types/*`

### External
- Provider APIs: KIE.ai, HeyGen, OpenAI, ElevenLabs, Google (Gemini/Cloud TTS); Supabase for storage.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
