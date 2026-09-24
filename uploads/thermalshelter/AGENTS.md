# Project Guidance

## User Preferences

- Mobile app form factor
- Target interior temperature of +15C for fuel calculations
- Cost objective in INR; fuel objective in litres of kerosene per 24h
- Airlift sizing at 250 kg sling load for Cheetah / ALH Dhruv
- ASHRAE-55 comfort at 2.5 clo and 1.2 met
- Offline fallback climate profiles for four named operational sectors

## Verified Commands

- **typecheck**: `mops check --fix`
- **build**: `mops build`

## Learnings

- Motoko has no triple-quoted multi-line text literal: `"""` lexes as an empty Text followed by a new string opener (M0097). Return long static Markdown as `#`-concatenated regular string literals with explicit `\n` escapes.
- `label` is a Motoko reserved keyword and cannot be a record field — rename it (e.g. `caption`) consistently across types, migration, and every payload reference.
- OQL `.flatten(extract)` requires the nested record's own fields to be flat; a nested record containing a variant fails M0230. Declare each nested scalar as an explicit `.payload(...)` column and render the variant as a Text literal.
- Under Enhanced Migration, a stable actor field with an inline initializer fails M0250 and a field absent from the previous version fails M0267 — declare the field type-only in the actor and add it to the pending migration's NewActor with its initial value.
- Route wrappers in App.tsx own AppLayout; page components must export bare body content or the header/footer/bottom-nav stack twice.
- Zustand store is the handoff channel between pages: shared config and fetched live data must be read from the store, not rebuilt from local defaults.
- When filtering degenerate triangles out of a facet list, carry the source triangle index on each facet so downstream position indexing stays aligned.
- Custom CSS utilities referencing var(--token) silently no-op unless the token is defined in :root; define both dark and .light variants.
- Biome rules: useSemanticElements rejects role="radio"/"radiogroup" on buttons (use a fieldset with native radio inputs); useFocusableInteractive rejects role="progressbar" on a non-focusable div; unused imports are failures.
- Vite bundles a module worker from `new Worker(new URL('../../workers/x.worker.ts', import.meta.url), { type: 'module' })` and emits a separate chunk; the worker can import `@/lib/*` aliases.
