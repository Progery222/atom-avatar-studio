# Add GPT Image 2 Generation Tab with Tab Reorganization

## TL;DR

> **Quick Summary**: Add a new "Картинки" (Images) category tab with GPT Image 2 generation (Text-to-Image + Image-to-Image) via KIE.ai API, reorganize existing Seedance/HeyGen tabs under a "Видео" (Video) category, and implement credit estimation with constraint validation.
>
> **Deliverables**:
> - New `gpt-image-tab.tsx` component with Text-to-Image and Image-to-Image modes
> - GPT Image 2 API integration (createTask → poll status → display result)
> - 2-level category tab system (Видео / Картинки)
> - Credit estimation + balance display before generation
> - Aspect ratio / resolution constraint validation with warnings
> - History integration for image generation entries
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1-2 → Task 5-7 → Task 8-9 → Task 10

---

## Context

### Original Request
Reorganize existing Seedance/HeyGen tabs under a "Видео" category, add a new "Картинки" category with GPT Image 2 generation supporting Text-to-Image and Image-to-Image modes. Include resolution/aspect ratio settings with credit cost estimation.

### Interview Summary
**Key Discussions**:
- Tab organization: 2-level category tabs (Видео/Картинки) with sub-tabs
- Mode switching: Toggle/tabs inside Картинки for Text-to-Image vs Image-to-Image
- Image storage: Supabase Storage for Image-to-Image uploads
- Credit display: Show balance + estimated cost before generation
- Test strategy: Tests after implementation

**Research Findings**:
- KIE.ai GPT Image 2 uses same async task pattern as Seedance (createTask → poll recordInfo)
- Pricing: 1K=2cr, 2K=3cr, 4K=5cr (same for both modes)
- Constraints: 1:1 aspect ratio cannot be 4K; auto only supports 1K
- Images returned as URLs in resultJson.resultUrls (not base64)

### Metis Review
**Identified Gaps** (addressed):
- Corrected assumption about OpenAI direct API → using KIE.ai proxy (async pattern)
- HistoryItem type needs extending for image results
- Constraint validation for aspect_ratio + resolution combinations
- 4K should be marked experimental
- Image upload flow for Image-to-Image mode (Supabase Storage)

---

## Work Objectives

### Core Objective
Add GPT Image 2 image generation capability to the app with a new "Картинки" tab, reorganize existing video tabs under "Видео" category, and provide transparent credit cost estimation.

### Concrete Deliverables
- `src/types/gpt-image.ts` — TypeScript types for GPT Image API
- `src/constants/gpt-image.ts` — Constants (aspect ratios, resolutions, pricing, limits)
- `src/lib/gpt-image.ts` — API client for KIE.ai GPT Image 2 endpoints
- `src/app/api/gpt-image/generate/route.ts` — Generate endpoint (both modes)
- `src/app/api/gpt-image/status/route.ts` — Status polling endpoint
- `src/app/api/gpt-image/credits/route.ts` — Credits balance endpoint
- `src/components/gpt-image-tab.tsx` — Full tab component with both modes
- Updated `src/app/page.tsx` — 2-level category tab system
- Updated `src/lib/history-service.ts` — Extended for image results
- Tests for API client and key component behaviors

### Definition of Done
- [ ] `npx next build` exits 0
- [ ] `npx tsc --noEmit` exits 0
- [ ] Tab bar shows "Видео" / "Картинки" categories
- [ ] Clicking "Видео" → Seedance/HeyGen sub-tabs work unchanged
- [ ] Clicking "Картинки" → Text-to-Image / Image-to-Image sub-tabs
- [ ] Text-to-Image: prompt → settings → generate → result image displayed
- [ ] Image-to-Image: upload + prompt → generate → result displayed
- [ ] Credit estimation updates dynamically based on resolution selection
- [ ] Constraint validation prevents invalid combinations (1:1 + 4K, auto + 4K)
- [ ] History tracks image generation entries

### Must Have
- Text-to-Image generation with prompt input
- Image-to-Image generation with image upload + prompt
- Aspect ratio selector (auto, 1:1, 9:16, 16:9, 4:3, 3:4)
- Resolution selector (1K, 2K, 4K)
- Credit cost estimation based on resolution
- Current credit balance display
- Constraint warnings (1:1 + 4K invalid, auto + only 1K)
- Async task polling with progress indication
- Result image display with download option
- History integration for image entries

### Must NOT Have (Guardrails)
- No direct OpenAI API calls (use KIE.ai proxy only)
- No synchronous response handling (use async createTask → poll pattern)
- No base64 image handling (KIE returns URLs)
- No separate history system (extend existing history-service)
- No over-abstracted component hierarchy (single tab component like heygen-tab.tsx)
- No CSS framework changes (use existing glass-panel/glass-input system)
- No new npm dependencies unless absolutely necessary
- No transparent/background removal features (not supported by gpt-image-2)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Next.js build + TypeScript compiler)
- **Automated tests**: YES (tests after implementation)
- **Framework**: Jest/Vitest (follow existing project setup)
- **If TDD**: N/A — tests after

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API**: Use Bash (curl) — Send requests, assert status + response fields

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: Types & constants for GPT Image [quick]
├── Task 2: GPT Image API client [quick]
├── Task 3: Extend history-service for image entries [quick]
└── Task 4: Credits API route [quick]

Wave 2 (After Wave 1 — core modules, MAX PARALLEL):
├── Task 5: Generate API route (depends: 1, 2) [unspecified-high]
├── Task 6: Status API route (depends: 2) [quick]
└── Task 7: GPT Image tab component (depends: 1, 2, 3) [visual-engineering]

Wave 3 (After Wave 2 — integration + tab reorganization):
├── Task 8: Tab reorganization in page.tsx (depends: 7) [deep]
└── Task 9: Constraint validation & credit estimation UI (depends: 7) [visual-engineering]

