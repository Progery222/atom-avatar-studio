<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md - 3D Avatar Generate (Aura Dynamics)

## Project Overview

**Type**: Next.js 16.2.3 full-stack web app for AI video avatar generation  
**Purpose**: Generate talking avatar videos from portrait images using AI models (ByteDance Seedance 2.0, Kling AI) with text-to-speech and advanced animation controls

---

## Quick Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (dark mode, Inter font)
│   ├── page.tsx            # Main UI - avatar generation interface
│   ├── globals.css         # Tailwind v4 theme + glassmorphism utilities
│   └── api/
│       ├── generate/route.ts  # POST - create video task
│       ├── status/route.ts    # GET - poll task status
│       ├── credits/route.ts   # GET - wallet balance
│       └── tts/route.ts       # POST - text-to-speech
├── constants/
│   ├── models.ts           # AI models (Seedance 2.0, Kling Standard/Pro)
│   └── presets.ts          # Emotion, camera, lighting presets
├── lib/
│   ├── kie.ts              # KIE.ai API client
│   ├── supabase.ts         # Supabase Storage client
│   ├── prompt-builder.ts  # Prompt generation
│   ├── tts.ts              # TTS providers (OpenAI, ElevenLabs)
│   ├── history-service.ts # Local history management
│   └── utils.ts            # Utilities (cn for class merging)
```

---

## Environment Variables

Create `.env.local`:

```env
KIE_API_KEY=<api-key>
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
OPENAI_API_KEY=<key>
ELEVENLABS_API_KEY=<key>
```

---

## Tech Stack

| Category | Version |
|----------|---------|
| Next.js | 16.2.3 (App Router) |
| React | 19.2.4 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Framer Motion | 12.38.0 |
| Supabase JS | 2.103.1 |

---

## Available Skills

Use these skills for specific tasks:

| Task | Skill | When to Use |
|------|-------|-------------|
| UI/Frontend | `frontend-design`, `frontend-ui-ux` | Building components, pages, artifacts |
| React/Next.js | `vercel-react-best-practices` | Performance optimization |
| View Transitions | `vercel-react-view-transitions` | Page animations |
| Deployment | `deploy-to-vercel`, `vercel-cli-with-tokens` | Deploy to Vercel |
| Git | `git-master` | Commits, rebase, history |
| Browser Testing | `playwright`, `webapp-testing` | E2E testing |
| MCP | `mcp-builder` | Creating MCP servers |
| Claude API | `claude-api` | Using Anthropic SDK |
| Documents | `docx`, `pdf`, `pptx`, `xlsx` | Document manipulation |
| Algorithmic Art | `algorithmic-art` | p5.js generative art |
| Review | `review-work` | Post-implementation QA |

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

## Design System

**Theme** (from `src/app/globals.css`):
- Primary: `#8b5cf6` (purple)
- Background: `#09090b` (dark)
- Foreground: `#fafafa` (light)
- Custom utilities: `.glass-panel`, `.glass-input` (glassmorphism)

---

## AI Models Supported

| Model | Provider | Resolution | Features |
|-------|----------|------------|----------|
| Seedance 2.0 Fast | ByteDance | 480p-720p | Integrated TTS, emotions, camera, lighting |
| Kling Standard | Kling AI | 720p | External audio |
| Kling Pro | Kling AI | 720p-1080p | Camera effects |

---

## Agent Protocol (from GEMINI.md)

1. **Classify request**: QUESTION → SURVEY → SIMPLE CODE → COMPLEX CODE → DESIGN/UI
2. **Select agent**: Match domain to specialist agent
3. **Load skills**: Read SKILL.md, then specific sections
4. **Verify**: Run appropriate checks before completion

---

## Key Rules

- **Language**: Respond in user's language (Russian), code in English
- **No over-engineering**: Concise, direct code
- **Type safety**: Never use `as any`, `@ts-ignore`
- **Git**: Ask before push, use conventional commits
- **Secrets**: Never commit `.env`, warn if exposed

---

## Next.js 16 Notes

- Uses new Tailwind v4 syntax (`@import "tailwindcss"`)
- App Router with Server/Client Components
- Check `node_modules/next/dist/docs/` for breaking changes

---

## Project Context (from Docs)

### Core Purpose
Веб-сервис, который оживляет статичные изображения (аватары/парящие головы), накладывает на них голос (липсинк) и добавляет высокую динамику и эмоции в кадр.

### API Provider
- **KIE.ai** (бывший ByteDance Seedance)
- Документация: https://docs.kie.ai/

### Key Features Implemented
1. **Image Upload** - Загрузка исходного изображения (статичная голова/персонаж)
2. **TTS / Audio** - Text-to-Speech или готовый аудиофайл (mp3/wav)
3. **Emotion Selector** - Neutral, Joyful/Energetic, Deep Thought/Serious, Empathetic, Sarcastic
4. **Dynamism Slider** - 1 (Static), 2 (Smooth Motion), 3 (High Energy/Cinematic)
5. **Camera Style** - Static, Dolly Zoom, Arc/Orbit, Handheld Shake

### Prompt Builder Logic
Backend формирует текстовый prompt для Seedance по формуле:
`[Image Reference] + [Audio Reference / Text Quote] + [Emotion Modifiers] + [Camera & Dynamism Modifiers] + [Timeline Prompting]`

---

## Configuration Status

| MCP Server | Status | Config |
|------------|--------|--------|
| context7 | ⚠️ | Requires API key |
| shadcn | ✅ | Ready |
| supabase | ✅ | project-ref: sqlyyvaebbqgljjmaacz |
| firecrawl | ✅ | API key configured |
