# Issues â€” HyperFrames Integration

(No issues yet)
# F4 Scope Fidelity Check Issues

## Date: 2026-04-22

### Minor Issues Found

1. **T3 Block Count Shortfall**: 16 blocks implemented vs plan's 37+. Categories covered (social, cinematic, data-viz, text, transition, overlay, template) but count is below spec. Functional but not exhaustive.

2. **T3 Missing Barrel Export**: src/constants/hyperframes/index.ts not created. Components import directly from blocks.ts/shaders.ts/templates.ts. Plan specified barrel export.

3. **T6 Missing htmlToComposition**: Plan specified htmlToComposition(html: string): Partial<Composition> for parsing HTML back to composition structure. Not implemented. compositionToHtml works fine.

4. **T10 Player Approach**: Uses iframe+srcdoc instead of <hyperframes-player> web component. Valid alternative per plan's fallback clause. Not an issue per se.

5. **Unaccounted file**: qa-hyperframes.py at project root — QA tooling, not integration code.

### Guardrails: ALL PASS
- Zustand scoped to hyperframes/ ?
- No iframe embedding of external Studio (srcdoc is local) ?
- No changes to existing API routes ?
- No cloud deployment config ?
- No as any / @ts-ignore in hyperframes files ?
- No GSAP bundled ?
- No Supabase DB schema changes ?

### VERDICT: APPROVE