Wave 4 (After Wave 3 — tests):
└── Task 10: Integration tests (depends: 5, 6, 7, 8) [unspecified-high]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high + playwright)
└── Task F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 5 → Task 7 → Task 8 → Task 10 → F1-F4
Parallel Speedup: ~50% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | - | 5, 7 |
| 2 | - | 5, 6, 7 |
| 3 | - | 7 |
| 4 | - | - |
| 5 | 1, 2 | 10 |
| 6 | 2 | 10 |
| 7 | 1, 2, 3 | 8, 9, 10 |
| 8 | 7 | 10 |
| 9 | 7 | 10 |
| 10 | 5, 6, 7, 8 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1-T3 → `quick`, T4 → `quick`
- **Wave 2**: 3 tasks — T5 → `unspecified-high`, T6 → `quick`, T7 → `visual-engineering`
- **Wave 3**: 2 tasks — T8 → `deep`, T9 → `visual-engineering`
- **Wave 4**: 1 task — T10 → `unspecified-high`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Types & Constants for GPT Image

  **What to do**:
  - Create `src/types/gpt-image.ts` with TypeScript types: `GptImageAspectRatio`, `GptImageResolution`, `GptImageGenerationMode`, `GptImageGenerateRequest`, `GptImageTaskResponse`, `GptImageTaskStatus`, `GptImageResult`, `GptImageCredits`
  - Create `src/constants/gpt-image.ts` with: `GPT_IMAGE_ASPECT_RATIOS` (auto, 1:1, 9:16, 16:9, 4:3, 3:4 with labels and descriptions), `GPT_IMAGE_RESOLUTIONS` (1K, 2K, 4K with labels and pixel sizes), `GPT_IMAGE_PRICING` ({ '1K': 2, '2K': 3, '4K': 5 } credits per image), `GPT_IMAGE_CONSTRAINTS` (1:1 cannot be 4K, auto only supports 1K), `GPT_IMAGE_MODELS` ({ 'text-to-image': 'gpt-image-2-text-to-image', 'image-to-image': 'gpt-image-2-image-to-image' }), `GPT_IMAGE_DEFAULTS` ({ aspectRatio: 'auto', resolution: '1K' }), `GPT_IMAGE_ERROR_MESSAGES` (Russian localized messages)
  - Follow the pattern from `src/constants/heygen.ts` for structure

  **Must NOT do**:
  - Do not create separate files per type — keep all GPT Image types in one file
  - Do not use `as any` or `@ts-ignore`
  - Do not add constants for features not in scope (e.g., transparent background, inpainting)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Pure type/interface definition — simple, no visual or complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/constants/heygen.ts` — Constant definition pattern (structure, naming, exports)
  - `src/types/heygen.ts` or inline types in heygen-tab.tsx — Type definition pattern

  **API/Type References** (contracts to implement against):
  - KIE.ai API docs: Text-to-Image params: model=`gpt-image-2-text-to-image`, input.prompt (max 20000), input.aspect_ratio (`auto|1:1|9:16|16:9|4:3|3:4`), input.resolution (`1K|2K|4K`)
  - KIE.ai API docs: Image-to-Image params: model=`gpt-image-2-image-to-image`, input.prompt, input.input_urls (string[], max 16), input.aspect_ratio, input.resolution
  - KIE.ai API response: `{code: 200, msg: "success", data: {taskId: "task_gptimage_xxx"}}`
  - KIE.ai status response: state ∈ `waiting|queuing|generating|success|fail`, resultJson = `{"resultUrls":["https://..."]}`
  - KIE.ai credits response: `{code: 200, data: <integer>}`

  **WHY Each Reference Matters**:
  - `heygen.ts` constants: Copy the exact pattern for aspect ratios, resolutions, pricing maps, error messages — ensures consistency
  - KIE.ai API docs: Types must match the exact field names and values the API expects — no mismatch

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Types and constants file structure
    Tool: Bash
    Preconditions: Project compiles
    Steps:
      1. Run: ls src/types/gpt-image.ts src/constants/gpt-image.ts
      2. Verify both files exist
      3. Run: npx tsc --noEmit
      4. Verify zero type errors
    Expected Result: Both files exist, TypeScript compilation succeeds with 0 errors
    Failure Indicators: Missing files, type errors, import failures
    Evidence: .sisyphus/evidence/task-1-types-constants.txt

  Scenario: Constraint validation logic
    Tool: Bash
    Preconditions: Constants file exists
    Steps:
      1. Read src/constants/gpt-image.ts
      2. Verify GPT_IMAGE_CONSTRAINTS contains: invalidCombos where aspect_ratio=1:1 + resolution=4K is flagged
      3. Verify GPT_IMAGE_CONSTRAINTS contains: autoResolutionLimit where auto only supports 1K
    Expected Result: Both constraint rules are defined in constants
    Failure Indicators: Missing constraint definitions, incorrect values
    Evidence: .sisyphus/evidence/task-1-constraints.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(gpt-image): add types, constants, API client, and history extension`
  - Files: `src/types/gpt-image.ts`, `src/constants/gpt-image.ts`

