# Learnings — HeyGen Integration

## [2026-04-16] Session Start

### API Contract (verified from official docs)
- Base URL: `https://api.heygen.com`
- Auth: `x-api-key: ${HEYGEN_API_KEY}` header (lowercase)
- Create video: `POST /v3/videos` with `type: "image"` → returns `{ data: { video_id } }`
- Poll status: `GET /v3/videos/{video_id}` → `{ data: { status, video_url?, thumbnail_url?, failure_message? } }`
- Voices: `GET /v3/voices?gender=&language=&limit=100` → `{ data: [...voices], has_more, next_token }`
- Balance: `GET /v3/users/me` → `{ data: { billing_type, wallet: { remaining_balance, currency } } }`
- Errors: `{ error: { code: string, message: string } }`

### Architecture Decisions
- HeyGen tab = isolated vertical slice (no touching existing files except page.tsx + history-service.ts)
- Tab state persistence: BOTH tabs rendered simultaneously, inactive hidden via CSS `display:none` (NOT conditional rendering)
- Voice library: single 100-item fetch with gender/language filters, no pagination UI
- Background: color picker + URL input only (no file upload for background)
- No emotion/camera/lighting/dynamism (HeyGen image-to-video doesn't support these)

### Existing Codebase Patterns
- page.tsx: 923 lines, ~30 useState hooks, glassmorphism UI
- KIE client pattern: env var check → fetch → response.ok check → JSON parse → throw on error
- Supabase upload: `uploadFileToSupabase(bucket, path, file)` → public URL
- History: localStorage, last 50 items, `addItem()` + `updateItem()`
- CSS: `.glass-panel`, `.glass-input` from globals.css
- Colors: primary #8b5cf6, bg #09090b, fg #fafafa

### Environment
- Platform: Windows PowerShell (NOT bash/jq)
- Use `Invoke-RestMethod` for API calls in QA
- Use `curl.exe` (not `curl` alias) if needed

- Created a standalone HeyGen types module with only exported aliases/interfaces and no cross-file imports.
- Verified the file compiles in strict mode and exposes 10 exported types/interfaces.

### Route Implementation Notes
- Added isolated HeyGen API routes under `/api/heygen/*` without changing existing KIE routes.
- Kept all HeyGen route failures on HTTP 200 with `{ success: false, error }` and no `any` usage.
- `next build` completed successfully after adding the four route handlers.
