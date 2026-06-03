<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-03 | Updated: 2026-06-03 -->

# __tests__

## Purpose
Vitest test suite. Coverage currently centers on the **GPT-Image** feature — the API client, the generate route handler, and the pricing/constraint constants. Run with `npm test`.

## Key Files

| File | Description |
|------|-------------|
| `setup.ts` | Global test setup — imports `@testing-library/jest-dom` matchers. Referenced by `vitest.config.ts`. |
| `gpt-image/api-client.test.ts` | Unit tests for `@/lib/gpt-image`: `createGptImageTask` (text/image modes), `pollGptImageTask`, `getGptImageCredits`. Mocks `fetch`, stubs `KIE_API_KEY`, asserts the KIE `createTask` request and 401/402/500 error handling. |
| `gpt-image/generate-route.test.ts` | Tests `POST /api/gpt-image/generate`: required fields, invalid combos (1:1+4K, auto+2K) → 400, success → 200 with `taskId`. Mocks `@/lib/gpt-image` via `vi.mock`. |
| `gpt-image/constraints.test.ts` | Asserts `GPT_IMAGE_CONSTRAINTS` (invalid aspect/resolution combos, auto-resolution limit). No mocking. |
| `gpt-image/pricing.test.ts` | Asserts `GPT_IMAGE_PRICING` credit costs (1K=2, 2K=3, 4K=5). No mocking. |

> The `gpt-image/` subfolder is documented here (single small feature group) rather than with its own `AGENTS.md`.

## For AI Agents

### Working In This Directory
- Config lives in repo-root `vitest.config.ts`: `jsdom` environment, `globals: true` (no need to import `describe`/`it`/`expect`), `setupFiles: ./src/__tests__/setup.ts`, and the `@` → `./src` alias.
- Mocking toolkit: `vi.stubEnv()` (+ `vi.unstubAllEnvs()` cleanup) for env vars, `global.fetch = vi.fn().mockResolvedValue(...)` for HTTP, `vi.mock('@/lib/...')` + `vi.mocked(fn).mockResolvedValue(...)` for module/function stubs, and the standard `Request` constructor to build route inputs.
- When adding tests for other features (KIE video, HeyGen, TTS), mirror these patterns; keep constants tests (`pricing`, `constraints`) in lockstep with `@/constants/*`.

### Testing Requirements
- `npm test` must pass before reporting done, alongside the `npx next build` / `npx tsc --noEmit` gates.

### Common Patterns
- Route handlers are tested by constructing a `Request` and invoking the exported `POST`/`GET` directly with provider `lib` functions mocked.

## Dependencies

### Internal
- `@/lib/gpt-image`, `@/constants/gpt-image`, `@/app/api/gpt-image/generate/route`

### External
- `vitest`, `@testing-library/jest-dom`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