- [x] 2. GPT Image API Client

  **What to do**:
  - Create `src/lib/gpt-image.ts` with API client functions following the pattern from `src/lib/heygen.ts`
  - Implement `createGptImageTask(mode: 'text-to-image' | 'image-to-image', params)` — POST to `https://api.kie.ai/api/v1/jobs/createTask` with Bearer auth (KIE_API_KEY env var)
  - Implement `pollGptImageTask(taskId: string)` — GET `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=xxx` with Bearer auth
  - Implement `getGptImageCredits()` — GET `https://api.kie.ai/api/v1/chat/credit` with Bearer auth
  - Create `GptImageApiError` class extending Error (same pattern as HeyGen errors)
  - Handle all error codes: 401 unauthorized, 402 insufficient credits, 429 rate limited, 501 generation failed
  - Export all functions and error class

  **Must NOT do**:
  - Do not use synchronous response pattern — KIE.ai GPT Image 2 is async (createTask → poll)
  - Do not handle base64 responses — KIE.ai returns URLs in resultJson.resultUrls
  - Do not add retry logic beyond what the API provides (maintain simple error propagation)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple API client following established pattern, no complex logic

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Tasks 5, 6, 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/lib/heygen.ts` — API client structure, error class pattern, fetch pattern, env var access
  - `src/lib/supabase.ts` — uploadFileToSupabase pattern (for Image-to-Image uploads)

  **API/Type References** (contracts to implement against):
  - createTask endpoint: POST `https://api.kie.ai/api/v1/jobs/createTask`, body: `{model: string, input: {prompt, aspect_ratio?, resolution?, input_urls?}}`, auth: `Authorization: Bearer ${process.env.KIE_API_KEY}`
  - recordInfo endpoint: GET `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=xxx`, auth: Bearer token
  - credit endpoint: GET `https://api.kie.ai/api/v1/chat/credit`, auth: Bearer token
  - Error codes: 401, 402, 429, 500, 501, 505

  **WHY Each Reference Matters**:
  - `heygen.ts`: Copy the exact pattern for API client class, error handling, fetch calls — ensures consistency with existing code
  - KIE.ai API docs: Must match exact endpoint URLs, request/response formats, and auth headers

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: API client exports and structure
    Tool: Bash
    Preconditions: Project compiles
    Steps:
      1. Read src/lib/gpt-image.ts
      2. Verify exports: createGptImageTask, pollGptImageTask, getGptImageCredits, GptImageApiError
      3. Verify GptImageApiError extends Error
      4. Run: npx tsc --noEmit
    Expected Result: All exports present, GptImageApiError extends Error, zero type errors
    Failure Indicators: Missing exports, type errors
    Evidence: .sisyphus/evidence/task-2-api-client.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(gpt-image): add types, constants, API client, and history extension`
  - Files: `src/lib/gpt-image.ts`

- [x] 3. Extend History Service for Image Entries

  **What to do**:
  - Read `src/lib/history-service.ts` — understand `HistoryItem` type, storage mechanism, and all usages
  - Extend `HistoryItem` type with: `provider?: 'kie' | 'heygen' | 'gpt-image'`, `resultImageUrl?: string`, `generationType?: 'video' | 'image'`, `aspectRatio?: string`, `resolution?: string`
  - Ensure backward compatibility — existing video history items must continue to work without the new fields
  - Update `addItem` and `getHistory` to handle new fields
  - Use `lsp_find_references` on `HistoryItem` to find ALL usages before modifying

  **Must NOT do**:
  - Do not break existing video history — all fields must be optional additions
  - Do not change the storage key or format — just extend the type
  - Do not remove or rename existing fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Small type extension with backward compatibility, simple and well-scoped

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 7
  - **Blocked By**: None

  **References**:

  **Pattern References** (existing code to follow):
  - `src/lib/history-service.ts` — HistoryItem type definition, addItem, getHistory, clearHistory, storage keys

  **API/Type References** (contracts to implement against):
  - HistoryItem current shape: examine via `lsp_find_references` — will need `resultVideoUrl` for video, `resultImageUrl` for images
  - New fields: `provider: 'kie' | 'heygen' | 'gpt-image'`, `resultImageUrl?: string`, `generationType: 'video' | 'image'`, `aspectRatio?: string`, `resolution?: string`

  **WHY Each Reference Matters**:
  - `history-service.ts`: Must understand current type to extend without breaking — check all usages first
  - `lsp_find_references` on HistoryItem: Find every file that uses HistoryItem to ensure compatibility

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: History type extension is backward compatible
    Tool: Bash
    Preconditions: Project compiles
    Steps:
      1. Read src/lib/history-service.ts
      2. Verify HistoryItem type has: provider?, resultImageUrl?, generationType?, aspectRatio?, resolution?
      3. Verify all new fields are optional (?) — existing items without them must still work
      4. Run: npx tsc --noEmit
    Expected Result: New fields are optional, existing code compiles without type errors
    Failure Indicators: Missing fields, required new fields breaking existing code, type errors
    Evidence: .sisyphus/evidence/task-3-history-extension.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(gpt-image): add types, constants, API client, and history extension`
  - Files: `src/lib/history-service.ts`

