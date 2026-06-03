<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# lib

## Purpose
The service/integration layer. Each module is a typed wrapper over one external API or cross-cutting concern, called almost exclusively from `src/app/api/*` route handlers (so API keys never reach the browser). Also hosts the Seedance prompt-composition engine and a couple of client-side helpers.

## Key Files

| File | Description |
|------|-------------|
| `kie.ts` | KIE.ai video client (Seedance 2 Fast, Kling Avatar): `createKieTask()`, `getKieTaskStatus()`, `getKieCredits()`. Uses `prompt-builder`. Reads `KIE_API_KEY`. |
| `gpt-image.ts` | KIE.ai GPT-Image client: `createGptImageTask()`, `pollGptImageTask()`, `getGptImageCredits()` + `GptImageApiError`. Reads `KIE_API_KEY`. |
| `heygen.ts` | HeyGen client: `createVideo()`, `getVideoStatus()`, `listVoices()`, `getBalance()` + `HeyGenApiError`. Reads `HEYGEN_API_KEY`. |
| `tts.ts` | Multi-provider TTS orchestration (OpenAI, ElevenLabs, Google Cloud TTS, Gemini Flash) with Google API-key rotation, retry/backoff, and `undici` proxy support. Exports `generateTTS()`, `generateGeminiFlashTTS()`. |
| `prompt-builder.ts` | Composes Seedance prompts from emotion/camera/dynamism/lighting/gender params, with synergy lookups. `buildPrompt()` + modifier tables. Uses `@/constants/presets`. |
| `supabase.ts` | Supabase Storage abstraction: `getSupabase()`, `uploadFileToSupabase()` → returns public URLs for provider APIs. |
| `history-service.ts` | **Client-side** (`"use client"`) localStorage history of generations (`historyService`, `HistoryItem`). Browser-only (guards on `typeof window`). |
| `utils.ts` | `cn()` — Tailwind class merge (`clsx` + `tailwind-merge`). |

## For AI Agents

### Working In This Directory
- **Server vs client**: most modules are server-only and read secrets from `process.env`. The exceptions are `history-service.ts` (client/localStorage) and `utils.ts` (universal). Don't import the secret-reading clients into client components.
- API clients follow a consistent shape: a `getApiKey()`/`getHeaders()` helper, `fetch`, JSON-parse-with-null-safety, HTTP status check, and a custom `*ApiError` (with `code`/`message`) thrown on failure. Match this when adding endpoints.
- `tts.ts` has the most nuanced logic: it rotates multiple Google API keys (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY`, …) and distinguishes auth failures (try next key) from transient failures (retry/backoff). Read it fully before changing retry behavior.
- Async video/image generation is split create + poll: `create*Task` returns an id, `poll*`/`get*Status` is called repeatedly by the route/UI.

### Testing Requirements
- `gpt-image.ts` is covered by `src/__tests__/gpt-image/api-client.test.ts` (fetch mocked, env stubbed via `vi.stubEnv`). Add equivalent tests when modifying `kie.ts`/`heygen.ts`.

### Common Patterns
- Custom error classes carry a provider `code` so routes can map to user-facing messages in `@/constants/*ERROR_MESSAGES`.
- Storage flow: upload local blob → Supabase → pass the returned public URL to the provider API (provider APIs require publicly reachable URLs).

## Dependencies

### Internal
- `@/constants/presets` (prompt-builder), `@/types/gpt-image`, `@/types/heygen`

### External
- `@supabase/supabase-js`, `@google/genai`, `openai`, `@elevenlabs/elevenlabs-js`, `undici`, `clsx`, `tailwind-merge`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
