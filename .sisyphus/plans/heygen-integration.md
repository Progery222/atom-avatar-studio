# HeyGen Image-to-Video Integration

## TL;DR

> **Quick Summary**: Add HeyGen as a separate tab in the avatar generation app. Users upload an image, pick a voice from HeyGen's dynamic library (or upload audio), configure video settings (resolution, aspect ratio, background, voice tuning), and generate a talking avatar video via HeyGen's v3 API.
> 
> **Deliverables**:
> - New "HeyGen" tab in the UI with full image-to-video generation flow
> - HeyGen API client (`src/lib/heygen.ts`)
> - 4 API routes under `/api/heygen/` (generate, status, voices, balance)
> - HeyGen tab component with voice selector, background controls, video settings
> - Extended history service supporting HeyGen provider
> - Tab switcher in page.tsx (minimal changes)
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (types) → Task 3 (heygen.ts) → Task 4-7 (API routes) → Task 9-11 (UI components) → Task 12 (page.tsx integration) → Task 13 (full flow) → Final

---

## Context

### Original Request
Внедрить HeyGen как новую вкладку в сервис генерации 3D аватаров. Загрузка картинки (аватара), выбор настроек HeyGen API через интерфейс, генерация видео. Работает по аналогии с текущей реализацией Seedance, но на основе HeyGen API.

### Interview Summary
**Key Discussions**:
- **UI approach**: Отдельный таб "HeyGen" (не в гриде моделей Seedance/Kling)
- **API Key**: Новая переменная `HEYGEN_API_KEY` в `.env.local`
- **Voice selection**: Динамическая загрузка из `GET /v3/voices` с фильтрами (gender, language)
- **Audio mode**: Оба режима — TTS (текст + голос) И загрузка аудиофайла
- **Background**: Полный контроль — удаление фона + кастомный цвет/URL изображения
- **Tests**: Без unit-тестов, agent QA (Playwright + curl)
- **Video settings**: Resolution (720p/1080p/4k), Aspect ratio (16:9/9:16)

**Research Findings**:
- Current page.tsx is **923 lines** with ~30 useState hooks — HeyGen MUST be a separate component
- HeyGen image-to-video has NO emotion/camera/lighting/dynamism controls (unlike Seedance)
- `output_format` (mp4/webm) is likely NOT a request parameter — excluded from scope
- HeyGen voices are paginated (20/page, max 100) — use single 100-item fetch with filters
- HeyGen billing uses `GET /v3/users/me` (different from KIE credits)

### Metis Review
**Identified Gaps** (addressed):
- **output_format not a request param**: Verified against OpenAPI schema — removed from scope
- **Voice pagination complexity**: Locked to single 100-item request, no UI pagination
- **Background image upload**: Locked to color picker + URL input only, no file upload for bg
- **Voice preview audio**: Excluded from MVP
- **Tab state persistence**: Must survive tab switching
- **Concurrent generation**: Both tabs can poll independently

### Momus Review (Round 1)
**Issues Raised**:
1. ~~API uses v2 endpoints~~ — **INCORRECT**: Official docs at https://developers.heygen.com/image-to-video-1 confirm v3 endpoints (`POST /v3/videos` with `type: "image"`, `GET /v3/videos/{id}`, `GET /v3/voices`)
2. **Tab state persistence**: Component unmounts on tab switch → state lost. **FIXED**: Both tabs rendered simultaneously, inactive hidden via CSS (`display: none` / `hidden` class), NOT conditional rendering
3. **QA scenarios use placeholders**: Some curl commands use fake data. **FIXED**: Task 4/6 QA scenarios now use real voice ID fetch step, concrete curl commands, and accept graceful error responses for invalid test data

**Confirmed API Contract** (verified from official docs 2026-04-15):
- Create: `POST https://api.heygen.com/v3/videos` with `type: "image"` — returns `{ data: { video_id } }`
- Status: `GET https://api.heygen.com/v3/videos/{video_id}` — returns `{ data: { status, video_url?, thumbnail_url?, failure_message? } }`
- Voices: `GET https://api.heygen.com/v3/voices?gender=&language=&limit=100` — returns voices array
- Balance: `GET https://api.heygen.com/v3/users/me` — returns billing info
- Auth header: `x-api-key: YOUR_API_KEY`
- **page.tsx size**: HeyGen tab extracted to separate component, max ~50 lines added to page.tsx

---

## Work Objectives

### Core Objective
Integrate HeyGen's Image-to-Video API as an isolated vertical slice: new component, new lib, new API routes, minimal page.tsx changes (tab switcher only).

### Concrete Deliverables
- `src/types/heygen.ts` — TypeScript interfaces
- `src/constants/heygen.ts` — Constants, limits, error messages
- `src/lib/heygen.ts` — API client (createVideo, pollStatus, listVoices, getBalance)
- `src/app/api/heygen/generate/route.ts` — POST create video task
- `src/app/api/heygen/status/route.ts` — GET poll video status
- `src/app/api/heygen/voices/route.ts` — GET list voices with filters
- `src/app/api/heygen/balance/route.ts` — GET HeyGen balance
- `src/components/voice-selector.tsx` — Voice dropdown with filters
- `src/components/background-selector.tsx` — Background controls
- `src/components/heygen-tab.tsx` — Full HeyGen tab component
- `src/app/page.tsx` — Updated with tab switcher (minimal changes)
- `src/lib/history-service.ts` — Extended with HeyGen provider support

### Definition of Done
- [x] HeyGen tab renders with all settings controls
- [x] Dynamic voice library loads with gender/language filters
- [x] Image upload → generate → poll → display video works end-to-end
- [x] Both audio modes work (TTS + file upload)
- [x] Background controls work (remove + custom color/image URL)
- [x] Voice tuning (speed/pitch) applied correctly
- [x] History records HeyGen generations correctly
- [x] Tab state persists when switching between tabs
- [x] Existing Seedance/Kling functionality untouched
- [x] `npm run build` passes with zero errors

### Must Have
- Complete HeyGen image-to-video generation flow
- Dynamic voice library from HeyGen API
- Both audio modes (TTS script + voice / audio file upload)
- Background controls (remove + custom color + image URL)
- Voice tuning (speed 0.5-1.5, pitch -50 to +50)
- Resolution selector (720p/1080p/4k), Aspect ratio (16:9/9:16)
- HeyGen balance display
- History integration with HeyGen provider
- Tab state persistence across tab switches
- Client-side input validation (max file sizes, formats, char limits)
- Russian error messages for HeyGen API errors
- Graceful degradation when HEYGEN_API_KEY not set

### Must NOT Have (Guardrails)
- **MUST NOT** modify existing files: `kie.ts`, `prompt-builder.ts`, `tts.ts`, `models.ts`, `presets.ts`
- **MUST NOT** modify existing API routes: `/api/generate`, `/api/status`, `/api/credits`, `/api/tts`
- **MUST NOT** add HeyGen to `AI_MODELS[]` array or model selector grid
- **MUST NOT** use `prompt-builder.ts` for HeyGen (it doesn't use text prompts)
- **MUST NOT** add voice preview/playback audio
- **MUST NOT** add voice favorites or search-as-you-type
- **MUST NOT** add background image file upload (URL input only)
- **MUST NOT** add `motion_prompt` or `expressiveness` (not for image-to-video)
- **MUST NOT** add `output_format` selector (likely not a request param)
- **MUST NOT** add pagination UI for voices (single 100-item fetch)
- **MUST NOT** add more than ~50 lines to page.tsx
- **MUST NOT** use `as any` or `@ts-ignore` anywhere

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (no test framework configured)
- **Automated tests**: None
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Build**: Use Bash — `npm run build` must pass

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - all independent, MAX PARALLEL):
├── Task 1: HeyGen TypeScript types [quick]
├── Task 2: HeyGen constants [quick]
├── Task 3: HeyGen API client lib [quick]
├── Task 4: API route - voices [quick]
├── Task 5: API route - balance [quick]
├── Task 6: API route - generate [quick]
├── Task 7: API route - status [quick]
└── Task 8: Extend history-service for HeyGen [quick]

