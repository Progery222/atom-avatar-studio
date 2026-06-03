<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# app

## Purpose
The Next.js **App Router** entry point. Holds the root layout, the single-page studio shell, global styles, and all backend route handlers under `api/`. The page is a thin orchestrator: it manages tab/category state and shared TTS/generation controls, then mounts feature components from `src/components/` and calls the route handlers in `api/`.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Root layout. Sets `<html lang="en">` dark mode, body Tailwind classes, Inter font (`--font-inter`), and metadata (title "Atom Avatar Studio \| AI Video Avatars"). No global providers — state is client-side in `page.tsx`. |
| `page.tsx` | The studio shell (large client component). Two categories — **Video** (Seedance / Kling / HeyGen sub-tabs) and **Images** (Text-to-Image / Image-to-Image). Holds advanced Seedance controls (emotion, dynamism, camera, lighting, gender, model, resolution, aspect ratio, duration, webSearch, nsfwChecker) and TTS provider selection. Auto-resets model/resolution when switching video sub-tabs. Mounts `HeyGenTab`, `GptImageTab`, `GeminiFlashTTSSettings`, `TTSPreview`. |
| `globals.css` | Tailwind v4 (`@import "tailwindcss"`). Dark theme tokens (bg `#09090b`, fg `#fafafa`, primary `#8b5cf6`), radial-gradient body, and `.glass-panel` / `.glass-input` glassmorphism utilities. |
| `favicon.ico` | App icon. |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `api/` | All server route handlers — KIE video/credits/status, GPT-Image, HeyGen, and TTS (see `api/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `page.tsx` is a Client Component and is large — read the state declarations and the `useEffect` model/resolution-reset logic before editing tab behavior. Prefer extracting new feature UI into `src/components/`.
- `layout.tsx` is a Server Component; keep it minimal. The canonical product name is "Atom Avatar Studio" — keep metadata/title copy consistent with it.
- Theme tokens and the glass utilities live only in `globals.css`; reuse `.glass-panel`/`.glass-input` instead of re-deriving blur/border styles.
- This is Next.js 16 — consult `node_modules/next/dist/docs/` for App Router specifics before changing routing/rendering.

### API Calls From `page.tsx`
- `GET /api/credits`, `GET /api/heygen/balance`, `GET /api/gpt-image/credits` (on mount)
- `POST /api/tts` (generate audio), `POST /api/generate` (create video task), `GET /api/status?taskId=…` (poll)

### Testing Requirements
- Verify in the browser via `npm run dev`. Build gate: `npx next build` (exit 0) + `npx tsc --noEmit`.

### Common Patterns
- Server/Client split: `layout.tsx` server, `page.tsx` and the feature tabs client.
- Generation = create + poll; provider config pulled from `@/constants/*`.

## Dependencies

### Internal
- `src/components/*` (mounted tabs/panels), `@/constants/*`, `@/lib/history-service`

### External
- `next`, `react`, `framer-motion`, `lucide-react`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
