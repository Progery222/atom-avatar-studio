<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# Docs

## Purpose
Product and research specifications that informed the implementation. These are design/intent documents (mostly in Russian), useful for understanding *why* the prompt-building and provider integrations work the way they do — they are not API references.

## Key Files

| File | Description |
|------|-------------|
| `master-promt-kea.md` | Spec for the "Dynamic AI Talking Avatar" service on KIE.ai's Seedance-2-Fast: UI requirements (image/voice input, emotion/dynamism controls), the prompt-builder logic for varied animation, and an implementation plan. (~2k words) |
| `research.md` | Research on integrating HeyGen's video API: two workflows (dynamic image upload vs. pre-loaded avatars), endpoint mapping, payload examples, and auth flow. (~800 words) |

## For AI Agents

### Working In This Directory
- Treat these as the source of intent for `src/lib/prompt-builder.ts` (Seedance) and the HeyGen feature (`src/components/heygen-tab.tsx`, `src/lib/heygen.ts`).
- If you change prompt-composition behavior or provider payloads, update the relevant spec here so it stays in sync.
- Docs may lag the code — when they conflict, the code is authoritative; note the discrepancy.

### Common Patterns
- Markdown specs with parameter-mapping tables and example payloads.

## Dependencies

### Internal
- Describes behavior implemented in `src/lib/` and `src/components/`.

### External
- References KIE.ai (Seedance) and HeyGen APIs.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
