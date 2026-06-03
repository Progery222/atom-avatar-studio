<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# components

## Purpose
Client-side UI for the media-generation features. Two kinds live here: large self-contained **feature tabs** (HeyGen, GPT-Image) that own their state and generation/polling loops, and smaller **reusable controls** (voice selector, background selector, TTS settings panels, TTS preview) composed by the tabs and by `src/app/page.tsx`. Every file is a Client Component (`"use client"`).

## Key Files

| File | Component | Description |
|------|-----------|-------------|
| `heygen-tab.tsx` | `HeyGenTab` | Full HeyGen video UI: image-to-video vs photo-avatar source, text/file audio, background & motion/expressiveness controls, generate + status polling. Uses `voice-selector`, `background-selector`. Calls `/api/heygen/*`. |
| `gpt-image-tab.tsx` | `GptImageTab` | Full GPT-Image UI: text/image-to-image modes, resolution/aspect ratio, credits, drag-drop upload, generate + poll. Calls `/api/gpt-image/*`. |
| `voice-selector.tsx` | `VoiceSelector` | Async voice picker with gender/language filters. Calls `GET /api/heygen/voices`. |
| `background-selector.tsx` | `BackgroundSelector` | Background config (none/color/image) + remove-bg toggle. Exports helper `getBackgroundPayload`. Presentational. |
| `GeminiFlashTTSSettings.tsx` | `GeminiFlashTTSSettings` | Gemini 3.1 Flash TTS panel: voice/language/gender/favorites, audio tags, inline preview. Calls `POST /api/tts/voice-preview`. |
| `GeminiTTSSettings.tsx` | `GeminiTTSSettings` | Google Cloud TTS panel: voice, scene style, speaking rate, pitch, locale (framer-motion animated). Presentational. |
| `TTSPreview.tsx` | `TTSPreview` | Reusable loading/ready/error preview with audio player + add/cancel/download actions. Presentational. |

## For AI Agents

### Working In This Directory
- **Naming is mixed and intentional-ish**: kebab-case for generic/reusable controls (`voice-selector.tsx`, `background-selector.tsx`, `*-tab.tsx`); PascalCase for provider-branded panels (`GeminiTTSSettings.tsx`, `GeminiFlashTTSSettings.tsx`, `TTSPreview.tsx`). Follow the closest existing neighbor when adding a file.
- All components are client-side — never read secrets here; call `/api/*` instead.
- Tabs are stateful and large; reusable controls are mostly prop-driven and presentational. Keep new shared controls presentational where possible.
- Option lists, pricing, and error text come from `@/constants/*` — don't hardcode them.

### Testing Requirements
- No component tests currently exist (Vitest is configured with jsdom + Testing Library, so they're possible). Verify UI changes by running `npm run dev` and exercising the tab; build gate with `npx next build`.

### Common Patterns
- `framer-motion` (`motion`, `AnimatePresence`) for expand/collapse and result transitions.
- `lucide-react` for icons; `cn()` from `@/lib/utils` for class merging.
- Generation flow inside tabs: build payload → `POST /api/<feature>/generate` → store `taskId`/`videoId` → poll `GET /api/<feature>/status` on an interval → on success upload/display result and write to `historyService`.
- File uploads go through `uploadFileToSupabase` (`@/lib/supabase`) to obtain public URLs.

## Dependencies

### Internal
- `@/lib/supabase`, `@/lib/history-service`, `@/lib/utils`
- `@/constants/heygen`, `@/constants/gemini-tts`, `@/constants/gemini-flash-tts`, `@/constants/gpt-image`
- `@/types/heygen`

### External
- `framer-motion`, `lucide-react`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
