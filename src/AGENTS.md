<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# src

## Purpose
Application source for the Next.js 16 App Router web app. The UI is a single-page studio (`app/page.tsx`) that orchestrates several AI media-generation features — Seedance/Kling avatar video (KIE.ai), HeyGen avatar video, GPT-Image text/image generation, and multi-provider TTS. Server-side work lives in `app/api/` route handlers; the integration logic they call lives in `lib/`.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | App Router entry: root layout, the page shell, global CSS, and all API route handlers (see `app/AGENTS.md`) |
| `components/` | Client UI components — feature tabs, voice/background selectors, TTS settings panels (see `components/AGENTS.md`) |
| `lib/` | Service layer: typed clients for KIE/HeyGen, Supabase storage, TTS orchestration, prompt builder (see `lib/AGENTS.md`) |
| `constants/` | Provider configuration data: voice catalogs, presets, pricing, limits, error messages (see `constants/AGENTS.md`) |
| `types/` | TypeScript request/response contracts for GPT-Image and HeyGen APIs (see `types/AGENTS.md`) |
| `__tests__/` | Vitest unit/route tests, currently focused on the GPT-Image feature (see `__tests__/AGENTS.md`) |

## Architecture Flow

```
components/*-tab.tsx  (client)
   │  fetch
   ▼
app/api/<feature>/route.ts  (server route handler)
   │  imports
   ▼
lib/<provider>.ts  ──uses──▶ constants/*  +  types/*
   │
   ▼
external API (KIE.ai / HeyGen / OpenAI / ElevenLabs / Google) + Supabase storage
```

Client components never call external provider APIs directly — they always go through `app/api/*` so secrets stay server-side.

## For AI Agents

### Working In This Directory
- Path alias `@/*` maps to `src/*` (see root `tsconfig.json`). Prefer `@/lib/...`, `@/constants/...` over relative paths.
- Server route handlers read secrets from `process.env`; client components must only use `NEXT_PUBLIC_*` vars.
- Respect the layering: UI → `app/api` → `lib`. Don't import server `lib` clients that read secrets into client components.
- Type safety is strict — no `as any`, `@ts-ignore`, or `@ts-expect-error` (see root rules).

### Testing Requirements
- `npm test` (Vitest). New backend logic in `lib/` or `app/api/` should get tests mirroring the patterns in `__tests__/gpt-image/`.
- Build gate before done: `npx next build` (exit 0) and `npx tsc --noEmit`.

### Common Patterns
- Feature tabs are self-contained client components holding their own state and polling loops.
- Async generation features use a create → poll-status loop (`generate` then repeated `status` calls).
- Provider config (options, pricing, error-message maps) is centralized in `constants/` and imported by both UI and routes.

## Dependencies

### Internal
- Self-contained; the layers above reference each other only.

### External
- `next`, `react` — framework
- `@supabase/supabase-js` — storage (public URLs for provider APIs)
- `@google/genai`, `openai`, `@elevenlabs/elevenlabs-js` — TTS providers
- `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge` — UI

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
