# Stage 5A5 Mindmap Review Helper Split Exec Plan

## Goal

Continue behavior-preserving modularization of the extracted map runtime by moving pure review helper logic out of `public/prototypes/current/mindmap.js`.

## Scope

- Keep `public/prototypes/current/mindmap.html` as the route shell and `public/prototypes/current/mindmap.js` as the only browser entrypoint loaded by HTML.
- Add `public/prototypes/current/mindmapReviewHelpers.js` for review normalization, queues, stats, text labels, card generation, and visual-state normalization.
- Keep review panel DOM rendering, event listeners, session mutation, save/persist calls, highlighting application, keyboard handling, storage/autosave, gestures, and map rendering inside `mindmap.js`.
- Preserve current runtime review-store semantics, including generated IDs/timestamps for missing persisted fields and `attemptCount` fallback to `1`.
- Do not wire Stage 5A1 or Stage 5A3 TypeScript helpers into the browser runtime.
- Do not edit Accessible Reader.

## Implementation

- Extract pure review helpers into `mindmapReviewHelpers.js`, importing only static constants and pure utilities from the Stage 5A4 modules.
- Update `mindmap.js` to keep small wrappers that inject `runtimePageId`, `currentMapViewId()`, current attempts/sessions, map nodes/edges, and document records into the pure helpers.
- Update `scripts/doctor.mjs` and static Playwright coverage so the review helper module is part of the harness contract.
- Add `tests/e2e/mindmap-review-helper-extraction.spec.ts` to exercise review normalization, latest-attempt selection, weak-card and Review next ordering, stats/history text, generated block/relationship/neighbor/source cards, and DOM-free visual-state validation.

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
npx playwright test tests/e2e/mindmap-review-helper-extraction.spec.ts
npx playwright test tests/e2e/mindmap-runtime-extraction.spec.ts
npx playwright test tests/e2e/runtime-portable-snapshot-parity.spec.ts
npx playwright test tests/e2e/learning-map-portable-contract.spec.ts
```

Also verify the GitHub Pages build output contains `prototypes/current/mindmapReviewHelpers.js` and that `mindmap.js` imports it with a relative path.

## Handoff Notes

Record before/after `mindmap.js` size and line counts, helper module size, changed files, check results, smoke screenshots, and artifact paths. The next modularization slice should split one additional subsystem at a time, such as storage/autosave or a small rendering/layout helper boundary.
