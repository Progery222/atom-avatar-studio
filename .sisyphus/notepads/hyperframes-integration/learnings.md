# Learnings — HyperFrames Integration

## 2026-04-22 Session Start
- Project: Aura Dynamics (Next.js 16.2.3, React 19.2.4, Tailwind v4)
- Tab system: `useState<'seedance' | 'heygen'>` + CSS display toggle
- page.tsx: 1336 lines, 30+ useState hooks
- Design: glassmorphism (.glass-panel, .glass-input), dark theme (#09090b bg, #8b5cf6 primary)
- State: Pure React useState, no Context/Redux/Zustand
- API pattern: Next.js route handlers → { success, data?, error? }, Bearer auth
- Uploads: Supabase Storage via uploadFileToSupabase()
- History: localStorage via history-service.ts
- HyperFrames: Open-source HTML→Video framework, NOT an API service
- Studio designed for local dev, NOT embedding → port individual components
- Player: web component with Shadow DOM → use public API, not direct DOM
- GSAP: load dynamically, do NOT bundle
- Zustand: scoped to HyperFrames tab only, no global refactor

## 2026-04-22 Wave 1 Completion
- **Subagent model routing issue**: `category="quick"` → minimax-m2.7 (unstable, doesn't write files). `category="deep"` → provider timeout. `category="ultrabrain"` → interrupted.
- **Resolution**: Wrote Wave 1 foundation files directly (types, constants, store, composition-manager, tab update). This was necessary because all subagent models were failing.
- **Pre-existing bug fixed**: `src/lib/tts.ts:416` — `Uint8Array<ArrayBuffer>` vs `Uint8Array<ArrayBufferLike>` type mismatch. Fixed by adding explicit type annotation.
- **CSS already written by minimax**: The minimax subagent for T7 DID write CSS utilities to globals.css (hf-timeline, hf-track, hf-clip, hf-playhead, hf-panel, hf-toolbar, hf-inspector, hf-tooltip, hf-wizard-overlay + theme tokens). But it failed to create any other files.
- **Build passes**: `npm run build` succeeds after all Wave 1 changes
- **TSC clean**: `npx tsc --noEmit` passes with zero errors
- **Dependencies installed**: zustand@5.0.12, puppeteer@24.42.0, codemirror@6.0.2, @codemirror/lang-html, @codemirror/lang-css, @codemirror/theme-one-dark, @phosphor-icons/react, fluent-ffmpeg, @ffmpeg-installer/ffmpeg

## 2026-04-22 Wave 2 � Code Editor Component
- **CodeMirror 6 vanilla API**: Use EditorState.create() + 
ew EditorView() in useEffect. No React wrappers.
- **Extension swapping**: CM6 doesn't have EditorState.reconfigure as a static method. Use iew.setState(EditorState.create({...})) to swap language extensions on mode change.
- **Debounce pattern**: Use useRef for timeout + modeRef to track current mode inside updateListener callback (avoids stale closure).
- **Cleanup**: Must call iew.destroy() on unmount. Also clear debounce timeout.
- **Keymap**: Use Prec.high(keymap.of([...])) to ensure shortcuts override default bindings.
- **One Dark theme**: @codemirror/theme-one-dark matches app's dark design well. Custom EditorView.theme() overrides gutter/scrollbar styling.
- **TSC clean**: 
px tsc --noEmit passes with zero errors after removing dead EditorState.reconfigure code.