- [x] 4. Credits API Route

  **What to do**:
  - Create `src/app/api/gpt-image/credits/route.ts` — GET endpoint that calls `getGptImageCredits()` from `src/lib/gpt-image.ts` and returns the balance
  - Follow the pattern from `src/app/api/credits/route.ts` (Seedance credits) or `src/app/api/heygen/balance/route.ts`
  - Return `{ success: true, credits: number }` on success, `{ success: false, error: string }` on failure
  - Handle KIE_API_KEY missing from env vars — return 500 with descriptive error

  **Must NOT do**:
  - Do not add caching — keep it simple like existing credits routes
  - Do not expose the API key in response payloads

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple API route following established pattern

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: None (credits route is independent, used by tab component directly)
  - **Blocked By**: None (uses getGptImageCredits which will be created in Task 2, but the route file itself only imports the function — compilation depends on it)

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/api/credits/route.ts` — Seedance credits route pattern (GET handler, error handling, response shape)
  - `src/app/api/heygen/balance/route.ts` — HeyGen balance route pattern (alternative reference)

  **API/Type References** (contracts to implement against):
  - `src/lib/gpt-image.ts:getGptImageCredits()` — Returns credit balance integer
  - KIE.ai credits endpoint: GET `https://api.kie.ai/api/v1/chat/credit`, response: `{code: 200, data: <integer>}`

  **WHY Each Reference Matters**:
  - Existing credits routes: Copy the exact pattern for response shape, error handling, and env var access
  - `gpt-image.ts`: Must import and call the correct function from the API client

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Credits API route responds correctly
    Tool: Bash (curl)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. Start dev server: npm run dev
      2. Send: curl http://localhost:3000/api/gpt-image/credits
      3. Verify response contains: { success: true/false, ... }
      4. If KIE_API_KEY is set, verify response contains credits number
    Expected Result: Route returns JSON with success boolean and credits number or error message
    Failure Indicators: 404, 500, missing success field, non-JSON response
    Evidence: .sisyphus/evidence/task-4-credits-route.txt

  Scenario: Credits API handles missing API key
    Tool: Bash (curl)
    Preconditions: Dev server running without KIE_API_KEY env var (or test with mock)
    Steps:
      1. Verify route returns error response when API key is missing
      2. Confirm response shape: { success: false, error: string }
    Expected Result: Graceful 500 error with descriptive message about missing API key
    Failure Indicators: Unhandled exception, raw error stack trace in response
    Evidence: .sisyphus/evidence/task-4-credits-error.txt
  ```

  **Commit**: YES (groups with Wave 1)
  - Message: `feat(gpt-image): add types, constants, API client, and history extension`
  - Files: `src/app/api/gpt-image/credits/route.ts`

- [x] 5. Generate API Route (Text-to-Image + Image-to-Image)

  **What to do**:
  - Create `src/app/api/gpt-image/generate/route.ts` — POST endpoint handling both Text-to-Image and Image-to-Image
  - Request body: `{ mode: 'text-to-image' | 'image-to-image', prompt: string, aspectRatio?: string, resolution?: string, inputUrls?: string[] }`
  - For text-to-image: call `createGptImageTask('text-to-image', { prompt, aspectRatio, resolution })`
  - For image-to-image: call `createGptImageTask('image-to-image', { prompt, inputUrls, aspectRatio, resolution })`
  - Validate required fields: prompt is required, mode is required, inputUrls required for image-to-image
  - Validate constraint rules: aspect_ratio '1:1' cannot have resolution '4K', aspect_ratio 'auto' only supports '1K'
  - Return `{ success: true, taskId: string }` on success, `{ success: false, error: string }` on failure
  - Follow the pattern from `src/app/api/generate/route.ts` (Seedance) for error handling and response structure
  - Handle KIE_API_KEY missing from env — return 500

  **Must NOT do**:
  - Do not make synchronous image generation calls — use async createTask pattern
  - Do not return image data in this route — only return taskId for polling
  - Do not add rate limiting (not in scope)
  - Do not combine with status polling — separate routes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: API route with validation logic and constraint rules — moderate complexity

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/api/generate/route.ts` — Seedance generate route pattern (POST handler, validation, error handling, response shape)
  - `src/app/api/heygen/generate/route.ts` — HeyGen generate route pattern (alternative reference for image upload handling)

  **API/Type References** (contracts to implement against):
  - `src/lib/gpt-image.ts:createGptImageTask()` — Called to create async task
  - `src/types/gpt-image.ts:GptImageGenerateRequest` — Request type from Task 1
  - `src/constants/gpt-image.ts:GPT_IMAGE_CONSTRAINTS` — Constraint validation rules

  **WHY Each Reference Matters**:
  - Seedance generate route: Copy pattern for POST handler, validation errors, and response shape
  - Types/constants: Must use correct request shape and constraint rules from Task 1

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Text-to-Image generation route accepts valid request
    Tool: Bash (curl)
    Preconditions: Dev server running, KIE_API_KEY set
    Steps:
      1. curl -X POST http://localhost:3000/api/gpt-image/generate -H "Content-Type: application/json" -d '{"mode":"text-to-image","prompt":"a cute cat","aspectRatio":"1:1","resolution":"1K"}'
      2. Verify response contains: { success: true, taskId: "..." }
    Expected Result: Returns success with taskId for polling
    Failure Indicators: Missing fields, validation error, 500 error
    Evidence: .sisyphus/evidence/task-5-generate-text.txt

  Scenario: Image-to-Image generation route accepts valid request
    Tool: Bash (curl)
    Preconditions: Dev server running, KIE_API_KEY set, valid image URLs in request
    Steps:
      1. curl -X POST http://localhost:3000/api/gpt-image/generate -H "Content-Type: application/json" -d '{"mode":"image-to-image","prompt":"make it watercolor","inputUrls":["https://example.com/image.jpg"],"aspectRatio":"16:9","resolution":"2K"}'
      2. Verify response contains: { success: true, taskId: "..." }
    Expected Result: Returns success with taskId
    Failure Indicators: Missing inputUrls, validation error
    Evidence: .sisyphus/evidence/task-5-generate-image.txt

  Scenario: Constraint validation rejects invalid combinations
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -X POST http://localhost:3000/api/gpt-image/generate -H "Content-Type: application/json" -d '{"mode":"text-to-image","prompt":"test","aspectRatio":"1:1","resolution":"4K"}'
      2. Verify response contains: { success: false, error: "...1:1...4K..." }
      3. curl -X POST http://localhost:3000/api/gpt-image/generate -H "Content-Type: application/json" -d '{"mode":"text-to-image","prompt":"test","aspectRatio":"auto","resolution":"4K"}'
      4. Verify response contains: { success: false, error: "...auto...1K..." }
    Expected Result: Both invalid combinations return validation errors
    Failure Indicators: Request accepted with invalid combo, generic 500 error
    Evidence: .sisyphus/evidence/task-5-validation.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(gpt-image): add API routes and tab component`
  - Files: `src/app/api/gpt-image/generate/route.ts`

- [x] 6. Status Polling API Route

  **What to do**:
  - Create `src/app/api/gpt-image/status/route.ts` — GET endpoint for polling task status
  - Accept `?taskId=xxx` query parameter
  - Call `pollGptImageTask(taskId)` from `src/lib/gpt-image.ts`
  - Return `{ success: true, state: string, resultUrls?: string[], failCode?: string, failMsg?: string }`
  - Map states: `waiting|queuing|generating` → still in progress, `success` → complete with resultUrls, `fail` → error with failCode/failMsg
  - Follow the pattern from `src/app/api/status/route.ts` (Seedance) or `src/app/api/heygen/status/route.ts`
  - Handle missing taskId parameter — return 400 with error message

  **Must NOT do**:
  - Do not add retry logic — client handles polling interval
  - Do not cache results — simple pass-through like existing status routes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: Simple GET route following established pattern

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Task 2

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/api/status/route.ts` — Seedance status polling route (GET handler, taskId parameter, response shape)
  - `src/app/api/heygen/status/route.ts` — HeyGen status polling route (alternative reference)

  **API/Type References** (contracts to implement against):
  - `src/lib/gpt-image.ts:pollGptImageTask()` — Returns task state and result data
  - KIE.ai status response: state ∈ `waiting|queuing|generating|success|fail`, resultJson on success, failCode/failMsg on failure

  **WHY Each Reference Matters**:
  - Seedance status route: Copy exact pattern for GET handler, taskId extraction, and response mapping

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Status route returns task state
    Tool: Bash (curl)
    Preconditions: Dev server running, a task has been created (from Task 5 test)
    Steps:
      1. curl http://localhost:3000/api/gpt-image/status?taskId=<valid-task-id>
      2. Verify response contains: { success: true, state: "waiting|queuing|generating|success|fail", ... }
    Expected Result: Returns current task state with appropriate fields
    Failure Indicators: 404, missing state field, non-JSON response
    Evidence: .sisyphus/evidence/task-6-status.txt

  Scenario: Status route handles missing taskId
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl http://localhost:3000/api/gpt-image/status
      2. Verify response contains: { success: false, error: "...taskId..." }
    Expected Result: Returns 400 error with descriptive message about missing taskId
    Failure Indicators: 500 error, unhandled exception
    Evidence: .sisyphus/evidence/task-6-status-error.txt
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(gpt-image): add API routes and tab component`
  - Files: `src/app/api/gpt-image/status/route.ts`

- [x] 7. GPT Image Tab Component

  **What to do**:
  - Create `src/components/gpt-image-tab.tsx` — following the pattern from `src/components/heygen-tab.tsx` (676 lines)
  - **Layout**: Two-column grid `grid-cols-1 lg:grid-cols-2 gap-6`, glass-panel styling
  - **Sub-tab toggle**: At the top, toggle between "Text-to-Image" and "Image-to-Image" using Framer Motion `layoutId="activeModel"` buttons
  - **Left column (Settings)**:
    - Mode toggle (Text-to-Image / Image-to-Image)
    - Prompt textarea (max 20000 chars, with char counter)
    - For Image-to-Image mode: image upload area (drag & drop, click to browse, max 16 images), upload to Supabase Storage via `uploadFileToSupabase`
    - Aspect ratio selector: grid of buttons for `auto, 1:1, 9:16, 16:9, 4:3, 3:4` with visual preview thumbnails
    - Resolution selector: buttons for `1K, 2K, 4K` (4K marked with ⚠️ experimental label)
    - Constraint validation: disable 4K when aspect ratio is 1:1; show warning when auto + non-1K
    - Credit estimate display: "Примерная стоимость: X кредитов" based on selected resolution, dynamic update
    - Credit balance display: fetch from `/api/gpt-image/credits`, show "Баланс: Y кредитов"
    - Generate button: disabled when prompt empty or invalid constraints, shows loading spinner during generation
  - **Right column (Result)**:
    - Loading state: spinning indicator with progress text ("Генерация изображения..." with polling status)
    - Error state: red error message with retry button
    - Success state: display generated image in full width, with download button
    - Image preview for Image-to-Image mode: show uploaded reference images
  - **State management**:
    - `mode: 'text-to-image' | 'image-to-image'`
    - `prompt: string`
    - `aspectRatio: string` (default 'auto')
    - `resolution: string` (default '1K')
    - `uploadedImages: File[]` with preview URLs
    - `isGenerating: boolean`
    - `taskId: string | null`
    - `resultImageUrl: string | null`
    - `error: string | null`
    - `credits: number | null`
  - **Generation flow**: Validate → POST `/api/gpt-image/generate` → poll `/api/gpt-image/status` every 5s → display result
  - **History**: Save to `historyService.addItem()` after successful generation with `provider: 'gpt-image'`, `generationType: 'image'`
  - **All UI text in Russian** (matching existing app language)

  **Must NOT do**:
  - Do not implement synchronous generation (use async createTask → poll pattern)
  - Do not create a separate history component — use existing `historyService`
  - Do not add transparent/background removal options (not supported by gpt-image-2)
  - Do not use `as any` or `@ts-ignore`
  - Do not change glass-panel/glass-input styling system — use existing CSS classes
  - Do not add new npm dependencies unless absolutely necessary

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Complex UI component with settings, toggles, image upload, and result display — needs design quality
  - **Skills Evaluated but Omitted**:
    - `vercel-react-best-practices`: Not a Next.js-specific concern, standard React component

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References** (existing code to follow):
  - `src/components/heygen-tab.tsx` — PRIMARY reference: two-column layout, mode toggle, settings panel, result display, generation flow, error handling, state management. Copy the overall structure and adapt for image-specific features.
  - `src/app/page.tsx` (lines 50-1328) — Seedance tab: model selector with `layoutId="activeModel"`, collapsible advanced settings, polling pattern with `pollTaskStatus()`, `getEstimatedCost()` function, credit balance display. Adapt these UI patterns.
  - `src/app/globals.css` — `.glass-panel`, `.glass-input`, `.custom-scrollbar` CSS classes for consistent styling

  **API/Type References** (contracts to implement against):
  - `src/types/gpt-image.ts` — GptImageAspectRatio, GptImageResolution, GptImageGenerationMode types from Task 1
  - `src/constants/gpt-image.ts` — GPT_IMAGE_ASPECT_RATIOS, GPT_IMAGE_RESOLUTIONS, GPT_IMAGE_PRICING, GPT_IMAGE_CONSTRAINTS, GPT_IMAGE_MODELS from Task 1
  - `src/lib/gpt-image.ts` — createGptImageTask, pollGptImageTask, getGptImageCredits functions from Task 2
  - `src/lib/history-service.ts` — addItem() with extended HistoryItem type from Task 3
  - `src/lib/supabase.ts` — uploadFileToSupabase() for Image-to-Image uploads

  **Test References** (testing patterns to follow):
  - No existing test files to reference — will establish testing pattern in Task 10

  **External References** (libraries and frameworks):
  - Framer Motion `layoutId` — for animated tab toggle between modes
  - TailwindCSS grid — `grid-cols-1 lg:grid-cols-2 gap-6` for two-column layout

  **WHY Each Reference Matters**:
  - `heygen-tab.tsx`: The most similar existing component — same two-column layout, same generation flow, same patterns. Adapted for image-specific features (aspect ratio, resolution, image upload).
  - `page.tsx` Seedance section: Model selector pattern, cost estimation, credit display — copy these UI interactions.
  - Types/constants from Task 1: Must use exact types for type safety and constraint validation.
  - API functions from Task 2: Must call these functions correctly for generation flow.
  - Supabase upload: For Image-to-Image mode image uploads.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Tab component renders with both sub-modes
    Tool: Playwright
    Preconditions: Dev server running, component integrated into page
    Steps:
      1. Navigate to http://localhost:3000
      2. Click "Картинки" category tab
      3. Verify two sub-tabs visible: "Text-to-Image" and "Image-to-Image"
      4. Verify prompt textarea is visible
      5. Verify aspect ratio selector shows: auto, 1:1, 9:16, 16:9, 4:3, 3:4
      6. Verify resolution selector shows: 1K, 2K, 4K (with experimental label on 4K)
      7. Verify credit estimate displays "Примерная стоимость: 2 кредитов" (1K default)
    Expected Result: All UI elements render correctly with glass-panel styling
    Failure Indicators: Missing elements, broken layout, wrong text
    Evidence: .sisyphus/evidence/task-7-tab-render.png

  Scenario: Mode toggle switches between Text-to-Image and Image-to-Image
    Tool: Playwright
    Preconditions: Tab component rendered
    Steps:
      1. Click "Image-to-Image" sub-tab
      2. Verify image upload area appears
      3. Verify prompt textarea still visible
      4. Click "Text-to-Image" sub-tab
      5. Verify image upload area disappears
      6. Verify prompt textarea still visible
    Expected Result: Toggle switches modes correctly, showing/hiding upload area
    Failure Indicators: Upload area always visible, toggle not working, layout broken
    Evidence: .sisyphus/evidence/task-7-mode-toggle.png

  Scenario: Constraint validation works
    Tool: Playwright
    Preconditions: Tab component rendered
    Steps:
      1. Select aspect ratio "1:1"
      2. Try to select resolution "4K"
      3. Verify 4K button is disabled OR warning message appears about invalid combination
      4. Select aspect ratio "auto"
      5. Try to select resolution "2K"
      6. Verify warning message about auto only supporting 1K
    Expected Result: Invalid combinations are prevented with clear messages
    Failure Indicators: 4K accepted with 1:1, no warning for auto+2K
    Evidence: .sisyphus/evidence/task-7-constraints.png

  Scenario: Credit estimation updates dynamically
    Tool: Playwright
    Preconditions: Tab component rendered, credit estimate visible
    Steps:
      1. Verify default estimate: "2 кредитов" (1K default)
      2. Click resolution "2K"
      3. Verify estimate updates to: "3 кредитов"
      4. Click resolution "4K" (if available for current aspect ratio)
      4. Verify estimate updates to: "5 кредитов"
    Expected Result: Credit estimate text updates immediately when resolution changes
    Failure Indicators: Estimate doesn't change, wrong values, stale text
    Evidence: .sisyphus/evidence/task-7-credits.png
  ```

  **Commit**: YES (groups with Wave 2)
  - Message: `feat(gpt-image): add API routes and tab component`
  - Files: `src/components/gpt-image-tab.tsx`