Wave 2 (UI Components - depends on Wave 1):
├── Task 9: Voice selector component (depends: 1, 4) [visual-engineering]
├── Task 10: Background selector component (depends: 1) [visual-engineering]
├── Task 11: HeyGen tab main component (depends: 1, 2, 3, 9, 10) [deep]
└── Task 12: Update page.tsx - tab switcher (depends: 11, 8) [quick]

Wave 3 (Integration + Polish):
└── Task 13: Full flow integration + build verification (depends: ALL) [deep]

Wave FINAL (4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T3 → T6 → T11 → T12 → T13 → FINAL
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 8 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 3, 4, 6, 9, 10, 11 | 1 |
| 2 | - | 11 | 1 |
| 3 | 1 | 6, 7, 11 | 1 |
| 4 | 1 | 9 | 1 |
| 5 | 1 | 11 | 1 |
| 6 | 1, 3 | 11, 13 | 1 |
| 7 | 1, 3 | 11, 13 | 1 |
| 8 | - | 12 | 1 |
| 9 | 1, 4 | 11 | 2 |
| 10 | 1 | 11 | 2 |
| 11 | 1, 2, 3, 9, 10 | 12 | 2 |
| 12 | 8, 11 | 13 | 2 |
| 13 | ALL | FINAL | 3 |

### Agent Dispatch Summary

- **Wave 1**: **8 tasks** — T1-T3 → `quick`, T4-T8 → `quick`
- **Wave 2**: **4 tasks** — T9-T10 → `visual-engineering`, T11 → `deep`, T12 → `quick`
- **Wave 3**: **1 task** — T13 → `deep`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. HeyGen TypeScript Types & Interfaces

  **What to do**:
  - Create `src/types/heygen.ts` with all TypeScript interfaces for HeyGen integration
  - Define `HeyGenImageInput` (discriminated union: url | asset_id | base64)
  - Define `HeyGenVoiceSettings` ({ speed, pitch, locale })
  - Define `HeyGenBackground` (discriminated union: color | image)
  - Define `HeyGenCreateVideoRequest` — full request body for POST /v3/videos
  - Define `HeyGenCreateVideoResponse` — response from create
  - Define `HeyGenVideoStatus` — response from GET /v3/videos/{id}
  - Define `HeyGenVoice` — single voice from list endpoint
  - Define `HeyGenVoicesResponse` — response from GET /v3/voices
  - Define `HeyGenBalanceResponse` — response from GET /v3/users/me
  - Define `HeyGenError` — structured error { error: { code, message } }
  - Export all types

  **Must NOT do**:
  - Do NOT modify existing types in other files
  - Do NOT use `any` type

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pure type definitions, no logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-design`: No UI involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-8)
  - **Blocks**: Tasks 3, 4, 6, 9, 10, 11
  - **Blocked By**: None

  **References**:

  **API/Type References** (contracts to implement against):
  - HeyGen Create Video API: Request body is `{ type: "image", image: {...}, script?, voice_id?, audio_url?, title?, resolution?, aspect_ratio?, remove_background?, background?, voice_settings? }`
  - HeyGen Video Status: `{ data: { id, status: "pending"|"processing"|"completed"|"failed", video_url?, thumbnail_url?, duration?, failure_message? } }`
  - HeyGen Voice: `{ voice_id, name, language, gender, preview_audio_url }`
  - HeyGen Error: `{ error: { code: string, message: string } }`

  **Pattern References**:
  - `src/constants/models.ts:AIModel` — Example of how TypeScript interfaces are organized in this project
  - `src/lib/history-service.ts:HistoryItem` — Existing interface pattern (will be extended in Task 8)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Types file exports all required interfaces
    Tool: Bash
    Preconditions: File exists at src/types/heygen.ts
    Steps:
      1. Run: npx tsc --noEmit src/types/heygen.ts
      2. Verify no TypeScript errors
    Expected Result: Zero compilation errors
    Failure Indicators: Any TypeScript error output
    Evidence: .sisyphus/evidence/task-1-types-compile.txt

  Scenario: All expected exports are present
    Tool: Bash
    Preconditions: File exists
    Steps:
      1. Run: Select-String "export (interface|type)" src/types/heygen.ts
      2. Verify exports include: HeyGenImageInput, HeyGenVoiceSettings, HeyGenBackground, HeyGenCreateVideoRequest, HeyGenCreateVideoResponse, HeyGenVideoStatus, HeyGenVoice, HeyGenVoicesResponse, HeyGenBalanceResponse, HeyGenError
    Expected Result: At least 10 exported types/interfaces found
    Failure Indicators: Missing any expected export
    Evidence: .sisyphus/evidence/task-1-types-exports.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/types/heygen.ts`
  - Pre-commit: `npm run build`

- [x] 2. HeyGen Constants

  **What to do**:
  - Create `src/constants/heygen.ts`
  - Define `HEYGEN_RESOLUTIONS`: array of `{ value: "720p"|"1080p"|"4k", label: string }`
  - Define `HEYGEN_ASPECT_RATIOS`: array of `{ value: "16:9"|"9:16", label: string }`
  - Define `HEYGEN_VOICE_SPEED`: `{ min: 0.5, max: 1.5, default: 1, step: 0.1 }`
  - Define `HEYGEN_VOICE_PITCH`: `{ min: -50, max: 50, default: 0, step: 1 }`
  - Define `HEYGEN_LIMITS`: `{ maxImageSizeMB: 50, maxAudioSizeMB: 50, maxAudioDurationMin: 10, maxScriptLength: 5000, maxConcurrentJobs: 10 }`
  - Define `HEYGEN_PRICING`: `{ per720p: 0.05, per4k: 0.0667 }` (USD per second)
  - Define `HEYGEN_ERROR_MESSAGES`: Russian translations for key error codes (insufficient_credit, rate_limit_exceeded, invalid_parameter, unauthorized, video_not_found, voice_not_found, asset_not_found, trial_limit_exceeded)
  - Define `HEYGEN_VOICE_LANGUAGES`: array of common languages for filter dropdown (English, Spanish, French, German, Portuguese, Russian, Japanese, Korean, Chinese, etc.)
  - Define `HEYGEN_VOICE_GENDERS`: `[{ value: "male", label: "Мужской" }, { value: "female", label: "Женский" }]`
  - Define `HEYGEN_DEFAULTS`: default values for all settings (resolution: "1080p", aspectRatio: "16:9", speed: 1, pitch: 0)

  **Must NOT do**:
  - Do NOT modify `src/constants/models.ts` or `src/constants/presets.ts`
  - Do NOT add any HeyGen entries to existing model/preset arrays

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple constant definitions
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-design`: No UI involved

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-8)
  - **Blocks**: Task 11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/constants/models.ts:1-73` — Follow this file's organization pattern for constants
  - `src/constants/presets.ts` — Follow this file's pattern for preset arrays

  **External References**:
  - HeyGen pricing: Photo Avatar $0.05/sec (720p/1080p), $0.0667/sec (4k)
  - HeyGen limits: Image 50MB JPG/PNG, Audio 50MB WAV/MP3 max 10min, Script 5000 chars, 10 concurrent jobs

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Constants file has all required exports
    Tool: Bash
    Preconditions: File exists at src/constants/heygen.ts
    Steps:
      1. Run: Select-String "export const" src/constants/heygen.ts
      2. Verify exports include: HEYGEN_RESOLUTIONS, HEYGEN_ASPECT_RATIOS, HEYGEN_LIMITS, HEYGEN_PRICING, HEYGEN_ERROR_MESSAGES, HEYGEN_DEFAULTS
    Expected Result: At least 6 exported constants found
    Failure Indicators: Missing any expected export
    Evidence: .sisyphus/evidence/task-2-constants-exports.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/constants/heygen.ts`
  - Pre-commit: `npm run build`

- [x] 3. HeyGen API Client Library

  **What to do**:
  - Create `src/lib/heygen.ts` — HeyGen API client
  - Read `HEYGEN_API_KEY` from `process.env.HEYGEN_API_KEY`
  - Implement `createVideo(params: HeyGenCreateVideoRequest)`:
    - POST to `https://api.heygen.com/v3/videos`
    - Headers: `x-api-key: ${apiKey}`, `Content-Type: application/json`
    - Body must include `type: "image"` and image object
    - Return `{ video_id, status }`
    - Throw structured error if `HEYGEN_API_KEY` not set
  - Implement `getVideoStatus(videoId: string)`:
    - GET `https://api.heygen.com/v3/videos/${videoId}`
    - Return status object with `video_url`, `thumbnail_url`, `duration`, `failure_message`
  - Implement `listVoices(params?: { gender?: string, language?: string, limit?: number })`:
    - GET `https://api.heygen.com/v3/voices` with query params
    - Default limit: 100
    - Return array of voices with `voice_id`, `name`, `language`, `gender`, `preview_audio_url`
  - Implement `getBalance()`:
    - GET `https://api.heygen.com/v3/users/me`
    - Return billing info: `billing_type`, `remaining_balance` (handle all billing types: wallet/subscription/usage_based)
  - Add error handling: parse HeyGen structured errors `{ error: { code, message } }`, throw with both code and message
  - Add check: if `HEYGEN_API_KEY` not set, throw descriptive error (don't attempt API call)

  **Must NOT do**:
  - Do NOT modify `src/lib/kie.ts`
  - Do NOT import or use anything from `prompt-builder.ts`
  - Do NOT add any TTS logic (that stays in existing tts.ts)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward API client following existing kie.ts pattern
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `claude-api`: Not using Claude/Anthropic SDK

  **Parallelization**:
  - **Can Run In Parallel**: YES (depends only on Task 1 types — types are inline reference, can co-create)
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-8)
  - **Blocks**: Tasks 6, 7, 11
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/lib/kie.ts:1-103` — Follow this exact pattern for API client structure: env var reading, fetch calls, error handling, response parsing. This is the canonical pattern to replicate.
  - `src/lib/supabase.ts:1-28` — Upload function used for image/audio storage

  **API/Type References** (contracts to implement against):
  - `src/types/heygen.ts` (Task 1) — All types to use: HeyGenCreateVideoRequest, HeyGenVideoStatus, HeyGenVoice, etc.

  **External References**:
  - HeyGen Base URL: `https://api.heygen.com`
  - Auth header: `x-api-key: ${HEYGEN_API_KEY}` (lowercase)
  - Create: POST `/v3/videos` → `{ data: { video_id, status } }`
  - Status: GET `/v3/videos/{video_id}` → `{ data: { id, status, video_url?, thumbnail_url?, duration?, failure_message? } }`
  - Voices: GET `/v3/voices?gender=&language=&limit=100` → `{ data: [...voices], has_more, next_token }`
  - Balance: GET `/v3/users/me` → `{ data: { billing_type, wallet: { remaining_balance, currency } } }`
  - Errors: `{ error: { code: string, message: string } }`

  **WHY Each Reference Matters**:
  - `kie.ts` — Provides the exact fetch pattern (try/catch, response.ok check, JSON parsing) to ensure consistency
  - Types — Define the contract the client must satisfy; all return types come from Task 1

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: API client file compiles without errors
    Tool: Bash
    Preconditions: File exists at src/lib/heygen.ts, Task 1 types exist
    Steps:
      1. Run: npx tsc --noEmit src/lib/heygen.ts
    Expected Result: Zero compilation errors
    Failure Indicators: Any TypeScript error
    Evidence: .sisyphus/evidence/task-3-client-compile.txt

  Scenario: Client exports all required functions
    Tool: Bash
    Preconditions: File exists
    Steps:
      1. Run: Select-String "export (async )?function" src/lib/heygen.ts
      2. Verify: createVideo, getVideoStatus, listVoices, getBalance
    Expected Result: 4 exported functions found
    Failure Indicators: Missing any function
    Evidence: .sisyphus/evidence/task-3-client-exports.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/lib/heygen.ts`
  - Pre-commit: `npm run build`

- [x] 4. API Route — HeyGen Voices

  **What to do**:
  - Create `src/app/api/heygen/voices/route.ts`
  - Export GET handler
  - Read query params: `gender` (optional), `language` (optional), `limit` (optional, default 100)
  - Call `listVoices()` from `src/lib/heygen.ts`
  - Return `{ success: true, data: voices }` on success
  - Return `{ success: false, error: "Russian message" }` on failure
  - Handle missing `HEYGEN_API_KEY` gracefully: return `{ success: false, error: "HeyGen API ключ не настроен" }`

  **Must NOT do**:
  - Do NOT modify any existing API routes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple route handler following existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3, 5-8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References**:
  - `src/app/api/credits/route.ts` — Follow this exact pattern: simple GET route, call lib function, return { success, data/error }

  **API/Type References**:
  - `src/lib/heygen.ts` (Task 3) — `listVoices()` function
  - `src/types/heygen.ts` (Task 1) — `HeyGenVoice` type

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Voices endpoint returns voices successfully
    Tool: Bash (PowerShell)
    Preconditions: Dev server running, HEYGEN_API_KEY set
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/voices?limit=5" -Method Get`
      2. Check `$resp.success -eq $true`
      3. Check `$resp.data.Count -gt 0`
      4. Check first voice has `voice_id`, `name`, `language`, `gender` fields
    Expected Result: `{ success: true, data: [{ voice_id: "...", name: "...", ... }] }`
    Failure Indicators: success=false or empty data array
    Evidence: .sisyphus/evidence/task-4-voices-response.json

  Scenario: Voices endpoint with gender filter
    Tool: Bash (PowerShell)
    Preconditions: Dev server running
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/voices?gender=female&limit=5" -Method Get`
      2. Check all returned voices have gender="female": `$resp.data | ForEach-Object { $_.gender -eq "female" }`
    Expected Result: All voices have gender field matching filter
    Failure Indicators: Any voice with different gender
    Evidence: .sisyphus/evidence/task-4-voices-filter.json

  Scenario: Missing API key handled gracefully
    Tool: Bash (curl)
    Preconditions: To test this, the route must handle the case when HEYGEN_API_KEY env var is missing. The route code checks for the key and returns an error without calling HeyGen.
    Steps:
      1. Verify the route code in `src/app/api/heygen/voices/route.ts` contains a check: if the API client throws a "HEYGEN_API_KEY not set" error, the route catches it and returns `{ success: false, error: "HeyGen API ключ не настроен" }`
      2. Run: `curl -s http://localhost:3000/api/heygen/voices` — if HEYGEN_API_KEY IS set, this will return voices (test passes). If NOT set, verify response is `{ success: false, error: "..." }` (not HTTP 500)
    Expected Result: Always returns structured JSON response, never crashes with HTTP 500
    Failure Indicators: HTTP 500 internal server error or unhandled exception
    Evidence: .sisyphus/evidence/task-4-voices-nokey.json
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/app/api/heygen/voices/route.ts`
  - Pre-commit: `npm run build`

- [x] 5. API Route — HeyGen Balance

  **What to do**:
  - Create `src/app/api/heygen/balance/route.ts`
  - Export GET handler
  - Call `getBalance()` from `src/lib/heygen.ts`
  - Return `{ success: true, data: { billing_type, remaining_balance, currency } }` on success
  - Handle all 3 billing types: wallet (remaining_balance), subscription (credits), usage_based (spending_cap)
  - Return `{ success: false, error: "Russian message" }` on failure
  - Handle missing API key gracefully

  **Must NOT do**:
  - Do NOT modify `/api/credits/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple GET route, mirrors credits route pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-4, 6-8)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References**:
  - `src/app/api/credits/route.ts` — Follow this exact pattern

  **API/Type References**:
  - `src/lib/heygen.ts` (Task 3) — `getBalance()` function
  - HeyGen GET `/v3/users/me` → `{ data: { billing_type, wallet: { remaining_balance, currency } } }`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Balance endpoint returns billing info
    Tool: Bash (PowerShell)
    Preconditions: Dev server running, HEYGEN_API_KEY set
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/balance" -Method Get`
      2. Check `$resp.success -eq $true`
      3. Check `$resp.data.billing_type` exists
    Expected Result: `{ success: true, data: { billing_type: "wallet"|"subscription"|"usage_based", ... } }`
    Failure Indicators: success=false or missing billing_type
    Evidence: .sisyphus/evidence/task-5-balance-response.json
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/app/api/heygen/balance/route.ts`
  - Pre-commit: `npm run build`

- [x] 6. API Route — HeyGen Generate Video

  **What to do**:
  - Create `src/app/api/heygen/generate/route.ts`
  - Export POST handler
  - Parse request body with all HeyGen parameters:
    - `imageUrl` (required) — Supabase public URL of uploaded image
    - `script` (optional) — TTS text (mutually exclusive with audioUrl)
    - `voiceId` (optional) — Required when script is set
    - `audioUrl` (optional) — Direct audio URL (mutually exclusive with script)
    - `resolution` (optional, default "1080p")
    - `aspectRatio` (optional, default "16:9")
    - `removeBackground` (optional, default false)
    - `background` (optional) — { type: "color"|"image", value/url }
    - `voiceSettings` (optional) — { speed, pitch }
    - `title` (optional) — Auto-generated if not provided
  - Validate: if script provided → voiceId required. If audioUrl → no script/voiceId.
  - Construct HeyGen request body: `{ type: "image", image: { type: "url", url }, ... }`
  - Call `createVideo()` from `src/lib/heygen.ts`
  - Return `{ success: true, videoId }` on success
  - Return `{ success: false, error: "Russian message from HEYGEN_ERROR_MESSAGES" }` on failure
  - Map HeyGen error codes to Russian messages using `HEYGEN_ERROR_MESSAGES` constant

  **Must NOT do**:
  - Do NOT modify `/api/generate/route.ts`
  - Do NOT use `prompt-builder.ts` or `buildPrompt()`
  - Do NOT call KIE API

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Route handler following existing generate route pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-5, 7-8)
  - **Blocks**: Task 11, 13
  - **Blocked By**: Task 1 (types), Task 3 (heygen.ts)

  **References**:

  **Pattern References**:
  - `src/app/api/generate/route.ts:1-90` — Follow this pattern for POST route structure: parse body, validate, call lib, return result. Key differences: no prompt building, no TTS generation in this route (audio is handled client-side before calling this endpoint).

  **API/Type References**:
  - `src/lib/heygen.ts` (Task 3) — `createVideo()` function
  - `src/types/heygen.ts` (Task 1) — `HeyGenCreateVideoRequest`
  - `src/constants/heygen.ts` (Task 2) — `HEYGEN_ERROR_MESSAGES`

  **External References**:
  - HeyGen POST `/v3/videos` body: `{ type: "image", image: { type: "url", url }, script?, voice_id?, audio_url?, title?, resolution?, aspect_ratio?, remove_background?, background?, voice_settings? }`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Generate endpoint validates missing image
    Tool: Bash (PowerShell)
    Preconditions: Dev server running
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/generate" -Method Post -ContentType "application/json" -Body '{"script":"Hello"}'`
      2. Check `$resp.success -eq $false`
      3. Check `$resp.error` contains a message about missing image URL
    Expected Result: `{"success": false, "error": "..."}` with image validation error
    Failure Indicators: HTTP 500 or unhandled exception
    Evidence: .sisyphus/evidence/task-6-generate-no-image.json

  Scenario: Generate endpoint validates script+voice mutual requirement
    Tool: Bash (PowerShell)
    Preconditions: Dev server running
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/generate" -Method Post -ContentType "application/json" -Body '{"imageUrl":"https://example.com/test.jpg","script":"Hello"}'`
      2. Check `$resp.success -eq $false`
      3. Check `$resp.error` mentions voice ID is required
    Expected Result: `{"success": false, "error": "..."}` (voiceId required when script is set)
    Failure Indicators: Request passes to HeyGen API without voiceId
    Evidence: .sisyphus/evidence/task-6-generate-no-voice.json

  Scenario: Generate endpoint creates video with valid params (requires real voice ID)
    Tool: Bash (PowerShell)
    Preconditions: Dev server running, HEYGEN_API_KEY set
    Steps:
      1. Get a real voice ID: `$voiceId = (Invoke-WebRequest -Uri "http://localhost:3000/api/heygen/voices?limit=1" -UseBasicParsing | ConvertFrom-Json).data[0].voice_id`
      2. Generate video: `$body = @{imageUrl='https://storage.googleapis.com/unused-test-bucket/test-avatar.jpg'; script='Hello world'; voiceId=$voiceId; resolution='720p'; aspectRatio='16:9'} | ConvertTo-Json; $resp = Invoke-WebRequest -Uri "http://localhost:3000/api/heygen/generate" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing | ConvertFrom-Json`
      3. If `resp.success` is `true`: verify `resp.videoId` is present and non-empty
      4. If `resp.success` is `false`: verify `resp.error` contains meaningful message (image URL might be invalid — that's acceptable for this test)
    Expected Result: Either `{success: true, videoId: "..."}` or `{success: false, error: "..."}` with a clear error (not a crash)
    Failure Indicators: HTTP 500 or unhandled exception
    Evidence: .sisyphus/evidence/task-6-generate-success.json
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/app/api/heygen/generate/route.ts`
  - Pre-commit: `npm run build`

- [x] 7. API Route — HeyGen Video Status

  **What to do**:
  - Create `src/app/api/heygen/status/route.ts`
  - Export GET handler
  - Read query param: `videoId` (required)
  - Call `getVideoStatus(videoId)` from `src/lib/heygen.ts`
  - Return `{ success: true, data: { status, video_url?, thumbnail_url?, duration?, failure_message? } }`
  - Map status values: `completed` → include video_url, `failed` → include failure_message
  - Handle missing API key gracefully

  **Must NOT do**:
  - Do NOT modify `/api/status/route.ts`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple GET route, mirrors status route pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-6, 8)
  - **Blocks**: Task 11, 13
  - **Blocked By**: Task 1 (types), Task 3 (heygen.ts)

  **References**:

  **Pattern References**:
  - `src/app/api/status/route.ts:1-20` — Follow this exact pattern: GET handler, query param, call lib, return result

  **API/Type References**:
  - `src/lib/heygen.ts` (Task 3) — `getVideoStatus()` function
  - HeyGen statuses: `pending` → `processing` → `completed` | `failed`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Status endpoint returns video status for a real video ID
    Tool: Bash (PowerShell)
    Preconditions: Dev server running, HEYGEN_API_KEY set. First generate a real video to get a valid videoId:
      1. `$voices = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/voices?limit=1" -Method Get; $voiceId = $voices.data[0].voice_id`
      2. `$genBody = @{imageUrl='https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/220px-Cat_November_2010-1a.jpg'; script='Hello'; voiceId=$voiceId; resolution='720p'} | ConvertTo-Json`
      3. `$genResp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/generate" -Method Post -ContentType "application/json" -Body $genBody; $videoId = $genResp.videoId`
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/status?videoId=$videoId" -Method Get`
      2. Check `$resp.success -eq $true`
      3. Check `$resp.data.status` is one of: "pending", "processing", "completed", "failed"
    Expected Result: `{ success: true, data: { status: "..." } }`
    Failure Indicators: success=false or missing status
    Evidence: .sisyphus/evidence/task-7-status-response.json

  Scenario: Status endpoint handles missing videoId
    Tool: Bash (PowerShell)
    Preconditions: Dev server running
    Steps:
      1. Run: `$resp = Invoke-RestMethod -Uri "http://localhost:3000/api/heygen/status" -Method Get -ErrorAction SilentlyContinue`
      2. If error: check response contains error message (not HTTP 500)
    Expected Result: Structured error response (not a crash)
    Failure Indicators: HTTP 500 internal server error
    Evidence: .sisyphus/evidence/task-7-status-no-id.json
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/app/api/heygen/status/route.ts`
  - Pre-commit: `npm run build`

- [x] 8. Extend History Service for HeyGen Provider

  **What to do**:
  - Modify `src/lib/history-service.ts`
  - Add optional `provider?: 'kie' | 'heygen'` field to `HistoryItem` interface
  - Make `params` field flexible: add optional HeyGen-specific fields alongside existing Seedance fields:
    - `voiceName?: string` — Name of selected HeyGen voice
    - `removeBackground?: boolean`
    - `backgroundType?: 'color' | 'image' | 'none'`
    - `backgroundValue?: string` — Hex color or image URL
    - `voiceSpeed?: number`
    - `voicePitch?: number`
  - All new fields are OPTIONAL (additive only — existing history items unaffected)
  - No changes to existing functions' behavior — they should work as before with missing optional fields

  **Must NOT do**:
  - Do NOT break backward compatibility with existing localStorage history
  - Do NOT make any existing fields required
  - Do NOT change function signatures

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small interface extension, minimal changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-7)
  - **Blocks**: Task 12
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/history-service.ts:1-56` — Read the full file. Understand the HistoryItem interface, getHistory, addItem, updateItem, clearHistory functions. Only add optional fields to the interface.

  **WHY This Reference Matters**: Must preserve exact existing structure — any breaking change corrupts existing user history in localStorage.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: History service compiles without errors
    Tool: Bash
    Preconditions: Changes applied
    Steps:
      1. Run: npx tsc --noEmit src/lib/history-service.ts
    Expected Result: Zero compilation errors
    Failure Indicators: Any TypeScript error
    Evidence: .sisyphus/evidence/task-8-history-compile.txt

  Scenario: Existing history items still work (backward compatibility)
    Tool: Bash
    Preconditions: Changes applied
    Steps:
      1. Verify that HistoryItem interface has all original required fields unchanged
      2. Verify all new fields are optional (have ?)
      3. Run: Select-String "provider\?" src/lib/history-service.ts (should find optional provider field)
    Expected Result: All original fields present, new fields are optional
    Failure Indicators: Missing original field or required new field
    Evidence: .sisyphus/evidence/task-8-history-backward.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(heygen): add types, constants, API client, and routes`
  - Files: `src/lib/history-service.ts`
  - Pre-commit: `npm run build`

- [x] 9. Voice Selector Component

  **What to do**:
  - Create `src/components/voice-selector.tsx` — "use client" component
  - Props: `{ selectedVoiceId: string | null, onVoiceSelect: (voiceId: string, voiceName: string) => void }`
  - State: `voices: HeyGenVoice[]`, `loading: boolean`, `error: string | null`, `genderFilter: string`, `languageFilter: string`
  - On mount: fetch voices from `/api/heygen/voices` with default params
  - Render filter row: Gender dropdown (Все / Мужской / Женской) + Language dropdown (from `HEYGEN_VOICE_LANGUAGES`)
  - When filter changes: re-fetch voices with new params
  - Render voice list: scrollable list/grid of voice cards, each showing name, language, gender badge
  - Selected voice highlighted with primary color (#8b5cf6)
  - Loading state: skeleton/spinner
  - Error state: error message with retry button
  - Empty state: "Голоса не найдены. Попробуйте другие фильтры"
  - Style: glassmorphism (`.glass-panel`, `.glass-input` from globals.css), consistent with existing UI

  **Must NOT do**:
  - Do NOT add voice audio preview/playback
  - Do NOT add voice favorites
  - Do NOT add search-as-you-type
  - Do NOT add pagination UI (single 100-item fetch)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with styling, filter controls, list rendering
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design and styling of the voice selector component matching existing glassmorphism theme

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 10)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (types), Task 4 (voices route)

  **References**:

  **Pattern References**:
  - `src/app/page.tsx` — Study the existing emotion/camera grid sections (~line 400-550). Follow similar card grid pattern for voice selection. Note how selected items are highlighted with purple border.
  - `src/app/globals.css:39-61` — Use `.glass-panel` and `.glass-input` CSS classes for styling

  **API/Type References**:
  - `src/types/heygen.ts` (Task 1) — `HeyGenVoice` type
  - `src/constants/heygen.ts` (Task 2) — `HEYGEN_VOICE_LANGUAGES`, `HEYGEN_VOICE_GENDERS`
  - `/api/heygen/voices` (Task 4) — Returns `{ success: true, data: HeyGenVoice[] }`

  **WHY Each Reference Matters**:
  - `page.tsx` emotion grid — Exact UI pattern to replicate for voice cards (grid of selectable items with highlight)
  - `globals.css` — Must use existing CSS utilities, not create new styling patterns

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Voice selector renders and loads voices
    Tool: Playwright
    Preconditions: Dev server running, HEYGEN_API_KEY set
    Steps:
      1. Navigate to http://localhost:3000
      2. Click HeyGen tab (selector: [data-tab="heygen"])
      3. Wait for voice selector to load (timeout: 10s)
      4. Assert voice list is visible (selector: [data-testid="voice-list"])
      5. Assert at least 1 voice card exists (selector: [data-testid="voice-card"])
    Expected Result: Voice list renders with >0 voice cards
    Failure Indicators: Empty list, loading forever, or error state
    Evidence: .sisyphus/evidence/task-9-voice-selector-loaded.png

  Scenario: Gender filter works
    Tool: Playwright
    Preconditions: Voices loaded
    Steps:
      1. Select "Женский" from gender dropdown (selector: [data-testid="voice-gender-filter"])
      2. Wait for voices to reload (timeout: 10s)
      3. Assert all visible voice cards show "female" gender badge
    Expected Result: All voices have gender="female"
    Failure Indicators: Any male voice visible
    Evidence: .sisyphus/evidence/task-9-voice-filter-gender.png

  Scenario: Voice selection highlights and calls callback
    Tool: Playwright
    Preconditions: Voices loaded
    Steps:
      1. Click first voice card (selector: [data-testid="voice-card"]:first-child)
      2. Assert it has selected styling (class contains "ring" or "border-purple")
    Expected Result: Clicked voice card is visually selected
    Failure Indicators: No visual change on click
    Evidence: .sisyphus/evidence/task-9-voice-selected.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(heygen): add UI components and tab integration`
  - Files: `src/components/voice-selector.tsx`
  - Pre-commit: `npm run build`

- [x] 10. Background Selector Component

  **What to do**:
  - Create `src/components/background-selector.tsx` — "use client" component
  - Props: `{ removeBackground: boolean, onRemoveBackgroundChange: (v: boolean) => void, background: { type: 'none' | 'color' | 'image', value?: string } | null, onBackgroundChange: (bg) => void }`
  - Render 3 background mode options in a card grid (similar to emotion grid in page.tsx):
    - **Нет** (None) — No custom background
    - **Цвет** (Color) — Shows color picker input
    - **Изображение** (Image) — Shows URL text input
  - "Удалить фон" (Remove background) checkbox above the mode selector
  - When "Цвет" selected: render `<input type="color">` with hex value
  - When "Изображение" selected: render text input for image URL with placeholder "https://example.com/bg.jpg"
  - When "Удалить фон" is ON + no custom background → sends `remove_background: true` only
  - When custom background selected → sends `background: { type: "color", value: "#hex" }` or `background: { type: "image", url: "..." }`
  - Style: glassmorphism, consistent with existing UI

  **Must NOT do**:
  - Do NOT add background image file upload (URL input only)
  - Do NOT add image preview for background URL
  - Do NOT add cropping/resizing tools

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with multiple input modes, styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Styling the background selector matching existing design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 9)
  - **Blocks**: Task 11
  - **Blocked By**: Task 1 (types)

  **References**:

  **Pattern References**:
  - `src/app/page.tsx` — Study the camera effects grid section. Follow similar 3-column card grid for background modes.
  - `src/app/globals.css:39-61` — `.glass-panel`, `.glass-input` classes

  **API/Type References**:
  - `src/types/heygen.ts` (Task 1) — `HeyGenBackground` type

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Background selector renders with all modes
    Tool: Playwright
    Preconditions: HeyGen tab visible
    Steps:
      1. Assert "Удалить фон" checkbox exists (selector: [data-testid="remove-bg-checkbox"])
      2. Assert 3 background mode cards: "Нет", "Цвет", "Изображение" (selector: [data-testid="bg-mode"])
    Expected Result: Checkbox + 3 mode cards visible
    Failure Indicators: Missing any element
    Evidence: .sisyphus/evidence/task-10-bg-selector.png

  Scenario: Color mode shows color picker
    Tool: Playwright
    Preconditions: Background selector visible
    Steps:
      1. Click "Цвет" mode card
      2. Assert color input appears (selector: input[type="color"])
    Expected Result: Color picker input visible
    Failure Indicators: No color input after clicking
    Evidence: .sisyphus/evidence/task-10-bg-color.png

  Scenario: Image mode shows URL input
    Tool: Playwright
    Preconditions: Background selector visible
    Steps:
      1. Click "Изображение" mode card
      2. Assert URL text input appears (selector: [data-testid="bg-image-url"])
    Expected Result: URL text input visible with placeholder
    Failure Indicators: No URL input after clicking
    Evidence: .sisyphus/evidence/task-10-bg-image.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(heygen): add UI components and tab integration`
  - Files: `src/components/background-selector.tsx`
  - Pre-commit: `npm run build`

- [x] 11. HeyGen Tab Main Component

  **What to do**:
  - Create `src/components/heygen-tab.tsx` — "use client" component
  - This is the MAIN HeyGen tab with ALL settings and generation logic
  
  **State management** (individual useState hooks, following page.tsx pattern):
  - Image: `imageFile`, `imagePreview`
  - Audio mode: `audioMode: "text" | "file"`, `audioFile`, `script` (textarea), `selectedVoiceId`, `selectedVoiceName`
  - Video settings: `resolution` (default "1080p"), `aspectRatio` (default "16:9")
  - Voice tuning: `voiceSpeed` (default 1), `voicePitch` (default 0)
  - Background: `removeBackground`, `backgroundType`, `backgroundValue`
  - Generation: `isGenerating`, `stepText`, `videoResult`, `timer`
  - Balance: `heygenBalance`
  
  **UI Sections (top to bottom)**:
  1. **Image Upload** — Drag-drop area with preview (copy pattern from page.tsx image upload section)
  2. **Audio Source** — Toggle "Текст в речь" / "Аудиофайл"
     - Text mode: textarea for script (max 5000 chars with counter) + `<VoiceSelector>` component
     - File mode: audio file upload (MP3/WAV, max 50MB)
  3. **Voice Tuning** — Speed slider (0.5-1.5) + Pitch slider (-50 to +50) — only visible in text mode
  4. **Video Settings** — Resolution radio buttons (720p/1080p/4k) + Aspect ratio radio buttons (16:9/9:16)
  5. **Background** — `<BackgroundSelector>` component
  6. **Generate Button** — Shows estimated cost ($0.05 × estimated duration) and "Сгенерировать"
  
  **Generation flow** (`handleGenerate` function):
  1. Validate inputs (image required, script or audio required, voiceId required when script mode)
  2. Upload image to Supabase → get public URL
  3. If audio file mode: upload audio to Supabase → get public URL
  4. POST `/api/heygen/generate` with all params
  5. Start polling `/api/heygen/status?videoId=xxx` every 5 seconds
  6. On completed: set videoResult, save to history, refresh balance
  7. On failed: show error from failure_message, update history
  
  **History integration**:
  - On generation start: `addItem({ provider: 'heygen', modelId: 'heygen/image-to-video', modelName: 'HeyGen', ... })`
  - On completed/failed: `updateItem(id, { status, resultVideoUrl, cost })`
  
  **Balance display**:
  - Fetch on mount from `/api/heygen/balance`
  - Show in header area of the tab
  - Refresh after generation completes
  
  **Input validation** (client-side):
  - Image: max 50MB, JPG/PNG only — show error if violated
  - Audio: max 50MB, MP3/WAV only — show error if violated
  - Script: counter shows chars/5000, turns red at limit, disable generate at 5001+
  
  **Cost estimation**:
  - Display "$X.XX" based on estimated duration (can't know exact, show "от $X.XX")
  - After completion: show actual cost from balance diff
  
  **Style**: Use glassmorphism (`.glass-panel`, `.glass-input`), purple accent (#8b5cf6), dark background (#09090b)

  **Must NOT do**:
  - Do NOT add emotion/camera/lighting/dynamism controls (HeyGen doesn't support these for image-to-video)
  - Do NOT add output_format selector
  - Do NOT add title input field (auto-generate)
  - Do NOT add callback URL input
  - Do NOT use prompt-builder.ts
  - Do NOT call KIE API

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Large component with complex state management, API integration, multiple sub-components, generation flow
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Complex UI component requiring consistent styling with existing app

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Tasks 9, 10)
  - **Blocks**: Task 12
  - **Blocked By**: Tasks 1, 2, 3, 9, 10

  **References**:

  **Pattern References** (CRITICAL — study these thoroughly):
  - `src/app/page.tsx` — THIS IS THE MAIN REFERENCE. Study the entire file, especially:
    - Image upload section: drag-drop, preview, file validation (~line 200-280)
    - Audio mode toggle: text vs file (~line 300-380)
    - Generation flow: `handleGenerate` function (~line 500-650)
    - Polling logic: `pollTaskStatus` function (~line 660-730)
    - Result display: video player (~line 750-820)
    - Balance display in header (~line 140-160)
    - History saving: addItem/updateItem calls within generation flow
  - `src/app/globals.css:39-61` — `.glass-panel`, `.glass-input` classes for styling

  **Component References** (sub-components to integrate):
  - `src/components/voice-selector.tsx` (Task 9) — VoiceSelector component
  - `src/components/background-selector.tsx` (Task 10) — BackgroundSelector component

  **API/Type References**:
  - `src/types/heygen.ts` (Task 1) — All HeyGen types
  - `src/constants/heygen.ts` (Task 2) — Limits, pricing, defaults
  - `src/lib/heygen.ts` (Task 3) — Not called directly (routes are), but types used
  - `src/lib/supabase.ts` — `uploadFileToSupabase()` for image/audio uploads
  - `src/lib/history-service.ts` (Task 8) — `addItem()`, `updateItem()` for history

  **External References**:
  - HeyGen API flow: POST /v3/videos → get video_id → poll GET /v3/videos/{id} → completed → video_url

  **WHY Each Reference Matters**:
  - `page.tsx` — This is essentially a "HeyGen version of page.tsx". Every section (upload, settings, generate, poll, result) must mirror the existing UX pattern exactly, just with HeyGen-specific settings instead of Seedance settings.
  - VoiceSelector/BackgroundSelector — These are rendered inside this component
  - supabase.ts — Same upload flow as current app

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: HeyGen tab renders all UI sections
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Click HeyGen tab (selector: [data-tab="heygen"])
      3. Assert image upload area exists (selector: [data-testid="heygen-image-upload"])
      4. Assert audio mode toggle exists (selector: [data-testid="heygen-audio-mode"])
      5. Assert resolution selector exists (selector: [data-testid="heygen-resolution"])
      6. Assert aspect ratio selector exists (selector: [data-testid="heygen-aspect-ratio"])
      7. Assert voice tuning sliders exist (selector: [data-testid="heygen-voice-speed"])
      8. Assert background selector exists (selector: [data-testid="heygen-background"])
      9. Assert generate button exists (selector: [data-testid="heygen-generate-btn"])
    Expected Result: All 7 UI sections visible
    Failure Indicators: Any section missing
    Evidence: .sisyphus/evidence/task-11-tab-rendered.png

  Scenario: Script character counter works
    Tool: Playwright
    Preconditions: HeyGen tab visible, audio mode = "text"
    Steps:
      1. Type "Hello world test" into script textarea (selector: [data-testid="heygen-script"])
      2. Assert character counter shows "16/5000" or similar
      3. Type 5001+ characters (use evaluate to set value)
      4. Assert counter text is red/disabled
    Expected Result: Counter updates, turns red at limit
    Failure Indicators: Counter doesn't update or stays green at limit
    Evidence: .sisyphus/evidence/task-11-script-counter.png

  Scenario: Generate validates missing image
    Tool: Playwright
    Preconditions: HeyGen tab visible, no image uploaded
    Steps:
      1. Click generate button (selector: [data-testid="heygen-generate-btn"])
      2. Assert validation error appears
    Expected Result: Error message about missing image
    Failure Indicators: No error shown, or API call attempted without image
    Evidence: .sisyphus/evidence/task-11-no-image-error.png

  Scenario: Audio mode toggle switches UI
    Tool: Playwright
    Preconditions: HeyGen tab visible
    Steps:
      1. Click "Аудиофайл" mode (selector: [data-testid="heygen-audio-file-mode"])
      2. Assert audio file upload area appears
      3. Assert script textarea is hidden
      4. Click "Текст в речь" mode (selector: [data-testid="heygen-audio-text-mode"])
      5. Assert script textarea appears
      6. Assert audio file upload is hidden
    Expected Result: UI correctly toggles between modes
    Failure Indicators: Both modes visible simultaneously or neither visible
    Evidence: .sisyphus/evidence/task-11-audio-toggle.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(heygen): add UI components and tab integration`
  - Files: `src/components/heygen-tab.tsx`
  - Pre-commit: `npm run build`

