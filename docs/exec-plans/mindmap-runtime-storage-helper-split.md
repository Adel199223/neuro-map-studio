# Stage 5A6 Mindmap Storage Helper Split Exec Plan

## Goal

Continue behavior-preserving modularization of the map runtime by moving pure map storage, serialization, import/export payload, and autosave scheduling helpers out of `public/prototypes/current/mindmap.js`.

## Scope

- Keep `public/prototypes/current/mindmap.html` as the route shell and `public/prototypes/current/mindmap.js` as the only browser entrypoint loaded by HTML.
- Add `public/prototypes/current/mindmapStorageHelpers.js` for map/workspace normalization, legacy fallback loading, seeded localStorage mirroring, page-state payloads, workspace export payloads, imported page creation, safe filenames, and autosave debouncing.
- Keep DOM-bound FileReader/download/status handling and IndexedDB `savePageState` calls inside `mindmap.js`.
- Preserve storage keys, page-state shape, JSON backup/import/export behavior, autosave timing, routes, and UI behavior.
- Do not wire Stage 5A1 or Stage 5A3 TypeScript helpers into the browser runtime.
- Do not edit Accessible Reader.

## Implementation

- Extract low-risk storage helpers into `mindmapStorageHelpers.js`, importing only storage constants, static map constants, and pure utility/math helpers.
- Update `mindmap.js` to call the extracted helpers through small runtime wrappers for `persistWorkspaceState`, `save`, `saveReviewState`, `exportMap`, `exportWorkspace`, and `importMap`.
- Update `scripts/doctor.mjs` and static Playwright coverage so the storage helper module is part of the harness contract.
- Add `tests/e2e/mindmap-storage-helper-extraction.spec.ts` to exercise normalization, fallback loading, payload wire shapes, import-page semantics, safe filenames, autosave scheduling, and seeded localStorage mirroring.

## Verification

Run:

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
git diff --check
```

Focused specs:

```bash
npx playwright test tests/e2e/mindmap-storage-helper-extraction.spec.ts
npx playwright test tests/e2e/mindmap-runtime-extraction.spec.ts
npx playwright test tests/e2e/mindmap-review-helper-extraction.spec.ts
npx playwright test tests/e2e/prototype.spec.ts --grep "backup|import|export|legacy localStorage|map review|Review Next|keyboard shortcuts"
```

Also verify the GitHub Pages build output contains `prototypes/current/mindmapStorageHelpers.js` and that `mindmap.js` imports it with a relative path.

## Handoff Notes

Record before/after `mindmap.js` size and line counts, helper module size, changed files, check results, smoke screenshots if captured, and artifact paths. The next modularization slice should split one additional subsystem at a time, such as rendering/layout or relationship-editing helpers.