- [x] 8. Tab Reorganization in page.tsx — 2-Level Category System

  **What to do**:
  - Read `src/app/page.tsx` fully — understand current tab structure (lines 620-644), state management, conditional rendering
  - Change `activeTab` state from `"seedance" | "heygen"` to `"video" | "images"` for top-level category
  - Add `videoSubTab` state: `"seedance" | "heygen"` (default `"seedance"`)
  - Add `imageSubTab` state: `"text-to-image" | "image-to-image"` (default `"text-to-image"`)
  - Update the tab bar UI: Top level shows "Видео" and "Картинки" buttons
  - When "Видео" is active: show sub-tabs "Seedance" and "HeyGen" below (or next to)
  - When "Картинки" is active: show sub-tabs "Text-to-Image" and "Image-to-Image" below
  - Import and render `GptImageTab` component in the images section
  - Keep existing Seedance tab code inline in page.tsx (it's already there, just wrap in video category)
  - Keep HeyGen tab as imported component `HeyGenTab` (already imported, wrap in video category)
  - Update balance display logic: When video active → show relevant video balance, when images active → call `/api/gpt-image/credits`
  - Preserve ALL existing functionality — Seedance and HeyGen must work exactly as before

  **Must NOT do**:
  - Do not remove or refactor existing Seedance/HeyGen functionality
  - Do not change the Seedance component state or logic
  - Do not change how HeyGen component works — just where it renders
  - Do not break existing CSS styling or animations
  - Do not rename existing state variables that Seedance/HeyGen use

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: Complex refactoring of a large page.tsx file (~1328 lines) — requires careful understanding and surgical changes

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential after Wave 2)
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/page.tsx` (lines 620-644) — Current tab bar structure, `activeTab` state, conditional rendering
  - `src/app/page.tsx` (lines 50-1328) — Full Seedance tab code, state management, generation flow
  - `src/app/page.tsx` — HeyGen tab import and render pattern
  - `src/components/gpt-image-tab.tsx` — New component from Task 7 (to be imported and rendered)

  **API/Type References** (contracts to implement against):
  - Existing `activeTab` type: currently `"seedance" | "heygen"` → changes to `"video" | "images"`
  - New sub-tab states: `videoSubTab: "seedance" | "heygen"`, `imageSubTab: "text-to-image" | "image-to-image"`

  **WHY Each Reference Matters**:
  - `page.tsx` lines 620-644: This is the exact tab bar code that needs to change — must preserve structure while adding categories
  - Full page.tsx: Understanding all state and rendering logic to avoid breaking existing functionality
  - The existing `display: none` pattern for hiding inactive tabs must be preserved for both video and image tab groups

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Category tab bar renders correctly
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000
      2. Verify top-level category tabs visible: "Видео" and "Картинки"
      3. Verify "Видео" is active by default
      4. Verify Seedance sub-tab is visible and active
      5. Click "Картинки"
      6. Verify Text-to-Image sub-tab is visible and active
      7. Click "Видео"
      8. Verify Seedance sub-tab returns to view
    Expected Result: Two-level tab system works correctly, switching between categories preserves state
    Failure Indicators: Missing tabs, broken navigation, state lost on switch, layout broken
    Evidence: .sisyphus/evidence/task-8-tabbar.png

  Scenario: Existing Seedance functionality preserved
    Tool: Playwright
    Preconditions: Dev server running, Видео tab active
    Steps:
      1. Verify Seedance tab renders and is functional
      2. Click through to HeyGen sub-tab
      3. Verify HeyGen tab renders and is functional
      4. Switch back to Seedance
      5. Verify no state loss or layout regression
    Expected Result: All Seedance and HeyGen features work identically to before
    Failure Indicators: Missing UI elements, broken functionality, state loss
    Evidence: .sisyphus/evidence/task-8-regression.png

  Scenario: Image tab renders in Картинки category
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Click "Картинки" category tab
      2. Verify GptImageTab component renders
      3. Verify two sub-tabs: "Text-to-Image" and "Image-to-Image"
      4. Switch sub-tabs
      5. Switch back to "Видео" category
      6. Switch back to "Картинки"
      7. Verify image tab state was preserved
    Expected Result: Image tab renders and sub-tabs work, state preserved on category switch
    Failure Indicators: Component not rendering, broken sub-tabs, state lost
    Evidence: .sisyphus/evidence/task-8-image-tab.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(gpt-image): reorganize tabs and add constraint validation`
  - Files: `src/app/page.tsx`