- [x] 12. Update page.tsx — Tab Switcher Integration

  **What to do**:
  - Modify `src/app/page.tsx` to add tab switching between existing content and HeyGen tab
  - Add new state: `activeTab: "seedance" | "heygen"` (default "seedance")
  - Add tab bar UI at the top of the main content area (below header):
    - Two tab buttons: "Seedance / Kling" and "HeyGen"
    - Active tab highlighted with purple underline (#8b5cf6)
    - Use Framer Motion for smooth tab transitions
  - **CRITICAL — State Persistence Strategy**: Render BOTH tab contents simultaneously but hide the inactive one with CSS (`className={activeTab === "seedance" ? "" : "hidden"}`). Do NOT use conditional rendering (`{activeTab === "seedance" && ...}`) — that would unmount the component and lose all state (form values, uploaded images, polling). Both `<HeyGenTab />` and the existing Seedance content must stay mounted at all times.
  - Wrap existing Seedance content in a `<div>` that hides when `activeTab !== "seedance"` using `hidden` class or `style={{ display: activeTab === "seedance" ? "block" : "none" }}`
  - Render `<HeyGenTab />` in a `<div>` that hides when `activeTab !== "heygen"` using same approach
  - Import `HeyGenTab` from `src/components/heygen-tab.tsx`
  - The header (balance, history button) remains shared across tabs
  - History modal should show items from both providers (existing KIE + new HeyGen items)
  - Add data attributes for Playwright selectors: `data-tab="seedance"`, `data-tab="heygen"`
  
  **MINIMAL CHANGES to page.tsx**:
  - Add `activeTab` state (~1 line)
  - Add tab bar JSX (~15-20 lines)
  - Wrap existing content in hidden div (~5 lines)
  - Add HeyGenTab hidden div (~3 lines)
  - Add import (~1 line)
  - Total: ~25-35 lines added to page.tsx

  **Must NOT do**:
  - Do NOT add more than ~50 lines to page.tsx
  - Do NOT modify any existing functionality
  - Do NOT remove or restructure existing code
  - Do NOT change existing Seedance/Kling generation flow

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, targeted changes to add tab switching
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Tab switcher is simple enough without specialized design skill

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 11)
  - **Blocks**: Task 13
  - **Blocked By**: Task 8 (history), Task 11 (heygen-tab component)

  **References**:

  **Pattern References**:
  - `src/app/page.tsx:1-923` — Read the FULL file. Understand where to insert the tab bar (after header, before main content grid). Identify the exact JSX that needs conditional wrapping.
  - `src/app/globals.css:39-61` — Use `.glass-panel` for tab bar styling

  **Component References**:
  - `src/components/heygen-tab.tsx` (Task 11) — Import and render this

  **API/Type References**:
  - `src/lib/history-service.ts` (Task 8) — History now has `provider` field for filtering

  **WHY Each Reference Matters**:
  - `page.tsx` — Must understand exact insertion points. The existing 923-line file must be modified surgically without breaking anything.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tab bar renders with both tabs
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Assert tab bar exists (selector: [data-testid="tab-bar"])
      3. Assert "Seedance / Kling" tab exists (selector: [data-tab="seedance"])
      4. Assert "HeyGen" tab exists (selector: [data-tab="heygen"])
    Expected Result: Both tabs visible
    Failure Indicators: Missing tab bar or any tab
    Evidence: .sisyphus/evidence/task-12-tab-bar.png

  Scenario: Tab switching works
    Tool: Playwright
    Preconditions: On page
    Steps:
      1. Click HeyGen tab (selector: [data-tab="heygen"])
      2. Assert HeyGen content is visible (selector: [data-testid="heygen-image-upload"])
      3. Assert Seedance model grid is NOT visible
      4. Click Seedance tab (selector: [data-tab="seedance"])
      5. Assert Seedance model grid IS visible
      6. Assert HeyGen content is NOT visible
    Expected Result: Tabs switch content correctly
    Failure Indicators: Content doesn't change or both visible
    Evidence: .sisyphus/evidence/task-12-tab-switch.png

  Scenario: Tab state persists form values
    Tool: Playwright
    Preconditions: HeyGen tab visible. A test image exists at `.sisyphus/test-avatar.jpg` — create it before running: `Add-Type -AssemblyName System.Drawing; $bmp = New-Object System.Drawing.Bitmap(100,100); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.Clear([System.Drawing.Color]::Blue); $g.Dispose(); $bmp.Save("$PWD\.sisyphus\test-avatar.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg); $bmp.Dispose()`
    Steps:
      1. Upload test image to HeyGen tab: `page.locator('[data-testid="heygen-image-upload"] input').setInputFiles('.sisyphus/test-avatar.jpg')`
      2. Type "Test script for persistence" in textarea (selector: [data-testid="heygen-script"])
      3. Select the first voice in the list (selector: [data-testid="voice-card"]:first-child)
      4. Click Seedance tab (selector: [data-tab="seedance"])
      5. Wait 1 second
      6. Click HeyGen tab (selector: [data-tab="heygen"])
      7. Assert image preview is still visible (selector: [data-testid="heygen-image-preview"])
      8. Assert script textarea value equals "Test script for persistence"
      9. Assert a voice card still has selected styling
    Expected Result: All form state (image, script, voice) preserved after tab switch
    Failure Indicators: Form reset, empty textarea, missing image preview, no selected voice
    Evidence: .sisyphus/evidence/task-12-state-persist.png

  Scenario: Existing Seedance functionality still works
    Tool: Playwright
    Preconditions: Seedance tab active
    Steps:
      1. Assert model grid shows 3 models (Seedance 2.0 Fast, Kling Standard, Kling Pro)
      2. Assert image upload area exists
      3. Assert emotion grid exists (selector with "neutral" text)
      4. Assert generate button exists
    Expected Result: All existing Seedance UI intact
    Failure Indicators: Any missing element
    Evidence: .sisyphus/evidence/task-12-seedance-intact.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(heygen): add UI components and tab integration`
  - Files: `src/app/page.tsx`
  - Pre-commit: `npm run build`

- [x] 13. Full Flow Integration + Build Verification

  **What to do**:
  - Verify the complete end-to-end flow works: Image upload → settings → generate → poll → display video
  - Run `npm run build` and fix any compilation errors
  - Run `npm run lint` and fix any lint errors
  - Verify tab switching preserves state correctly
  - Verify HeyGen generations appear in history modal
  - Verify existing Seedance/Kling generation still works
  - Fix any TypeScript errors, unused imports, or missing dependencies
  - Ensure `HEYGEN_API_KEY` missing scenario is handled gracefully (no crashes)
  - Test concurrent polling: start HeyGen generation → switch to Seedance tab → both still work
  
  **Specific checks**:
  1. `npm run build` passes with zero errors
  2. HeyGen tab → upload image → select voice → click generate → poll starts → video displays
  3. HeyGen tab → upload image → upload audio → click generate → works
  4. Background controls: remove bg, custom color, custom image URL all send correct params
  5. Voice speed/pitch sliders affect generation
  6. Resolution/aspect ratio selection works
  7. Script character counter and validation work
  8. Cost estimation displays correctly
  9. History records HeyGen items with correct params
  10. Balance displays and refreshes after generation
  11. Tab switch preserves all form state
  12. No console errors in browser

  **Must NOT do**:
  - Do NOT add new features — only fix integration issues
  - Do NOT modify existing Seedance/Kling functionality
  - Do NOT add any code not specified in the plan

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex integration testing and debugging across multiple files
  - **Skills**: [`playwright`, `webapp-testing`]
    - `playwright`: Browser automation for full flow testing
    - `webapp-testing`: Testing local web app interactions

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after ALL previous tasks)
  - **Blocks**: Final Wave
  - **Blocked By**: ALL tasks (1-12)

  **References**:

  **Pattern References**:
  - `src/app/page.tsx` — Existing generation flow to compare against
  - All files created in Tasks 1-12

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full build passes
    Tool: Bash (PowerShell)
    Preconditions: All code written
    Steps:
      1. Run: `npm run build`
      2. Verify exit code 0
    Expected Result: Build succeeds with zero errors
    Failure Indicators: Any build error
    Evidence: .sisyphus/evidence/task-13-build.txt

  Scenario: Full generation flow end-to-end
    Tool: Playwright
    Preconditions: Dev server running, HEYGEN_API_KEY set. Test image at `.sisyphus/test-avatar.jpg` (see Task 12 for creation command)
    Steps:
      1. Navigate to http://localhost:3000
      2. Click HeyGen tab
      3. Upload test image: `page.locator('[data-testid="heygen-image-upload"] input').setInputFiles('.sisyphus/test-avatar.jpg')`
      4. Ensure audio mode is "text"
      5. Type "Hello, this is a test" in script textarea
      6. Select a voice from voice list
      7. Set resolution to "720p"
      8. Click generate button
      9. Wait for polling to show status updates (timeout: 120s)
      10. Verify either video appears or error message displays
    Expected Result: Generation completes (success or clear error message)
    Failure Indicators: Infinite loading, crash, or silent failure
    Evidence: .sisyphus/evidence/task-13-full-flow.png

  Scenario: HeyGen item in history
    Tool: Playwright
    Preconditions: After a HeyGen generation attempt
    Steps:
      1. Click history button (selector: [data-testid="history-button"])
      2. Assert history modal opens
      3. Assert at least one item shows "HeyGen" as provider/model
    Expected Result: HeyGen item visible in history
    Failure Indicators: No HeyGen items or history modal broken
    Evidence: .sisyphus/evidence/task-13-history.png

  Scenario: No regression in Seedance tab
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Click Seedance tab
      2. Verify model grid renders 3 models
      3. Verify image upload works
      4. Verify emotion/camera grids render
    Expected Result: All existing Seedance features work unchanged
    Failure Indicators: Any broken Seedance functionality
    Evidence: .sisyphus/evidence/task-13-seedance-regression.png

  Scenario: HEYGEN_API_KEY missing graceful handling
    Tool: Bash + Playwright
    Preconditions: HEYGEN_API_KEY not in environment
    Steps:
      1. Start dev server without HEYGEN_API_KEY
      2. Navigate to HeyGen tab
      3. Verify page renders (no crash)
      4. Attempt voice fetch — verify error message displayed
      5. Verify Seedance tab still works
    Expected Result: HeyGen tab shows error, Seedance tab unaffected
    Failure Indicators: Page crash or Seedance broken
    Evidence: .sisyphus/evidence/task-13-no-key.png
  ```

  **Commit**: YES
  - Message: `feat(heygen): full flow integration and polish`
  - Files: Any files with integration fixes
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle` ✅ APPROVE
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search ONLY newly created/modified HeyGen files (`src/types/heygen.ts`, `src/constants/heygen.ts`, `src/lib/heygen.ts`, `src/components/heygen-tab.tsx`, `src/components/voice-selector.tsx`, `src/components/background-selector.tsx`, `src/app/api/heygen/**`, changes to `src/app/page.tsx`, changes to `src/lib/history-service.ts`) for forbidden patterns — ignore pre-existing violations in untouched files like `tts.ts` or `kie.ts`. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high` ✅ APPROVE
  Run `npm run build`. Run `npx eslint src/types/heygen.ts src/constants/heygen.ts src/lib/heygen.ts src/components/heygen-tab.tsx src/components/voice-selector.tsx src/components/background-selector.tsx src/app/api/heygen/** --no-error-on-unmatched-pattern` to lint ONLY HeyGen-touched files (baseline lint errors in untouched files like `kie.ts`, `tts.ts`, `page.tsx` are pre-existing and out of scope). Review all HeyGen files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint (HeyGen files) [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill) ✅ APPROVE
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (HeyGen tab + KIE tab working together). Test edge cases: empty state, invalid input, rapid tab switching. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep` ✅ APPROVE
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Tasks | Message | Files | Pre-commit |
|------------|---------|-------|------------|
| Wave 1 (T1-T8) | `feat(heygen): add types, constants, API client, and routes` | `src/types/heygen.ts`, `src/constants/heygen.ts`, `src/lib/heygen.ts`, `src/app/api/heygen/*/route.ts`, `src/lib/history-service.ts` | `npm run build` |
| Wave 2 (T9-T12) | `feat(heygen): add UI components and tab integration` | `src/components/*.tsx`, `src/app/page.tsx` | `npm run build` |
| Wave 3 (T13) | `feat(heygen): full flow integration and polish` | affected files | `npm run build` |

---

## Success Criteria

### Verification Commands (PowerShell)
```powershell
npm run build          # Expected: Build succeeds with zero errors

# Voices endpoint returns data
(Invoke-WebRequest -Uri "http://localhost:3000/api/heygen/voices?limit=5" -UseBasicParsing | ConvertFrom-Json).success
# Expected: True

# Balance endpoint returns data
(Invoke-WebRequest -Uri "http://localhost:3000/api/heygen/balance" -UseBasicParsing | ConvertFrom-Json).success
# Expected: True

# Status endpoint handles requests
(Invoke-WebRequest -Uri "http://localhost:3000/api/heygen/status?videoId=invalid" -UseBasicParsing | ConvertFrom-Json).success
# Expected: True (with status data from HeyGen API)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build passes with zero errors
- [ ] HeyGen tab renders and functions correctly
- [ ] Existing Seedance/Kling functionality untouched
- [ ] No `as any` or `@ts-ignore` in new code
