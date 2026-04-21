# ExecPlan: Extract Learning-Map Workspace Core

## Goal

Create a pure TypeScript workspace core that accepts current and legacy prototype payloads, normalizes them into the repo’s canonical `LearningWorkspace`, preserves localStorage and export compatibility, and gives later React map work a stable state boundary without changing the current standalone prototype UI.

## Current behavior

- `public/prototypes/current/mindmap.html` still owns all persistence logic:
  - `normalizeMap` and `normalizeWorkspace` around lines `487-587`
  - debounced autosave around `588-599`
  - page create/duplicate/rename/delete around `626-669`
  - workspace export/import around `1091-1116`
- The current autosave key is `simon-dixon-debt-power-learning-workspace-v20-clean-connectors`.
- Legacy keys are the six values defined next to that key in the prototype.
- The repo already has typed models in `src/features/learning-map/types.ts` and a seed workspace in `src/data/simonDixonSeed.ts`, but no modular persistence layer.
- Baseline checks from the WSL repo:
  - `npm run doctor` passes
  - `npm run typecheck` passes
  - `npm run test:e2e` passes
  - `npm run lint` fails before this feature because `scripts/doctor.mjs` is linted without Node globals

## Desired behavior

- Add a pure module in `src/features/learning-map/` that exports:
  - `normalizeMap`
  - `normalizeWorkspace`
  - `loadWorkspace`
  - `saveWorkspace`
  - `createPage`
  - `duplicatePage`
  - `renamePage`
  - `deletePage`
  - `parseImportedWorkspace`
  - `serializeWorkspaceExport`
- Add helper exports for `StorageLike`, compatibility payload shapes, and the current plus legacy storage keys.
- Keep `LearningWorkspace` as the internal canonical shape with `schemaVersion: 1`.
- Keep the standalone prototype files untouched in this slice.

## Constraints

- Preserve current user-approved behavior unless this task explicitly changes it.
- Keep the current prototype as the regression oracle.
- Preserve autosave and import/export compatibility or add explicit regression coverage where behavior differs.
- No new production dependencies.
- Keep the UI and interaction contract unchanged; this is a state-layer slice only.
- Work only from a WSL repo path such as `~/projects/neuro-map-studio-codex`.
- Do not rely on Git state for done checks because this extracted harness does not currently include a `.git` directory.

## Implementation steps

1. Record this ExecPlan in `docs/exec-plans/learning-map-workspace-core.md`.
2. Add a new pure `workspaceCore` module under `src/features/learning-map/` and move the prototype’s normalization, compatibility constants, page operations, and import/export shaping into pure functions.
3. Reuse `seedWorkspace` as the fallback/default source instead of duplicating default map data.
4. Keep the module DOM-free and timer-free; debouncing stays outside the core for now.
5. Add a data-focused Playwright spec in `tests/e2e/` for workspace-core behavior without using a browser page fixture.
6. Add the smallest necessary ESLint config adjustment so `scripts/doctor.mjs` is treated as a Node script and repo verification can pass.

## Test plan

- Add regression coverage for:
  - blank and invalid current autosave payloads falling back to the seed workspace
  - legacy single-map payloads migrating into a safe one-page workspace
  - legacy multi-page payloads loading with all page views reset
  - page create/duplicate/rename/delete semantics
  - deleting the last page being prevented
  - full-workspace export round-tripping without losing pages, nodes, edges, labels, ports, or relation metadata
  - single-map imports becoming a new page titled from the file name
  - autosave serialization using the current storage key and compatibility payload shape
- Keep `tests/e2e/prototype.spec.ts` unchanged and green.
- Verify with:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:e2e`

## Risks and rollback

- Main risk: migration mistakes could silently erase or reshape user content.
- Secondary risk: page CRUD semantics could drift from the prototype if copied loosely.
- Tertiary risk: autosave and full export use different outer version markers in the prototype, so compatibility code must preserve that split.
- Rollback is simple because this slice is additive: remove the new module and tests, keep the prototype as the only active behavior source.

## Completion checklist

- `docs/exec-plans/learning-map-workspace-core.md` exists.
- `src/features/learning-map/workspaceCore.ts` exists and matches the planned API.
- Prototype files remain unchanged.
- New regression tests exist and pass.
- Lint passes with the minimal Node-script config fix.
- Final reporting notes that the repo is a zip-extracted harness without `.git`, so Git diff and status are unavailable.
