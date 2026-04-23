# Decisions — HyperFrames Integration

## 2026-04-22 Pre-Execution Decisions
- **Studio approach**: Port into Next.js as React components (NOT iframe)
- **State management**: Zustand scoped to HyperFrames only
- **Storage**: localStorage primary, Supabase Storage secondary
- **GSAP**: Dynamic script injection, not bundled
- **CodeMirror theme**: one-dark (matches dark UI)
- **Render pipeline**: Puppeteer + FFmpeg as API route, local-only
- **Onboarding**: 8-step wizard + persistent inline tooltips
- **Avatar integration**: Both standalone AND post-production
- **No refactoring**: Existing Seedance/HeyGen tabs untouched
- **No test infra**: Agent QA only
