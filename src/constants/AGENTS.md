<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# constants

## Purpose
Centralized configuration data for every AI provider integration: voice catalogs, preset options (emotions, camera moves, lighting, scene styles), aspect-ratio/resolution choices, pricing/credit maps, request limits, default settings, and HTTP→user-facing error-message maps (mostly Russian). UI components import these to populate selectors; route handlers import them to validate requests and translate errors. Pure data + interfaces, no logic and no imports.

## Key Files

| File | Description |
|------|-------------|
| `models.ts` | `AI_MODELS` catalog (Seedance 2.0 Fast, Kling Standard, Kling Pro) with capability flags + `CAMERA_EFFECTS`. |
| `presets.ts` | Seedance presets consumed by `prompt-builder`: `SEEDANCE_EMOTIONS`, `SEEDANCE_CAMERA_EFFECTS`, `SEEDANCE_LIGHTING`. |
| `gpt-image.ts` | GPT-Image config: aspect ratios, resolutions, `GPT_IMAGE_PRICING`, `GPT_IMAGE_CONSTRAINTS` (invalid combos), model IDs, limits, error messages. |
| `heygen.ts` | HeyGen config: resolutions, aspect ratios, voice speed/pitch ranges, limits, pricing, languages, genders, defaults, expressiveness levels, motion prompts, error messages. |
| `gemini-tts.ts` | Google Cloud TTS config: voice types/catalog, audio tags, scene styles, speaking rates, pitch, encodings, sample rates, locales, defaults. |
| `gemini-flash-tts.ts` | Gemini 3.1 Flash TTS config: `GEMINI_FLASH_VOICES` (30), audio tags, 23 languages, default config, preview texts + `getPreviewText()`. |

## For AI Agents

### Working In This Directory
- This is the **single source of truth** for selectable options, pricing, limits, and error copy. Add/change options here rather than hardcoding in components or routes.
- `GPT_IMAGE_CONSTRAINTS` and `*_LIMITS` are enforced in both UI and the corresponding `app/api` route — update both call sites when changing them, and keep `__tests__/gpt-image/constraints.test.ts` and `pricing.test.ts` in sync.
- `*_ERROR_MESSAGES` map provider/HTTP codes to user-facing (Russian) text; the matching `*ApiError.code` in `@/lib` is the lookup key.
- Files export plain consts/interfaces only — no runtime logic (except simple helpers like `getPreviewText`).

### Testing Requirements
- `GPT_IMAGE_PRICING` and `GPT_IMAGE_CONSTRAINTS` are asserted directly in `src/__tests__/gpt-image/`. Run `npm test` after editing them.

### Common Patterns
- Each constant is paired with an interface/union type describing its items.
- Naming convention: `SCREAMING_SNAKE_CASE` for the data, with a `<PROVIDER>_<THING>` prefix.

## Dependencies

### Internal
- None (leaf modules). Consumed by `@/lib/prompt-builder`, `src/components/*`, and `src/app/api/*`.

### External
- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
