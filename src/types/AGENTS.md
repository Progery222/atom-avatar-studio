<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# types

## Purpose
TypeScript contracts for the provider APIs — request/response shapes and discriminated unions shared between `src/lib/*` clients, `src/app/api/*` handlers, and the UI. Pure type declarations, no runtime code.

## Key Files

| File | Description |
|------|-------------|
| `gpt-image.ts` | GPT-Image contracts: `GptImageGenerationMode`, `GptImageAspectRatio`, `GptImageResolution`, `GptImageGenerateRequest`, `GptImageTaskResponse`/`GptImageResult`, `GptImageTaskStatus`, `GptImageCreditsResponse`. |
| `heygen.ts` | HeyGen v3 contracts: `HeyGenImageInput`, `HeyGenVoiceSettings`, `HeyGenEngineSettings` (elevenlabs/fish/starfish), `HeyGenBackground`, `HeyGenCreateVideoRequest` (from-image / from-avatar discriminated union), responses, `HeyGenVoice`/`HeyGenVoicesResponse`, `HeyGenBalanceResponse`, `HeyGenError`. |

## For AI Agents

### Working In This Directory
- These mirror the **external provider API contracts** — change them only when the provider's payload changes, and update `@/lib/heygen.ts` / `@/lib/gpt-image.ts` together.
- Several types are **discriminated unions** (e.g. HeyGen create-video from-image vs from-avatar, engine settings). Preserve the discriminant fields; narrow on them rather than casting.
- No `as any` / `@ts-ignore` — strict mode is on. If a provider field is genuinely optional, model it as optional here.

### Common Patterns
- Union types for fixed option sets (resolutions, aspect ratios, statuses) — kept consistent with the value lists in `@/constants/*`.

## Dependencies

### Internal
- None (leaf modules). Imported by `@/lib/gpt-image`, `@/lib/heygen`, and components.

### External
- None.

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
