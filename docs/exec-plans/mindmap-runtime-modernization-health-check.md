# Stage 5A7 Mindmap Runtime Modernization Health Check

## Summary

Stage 5A7 audits the current map runtime after the Stage 5A2 through Stage 5A6 extraction sequence. It is docs-only and does not alter runtime files, tests, storage keys, routes, backup/import behavior, UI behavior, or Accessible Reader.

Current baseline:

- `main` / `origin/main`: `3768d09430ce8bcde1c5b5a49c158c240ed69ece`
- `mindmap.js`: 5,452 lines, 273,417 bytes
- Extracted helper modules: constants, DOM utilities, geometry, review helpers, and storage helpers
- Accessible Reader: read-only status confirmation only

## Method

The health check inspected:

- route/runtime file sizes and helper module exports;
- `mindmap.js` import surface and remaining function clusters;
- doctor and ESLint coverage;
- existing Playwright and pure helper coverage;
- known transient tests from recent verification runs;
- compatibility relevance against the Stage 5A0 through Stage 5A3 portable contract direction.

The detailed architecture findings live in `docs/architecture/mindmap-runtime-modernization-health.md`.

## Findings

- The previous extraction slices have created useful pure helper seams while keeping `mindmap.js` as the only browser entrypoint.
- `mindmap.js` still owns high-coupling systems: rendering, placement, gestures, selection, document workbench, relationship editing, runtime side-effect wiring, and page initialization.
- The safest next slice should avoid DOM geometry and pointer/S Pen flows because recent transient failures cluster around port placement and high-zoom placement assertions.
- Storage and review pure helper extraction already landed. The remaining storage/review runtime wiring is more side-effectful and should not be split before lower-risk data helpers.
- TypeScript contract/runtime adapter wiring is valuable later, but too risky immediately because it would connect live runtime persistence and review behavior to the pure Stage 5A1/5A3 helper baseline.

## Recommended Next Slice

Primary recommendation: **relationship editing helper split**.

Branch name: `mindmap-runtime-relationship-helper-split`

New module: `public/prototypes/current/mindmapRelationshipHelpers.js`

Extract only pure or dependency-injected relationship helpers:

- duplicate and self-link decisions;
- edge metadata patch helpers for relation, strength, shape, label, ports, and reverse;
- endpoint-change transforms that preserve relationship metadata;
- Insert block between node and replacement edge payload builders;
- relationship insert candidate helpers only when they avoid DOM reads.

Keep in `mindmap.js`:

- pointer targeting, S Pen/touch handling, reconnect banners, and connect target taps;
- DOM selection, toolbar/context-menu rendering, prompts, notification bubbles, render calls, save calls, and history commits;
- review-attempt clearing wrappers;
- DOM/overlay geometry and placement routines that read live element bounds.

Why this is next:

- Relationship metadata is central to future Accessible Reader compatibility.
- Existing tests already cover reconnect, Insert block between, duplicate prevention, metadata preservation, undo/redo, review-card refresh, and selected relationship controls.
- A data-only extraction can be meaningfully verified with pure helper tests without touching risky placement or gesture systems.

Fallback: **menu/context-menu helper split**. This has lower compatibility value, but it is compact and lower risk if relationship editing proves too coupled during implementation.

Explicitly defer:

- rendering helper split;
- gesture/input split;
- storage side-effect wrapper split;
- review runtime wiring split;
- runtime-to-portable TypeScript helper wiring.

## Required Verification For This Health Check

Because Stage 5A7 is docs-only, run:

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

Expected Playwright shape remains the Stage 5A6 baseline unless unrelated upstream changes land:

- 314 project-runs
- 309 passed
- 5 expected conditional skips

## Ready-To-Use Next Prompt

Use this prompt after Stage 5A7 is reviewed and accepted:

```text
We are starting Stage 5A8: Extract pure relationship editing helpers from mindmap.js.

Repo:
/home/fa507/dev/neuro-map-studio-codex

Accessible Reader repo for read-only status confirmation only:
/home/fa507/dev/accessible_reader

Current expected baseline:
- Neuro Map Studio main and origin/main should match the Stage 5A7 health-check branch once merged.
- Stage 5A0 through Stage 5A7 are on main.
- mindmap.js remains the browser entrypoint.
- Accessible Reader remains separate and must stay read-only.

Important:
- Do not integrate NeuroMap into Accessible Reader.
- Do not edit Accessible Reader.
- Do not change runtime/UI behavior, routes, storage keys, backup/import behavior, or GitHub Pages deployment.
- Do not rewrite NeuroMap in React or convert mindmap.js to TypeScript.
- Do not wire Stage 5A1/5A3 TypeScript helpers into runtime.
- Do not split rendering, gesture/input, storage, review UI wiring, or document/source picker systems in this slice.
- Do not push, merge, rebase, squash, force-push, delete branches, or run package:review/package:verify unless explicitly asked.

Goal:
Extract only pure or dependency-injected relationship editing helpers from public/prototypes/current/mindmap.js into public/prototypes/current/mindmapRelationshipHelpers.js while preserving behavior exactly.

Before editing:
1. Confirm clean main and pull with --ff-only.
2. Confirm Stage 5A7 docs exist.
3. Confirm Accessible Reader status/SHA read-only.
4. Create branch mindmap-runtime-relationship-helper-split.
5. Read docs/architecture/mindmap-runtime-modernization-health.md and docs/exec-plans/mindmap-runtime-modernization-health-check.md.
6. Inspect current relationship functions in mindmap.js around addEdge, directedEdgeBetween, reverseEdge, setEdgeRelation, setEdgeStrength, setEdgeShape, setEdgePort, splitRelationshipEdge, insertBlockBetweenRelationship, startReconnect, completeReconnectToBlock, startConnect, and completeConnectToBlock.

Implementation:
- Add public/prototypes/current/mindmapRelationshipHelpers.js as a lint-clean plain browser ESM module.
- Extract only pure helpers that operate on plain nodes, edges, IDs, ports, labels, relation metadata, and candidate objects.
- Good exports: duplicate/self-link decisions, edge metadata update helpers, reverse-edge transform, endpoint-change transform, relationship insert node/edge payload builder, and review cleanup ID helper inputs.
- Keep DOM reads, pointer targeting, toolbar/context-menu rendering, prompt calls, render/save/history/toast calls, and S Pen/touch flows in mindmap.js.
- Update mindmap.js imports and replace only the moved pure logic.
- Update scripts/doctor.mjs and tests/e2e/mindmap-runtime-extraction.spec.ts to require the new module and verify mindmap.js imports it.
- Add tests/e2e/mindmap-relationship-helper-extraction.spec.ts for pure helper behavior.
- Do not change product behavior.

Focused tests:
- npx playwright test tests/e2e/mindmap-relationship-helper-extraction.spec.ts --reporter=list
- npx playwright test tests/e2e/mindmap-runtime-extraction.spec.ts --reporter=list
- npx playwright test tests/e2e/prototype.spec.ts --grep "relationship|Insert block|Change source|Change target|Review Next and relationship masking|selected link toolbar" --reporter=list
- npx playwright test tests/e2e/runtime-portable-snapshot-parity.spec.ts --reporter=list
- npx playwright test tests/e2e/learning-map-portable-contract.spec.ts --reporter=list

Full checks:
- npm run doctor
- npm run typecheck
- npm run lint
- npm run build
- GITHUB_PAGES=true npm run build
- npm run test:e2e
- npm run check
- git diff --check

Artifacts:
- Create /home/fa507/Downloads/neuro-stage5a8-mindmap-relationship-helper-split/.
- Include status files, Accessible Reader status, branch commits, changed files, diff stat, patch, size report, helper inventory, test logs, focused summary, copied changed files, and smoke screenshots for relationship editing flows.
- Create review ZIP only: /home/fa507/Downloads/neuro-stage5a8-mindmap-relationship-helper-split-share.zip.

Commit locally after checks pass:
- git commit -m "refactor: extract mindmap relationship helpers"
```