- [x] 9. Constraint Validation & Credit Estimation Polish

  **What to do**:
  - Add comprehensive constraint validation UI in `gpt-image-tab.tsx`:
    - When aspect_ratio is "1:1" and user tries to select "4K": disable 4K button, show tooltip/warning "Соотношение 1:1 не поддерживает разрешение 4K"
    - When aspect_ratio is "auto" and user selects resolution other than "1K": show warning "Автоматическое соотношение поддерживает только разрешение 1K" and auto-reset to "1K"
    - Update button states reactively when aspect ratio changes
  - Add dynamic credit estimation display:
    - Show "Примерная стоимость: X кредитов" next to or below the resolution selector
    - Dynamically update when resolution changes (1K→2cr, 2K→3cr, 4K→5cr)
    - Compare with current credit balance: if cost > balance, show warning "Недостаточно кредитов" in red
    - If credits balance cannot be fetched, show "—" for balance, still show estimate
  - Add credit balance fetch on mount and after successful generation:
    - Call `/api/gpt-image/credits` on component mount
    - Refresh balance after each generation completes
  - Add generation button validation:
    - Disable if prompt is empty
    - Disable if constraint validation fails
    - Disable if already generating
    - Show specific reason why button is disabled (tooltip)

  **Must NOT do**:
  - Do not block 4K entirely — only disable when combined with 1:1 aspect ratio
  - Do not auto-submit on constraint change — just warn/disable the generate button
  - Do not add credit deduction tracking — only estimate cost and show balance

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-design`]
    - `frontend-design`: Polish UI interactions — dynamic validation, tooltips, reactive state
  - **Skills Evaluated but Omitted**:
    - `vercel-react-best-practices`: Simple state-driven UI, not a React optimization concern

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 8)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 10
  - **Blocked By**: Task 7

  **References**:

  **Pattern References** (existing code to follow):
  - `src/app/page.tsx` — `getEstimatedCost()` function for Seedance, credit balance display logic
  - `src/components/heygen-tab.tsx` — Button disable logic, validation patterns

  **API/Type References** (contracts to implement against):
  - `src/constants/gpt-image.ts` — `GPT_IMAGE_PRICING` mapping ({ '1K': 2, '2K': 3, '4K': 5 }), `GPT_IMAGE_CONSTRAINTS` validation rules

  **WHY Each Reference Matters**:
  - Seedance cost estimation: Copy the pattern for reactive cost display based on settings
  - Constants: Must use exact pricing values and constraint rules from Task 1

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 4K disabled for 1:1 aspect ratio
    Tool: Playwright
    Preconditions: Картинки tab active, Text-to-Image mode
    Steps:
      1. Select aspect ratio "1:1"
      2. Verify 4K resolution button is visually disabled
      3. Verify tooltip/warning message appears about 1:1 + 4K incompatibility
      4. Switch aspect ratio to "16:9"
      5. Verify 4K button becomes enabled
      6. Verify warning message disappears
    Expected Result: 4K disabled only for 1:1, re-enables for other ratios
    Failure Indicators: 4K always disabled, 4K enabled with 1:1, no warning shown
    Evidence: .sisyphus/evidence/task-9-4k-constraint.png

  Scenario: Auto aspect ratio resets to 1K
    Tool: Playwright
    Preconditions: Картинки tab active, Text-to-Image mode
    Steps:
      1. Select aspect ratio "16:9"
      2. Select resolution "4K"
      3. Switch aspect ratio to "auto"
      4. Verify resolution auto-resets to "1K"
      5. Verify warning message about auto + 1K appears
    Expected Result: Resolution resets to 1K when switching to auto, warning shown
    Failure Indicators: Resolution stays at 4K, no warning, wrong resolution
    Evidence: .sisyphus/evidence/task-9-auto-reset.png

  Scenario: Credit estimation updates correctly
    Tool: Playwright
    Preconditions: Картинки tab active, credits available
    Steps:
      1. Verify default: "2 кредитов" (1K, default)
      2. Select resolution "2K"
      3. Verify: "3 кредитов"
      4. Select resolution "4K" (if available)
      5. Verify: "5 кредитов"
      6. Verify credit balance is shown alongside
    Expected Result: Cost text updates immediately, correct values for each resolution
    Failure Indicators: Stale values, wrong numbers, missing balance display
    Evidence: .sisyphus/evidence/task-9-credit-est.png

  Scenario: Insufficient credits warning
    Tool: Playwright
    Preconditions: Картинки tab active, credit balance < 5
    Steps:
      1. Select resolution "4K" (5 credits)
      2. If credit balance shown is < 5, verify red warning "Недостаточно кредитов"
      3. Verify generate button is disabled or shows warning tooltip
    Expected Result: Warning appears when cost exceeds balance
    Failure Indicators: No warning shown, generate button enabled despite insufficient credits
    Evidence: .sisyphus/evidence/task-9-insufficient.png
  ```

  **Commit**: YES (groups with Wave 3)
  - Message: `feat(gpt-image): reorganize tabs and add constraint validation`
  - Files: `src/components/gpt-image-tab.tsx`

