<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Atom Avatar Studio (3D Avatar Generate)

## Quick Commands

```bash
npm run dev           # Dev server (http://localhost:3000)
npm run build         # Production build — MUST pass before deploying
npm run lint          # ESLint check
```

**Build gate**: `npx next build` must exit 0. No exceptions.

---

## Project Structure

Two independent tabs in `src/app/page.tsx`:

| Tab | Path | Purpose |
|-----|------|---------|
| **Seedance** | `src/app/page.tsx` (lines 50–700+) | AI avatar video generation (KIE.ai / ByteDance) |
| **HeyGen** | `src/components/heygen-tab.tsx` | HeyGen avatar generation |

The shell in `src/app/page.tsx` actually drives **two categories**: *Video* (Seedance / Kling / HeyGen sub-tabs) and *Images* (Text-to-Image / Image-to-Image, see `src/components/gpt-image-tab.tsx`).

---

## Codebase Map

Each directory below has its own `AGENTS.md` with detailed, AI-readable docs. Start here, then drill down.

| Directory | Contents | Doc |
|-----------|----------|-----|
| `src/` | Application source (Next.js App Router) | `src/AGENTS.md` |
| `src/app/` | Routes, root layout, global styles | `src/app/AGENTS.md` |
| `src/app/api/` | Backend route handlers (KIE, HeyGen, GPT-Image, TTS) | `src/app/api/AGENTS.md` |
| `src/components/` | Client UI components (tabs, selectors, settings panels) | `src/components/AGENTS.md` |
| `src/lib/` | Service/integration layer — API clients, storage, TTS | `src/lib/AGENTS.md` |
| `src/constants/` | Provider config: voices, presets, pricing, error messages | `src/constants/AGENTS.md` |
| `src/types/` | TypeScript API contracts (GPT-Image, HeyGen) | `src/types/AGENTS.md` |
| `src/__tests__/` | Vitest suites (GPT-Image client, routes, constraints) | `src/__tests__/AGENTS.md` |
| `worker/` | Standalone FastAPI worker (transcribe/EDL/render stubs) | `worker/AGENTS.md` |
| `Docs/` | Product/research specs (Seedance prompt design, HeyGen) | `Docs/AGENTS.md` |

> `public/` holds only default Next.js SVG assets; `.agent/` is a vendored agent-framework (not project code). Neither is documented here.

---

## Tech Stack

| Category | Version | Notes |
|----------|---------|-------|
| Next.js | 16.2.3 | App Router, Turbopack |
| React | 19.2.4 | Custom elements supported natively |
| TypeScript | 5 | `skipLibCheck: true` |
| Tailwind CSS | 4 | `@import "tailwindcss"` syntax |
| Framer Motion | 12.38.0 | |

---

## Environment Variables

Create `.env.local`:

```env
# Core APIs
KIE_API_KEY=<api-key>
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
OPENAI_API_KEY=<key>
ELEVENLABS_API_KEY=<key>
```

---

## Design System

**Theme** (`src/app/globals.css`):
- Primary: `#8b5cf6` (purple)
- Background: `#09090b` (dark)
- Foreground: `#fafafa` (light)
- Custom utilities: `.glass-panel`, `.glass-input` (glassmorphism)

---

## MCP Servers (Configured)

```json
{
  "context7": { "package": "@upstash/context7-mcp" },
  "shadcn": { "package": "shadcn@latest", "args": ["mcp"] },
  "supabase": {
    "package": "supabase-community/supabase-mcp",
    "project-ref": "sqlyyvaebbqgljjmaacz"
  },
  "firecrawl": { "package": "firecrawl-mcp", "env": "FIRECRAWL_API_KEY" }
}
```

---

## Key Rules

- **Language**: Respond in user's language (Russian), code in English
- **Type safety**: Never `as any`, `@ts-ignore`, `@ts-expect-error`
- **Git**: Ask before push, conventional commits
- **Secrets**: Never commit `.env`, warn if exposed
- **No over-engineering**: Concise, direct code

---

## Next.js 16 Notes

- Tailwind v4 syntax: `@import "tailwindcss"`
- App Router with Server/Client Components
- Check `node_modules/next/dist/docs/` for breaking changes
- Turbopack by default (`next dev` uses Turbopack)

---

## Agent Protocol

1. **Classify request**: QUESTION → SURVEY → SIMPLE CODE → COMPLEX CODE → DESIGN/UI
2. **Select agent**: Match domain to specialist agent
3. **Load skills**: Read SKILL.md, then specific sections
4. **Verify**: Run `npx next build` and `npx tsc --noEmit` before reporting done

---

## Skills Reference

| Task | Skill |
|------|-------|
| UI/Frontend | `frontend-design`, `frontend-ui-ux` |
| React/Next.js | `vercel-react-best-practices` |
| View Transitions | `vercel-react-view-transitions` |
| Deployment | `deploy-to-vercel`, `vercel-cli-with-tokens` |
| Git | `git-master` |
| Browser Testing | `playwright`, `webapp-testing` |
| MCP | `mcp-builder` |
| Claude API | `claude-api` |
| Documents | `docx`, `pdf`, `pptx`, `xlsx` |
| Review | `review-work` |
