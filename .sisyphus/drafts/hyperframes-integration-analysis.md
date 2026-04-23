# Draft: HyperFrames + video-use Integration Analysis

## Current State (Our Implementation)

### Files Inventory
**Components (12 files, ~3,469 lines):**
- `ai-generator-view.tsx` (165) — AI chat interface for generating compositions
- `audio-manager.tsx` (463) — Audio upload, TTS, volume controls
- `avatar-import.tsx` (380) — Cross-tab avatar video import
- `block-catalog.tsx` (285) — Block browser with previews
- `code-editor.tsx` (258) — CodeMirror HTML/CSS editor
- `composition-history.tsx` (314) — Save/load compositions
- `export-panel.tsx` (407) — Render settings and progress
- `inspector.tsx` (289) — Properties editor for selected blocks
- `player-preview.tsx` (256) — iframe srcdoc preview with controls
- `shader-selector.tsx` (333) — Shader transition selector
- `template-gallery.tsx` (231) — Template picker
- `timeline.tsx` (495) — Multi-track timeline with drag/resize

**Lib (4 files, ~781 lines):**
- `composition-manager.ts` (340) — CRUD, localStorage, HTML generation
- `renderer.ts` (241) — Puppeteer + FFmpeg render pipeline
- `render-jobs.ts` (33) — In-memory job tracking
- `store.ts` (167) — Zustand state management

**API (5 files, ~297 lines):**
- `render/route.ts` (82) — POST render endpoint
- `render/status/route.ts` (22) — GET status polling
- `compositions/route.ts` (102) — CRUD API
- `compositions/[id]/route.ts` (91) — Single composition CRUD

**Types & Constants:**
- `types/hyperframes.ts` (133) — Type definitions
- `constants/hyperframes/blocks.ts` (~190) — 16 blocks across 7 categories
- `constants/hyperframes/shaders.ts` (~150) — 15 shader transitions
- `constants/hyperframes/templates.ts` (~120) — 8 starter templates

### Current Rendering Pipeline
```
HTML (composition.html) → compositionToHtml() adds GSAP script → 
iframe srcdoc preview → Puppeteer screenshots (frame-by-frame) → 
FFmpeg encode frames → MP4 → Supabase upload
```

**Problems:**
1. Puppeteer screenshots are slow and unreliable
2. No Chrome CDP BeginFrame API (frame-perfect rendering)
3. iframe preview uses primitive GSAP script (not official runtime)
4. No video/audio element support in compositions
5. No nested compositions
6. No audio mixing
7. Renderer waits for `window.setCurrentTime` which doesn't exist in our runtime

---

## HeyGen HyperFrames (Official)

### Architecture
Monorepo with packages:
- `@hyperframes/cli` — init, preview, render, lint, transcribe, tts
- `@hyperframes/core` — Types, parsers, generators, runtime, linter
- `@hyperframes/engine` — Chrome CDP BeginFrame for seekable capture
- `@hyperframes/producer` — Full pipeline: capture + encode + audio mix
- `@hyperframes/studio` — Browser editor UI
- `@hyperframes/player` — `<hyperframes-player>` web component
- `@hyperframes/shader-transitions` — WebGL transitions

### Key Differences from Our Implementation
| Feature | Official HyperFrames | Our Implementation |
|---------|---------------------|-------------------|
| Frame capture | Chrome CDP BeginFrame | Puppeteer screenshots |
| Runtime | Official injected script | Primitive GSAP script |
| Preview | `<hyperframes-player>` web component | iframe srcdoc |
| Audio mixing | Full audio track mixing | None |
| Nested comps | Supported | Not supported |
| Video elements | Supported | Not supported |
| EDL format | Native | None |
| CLI tools | init, preview, render, lint | None |

### Official Data Model
```typescript
// Composition via HTML attributes
<div id="root" 
     data-composition-id="my-video"
     data-start="0" 
     data-width="1920" 
     data-height="1080">
  
  <video id="clip-1" 
         data-start="0" 
         data-duration="5"
         data-track-index="0"
         src="intro.mp4"></video>
  
  <h1 id="title" 
      class="clip"
      data-start="1" 
      data-duration="4">
    Welcome!
  </h1>
  
  <audio id="bg-music" 
         data-start="0" 
         data-duration="5"
         data-track-index="2"
         data-volume="0.5"
         src="music.wav"></audio>
</div>
```

### Rendering Pipeline (Official)
```
HTML → Inject Runtime → Headless Chrome (CDP BeginFrame) → 
Frame Capture → FFmpeg Encode → Audio Mix → MP4/WebM
```

### APIs
```typescript
// Programmatic
import { createRenderJob, executeRenderJob } from '@hyperframes/producer';

// HTTP Server
import { startServer } from '@hyperframes/producer/server';
// POST /render, POST /render/stream (SSE), POST /lint

// CLI
npx hyperframes init my-video --example blank
npx hyperframes render --output ./output.mp4
npx hyperframes preview
npx hyperframes lint
```

---

## video-use (Browser-Use)

### Purpose
CLI skill for Claude Code enabling conversation-driven video editing via LLM.

### Workflow
```
Raw Footage → ElevenLabs Scribe Transcription → 
Pack Transcripts (takes_packed.md) → LLM Reasoning → 
EDL JSON (edl.json) → FFmpeg Render (per-segment extract + concat) → 
Self-Eval (timeline_view at cut boundaries) → final.mp4
```

### Key Components
| Script | Purpose |
|--------|---------|
| `transcribe.py` | ElevenLabs Scribe API call |
| `pack_transcripts.py` | Build LLM-readable transcript |
| `timeline_view.py` | Filmstrip+waveform PNG composites |
| `render.py` | EDL → final.mp4 (ffmpeg) |
| `grade.py` | Color grading presets |

### EDL Format
```json
{
  "version": 1,
  "sources": {"C0103": "/path/C0103.MP4"},
  "ranges": [
    {"source": "C0103", "start": 2.42, "end": 6.85, 
     "beat": "HOOK", "quote": "...", "reason": "..."}
  ],
  "grade": "warm_cinematic",
  "overlays": [...],
  "subtitles": "edit/master.srt",
  "total_duration_s": 87.4
}
```

### Hard Rules (Production Correctness)
1. Subtitles LAST (after overlays)
2. Per-segment extract + lossless concat
3. 30ms audio fades at every cut boundary
4. Never cut inside a word (snap to word boundaries)
5. Word-level verbatim ASR only

---

## Integration Strategy

### Goal
Make HyperFrames work as automatically as possible:
1. **Upload video** → auto-transcribe → auto-generate EDL → auto-render
2. **Describe changes** in chat → LLM modifies composition → instant preview
3. **Add motion design** via prompts → auto-generate GSAP animations/shaders

### Approach
**Phase 1: Foundation** — Replace custom code with official HyperFrames packages
**Phase 2: AI Automation** — Integrate video-use + LLM for automated editing
**Phase 3: Motion Design** — Auto-generate animations via LLM prompts

### Key Decisions
1. **Install official packages** `@hyperframes/core`, `@hyperframes/producer`
2. **Keep our UI components** but replace rendering/preview engines
3. **Add Python worker** for video-use helpers (transcribe, render)
4. **Use Claude API** for LLM-driven composition editing
5. **EDL as intermediate format** between UI and renderer