- [x] 10. Integration Tests

  **What to do**:
  - Set up test infrastructure if not existing (check for jest.config/vitest.config)
  - If no test framework exists, initialize Vitest (matches Next.js ecosystem): `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
  - Create test files:
    - `src/__tests__/gpt-image/api-client.test.ts` — Test `createGptImageTask`, `pollGptImageTask`, `getGptImageCredits` with mocked fetch
    - `src/__tests__/gpt-image/constraints.test.ts` — Test constraint validation: 1:1 + 4K invalid, auto + non-1K invalid, all valid combinations
    - `src/__tests__/gpt-image/pricing.test.ts` — Test pricing calculation: 1K=2, 2K=3, 4K=5
    - `src/__tests__/gpt-image/generate-route.test.ts` — Test API route validation: missing prompt, missing mode, invalid constraints, missing inputUrls for image-to-image
  - Run all tests and verify they pass

  **Must NOT do**:
  - Do not test implementation details — test behavior and contracts
  - Do not mock internal modules — mock external API (KIE.ai) only
  - Do not add snapshot tests — use assertions on values

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: Writing tests requires understanding the API contracts and constraints but no visual design

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential, after all implementation)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 5, 6, 7, 8

  **References**:

  **Pattern References** (existing code to follow):
  - If existing test files exist in project — follow their structure and patterns
  - `src/constants/gpt-image.ts` — Constants to test against (pricing, constraints)
  - `src/lib/gpt-image.ts` — API client functions to test

  **API/Type References** (contracts to test):
  - KIE.ai API createTask endpoint — mock responses for success, error states
  - KIE.ai API recordInfo endpoint — mock responses for polling states (waiting, queuing, generating, success, fail)
  - KIE.ai API credit endpoint — mock responses for balance check

  **WHY Each Reference Matters**:
  - Constants: Test files must validate the exact pricing and constraints defined in constants
  - API client: Mock fetch to test that the client constructs correct request payloads and handles responses

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All tests pass
    Tool: Bash
    Preconditions: Test infrastructure set up
    Steps:
      1. Run: npm test (or npx vitest)
      2. Verify all tests pass
      3. Check coverage report (if available)
    Expected Result: All tests pass with 0 failures
    Failure Indicators: Test failures, import errors, compilation errors
    Evidence: .sisyphus/evidence/task-10-tests.txt

  Scenario: Constraint validation tests cover edge cases
    Tool: Bash
    Preconditions: Tests written and passing
    Steps:
      1. Verify test file exists: src/__tests__/gpt-image/constraints.test.ts
      2. Verify it tests: 1:1 + 4K → invalid, auto + 2K → invalid, 16:9 + 4K → valid, all valid combos
    Expected Result: All constraint edge cases are tested
    Failure Indicators: Missing test cases, uncovered combinations
    Evidence: .sisyphus/evidence/task-10-constraints-coverage.txt
  ```

  **Commit**: YES
  - Message: `test(gpt-image): add integration tests`
  - Files: `src/__tests__/gpt-image/`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + `npx next build` + `npm run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Types [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together). Test edge cases: empty prompt, invalid aspect/resolution combo, insufficient credits. Test Seedance/HeyGen still work after tab reorganization. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(gpt-image): add types, constants, API client, and history extension` - src/types/gpt-image.ts, src/constants/gpt-image.ts, src/lib/gpt-image.ts, src/lib/history-service.ts, src/app/api/gpt-image/credits/route.ts
- **Wave 2**: `feat(gpt-image): add API routes and tab component` - src/app/api/gpt-image/generate/route.ts, src/app/api/gpt-image/status/route.ts, src/components/gpt-image-tab.tsx
- **Wave 3**: `feat(gpt-image): reorganize tabs and add constraint validation` - src/app/page.tsx
- **Wave 4**: `test(gpt-image): add integration tests` - tests/

---

## Success Criteria

### Verification Commands
```bash
npx next build          # Expected: exit 0, build succeeds
npx tsc --noEmit        # Expected: exit 0, no type errors
npm run lint            # Expected: exit 0, no lint errors
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] Tab categories render correctly (Видео / Картинки)
- [ ] Existing Seedance/HeyGen functionality unchanged
- [ ] GPT Image 2 generation works (Text-to-Image + Image-to-Image)
- [ ] Credit estimation displays correctly
- [ ] Constraint validation works (1:1 + 4K, auto + 4K)