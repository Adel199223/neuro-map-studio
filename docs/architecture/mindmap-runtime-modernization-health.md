# Mindmap Runtime Modernization Health

Stage 5A7 is an evidence-based health check for the current map runtime after the Stage 5A2 through Stage 5A6 extraction slices. It is docs-only: no runtime files, tests, storage keys, routes, backup/import behavior, UI, Accessible Reader files, or TypeScript contract wiring are changed.

## Current Module Inventory

Baseline inspected on `main` at `3768d09430ce8bcde1c5b5a49c158c240ed69ece`.

| File | Lines | Bytes | Role |
| --- | ---: | ---: | --- |
| `public/prototypes/current/mindmap.html` | 324 | 23,407 | Route shell and DOM surface for the map runtime. |
| `public/prototypes/current/mindmap.css` | 455 | 40,666 | Map runtime styles externalized in Stage 5A2. |
| `public/prototypes/current/mindmap.js` | 5,452 | 273,417 | Browser entrypoint; still owns app state, DOM wiring, rendering, gestures, relationship editing, and runtime side effects. |
| `public/prototypes/current/mindmapConstants.js` | 95 | 7,825 | Static visual, review, input, history, and port constants. |
| `public/prototypes/current/mindmapDomUtils.js` | 35 | 1,028 | Pure string and DOM-target classification helpers. |
| `public/prototypes/current/mindmapGeometry.js` | 99 | 3,980 | Pure math and edge geometry helpers. |
| `public/prototypes/current/mindmapReviewHelpers.js` | 486 | 19,702 | Pure review store, card, queue, stats, and visual-state helpers. |
| `public/prototypes/current/mindmapStorageHelpers.js` | 218 | 8,117 | Pure storage normalization, page-state payload, import/export payload, and autosave scheduling helpers. |

### Helper Exports

`mindmapConstants.js` exports color, shape, node type, size preset, relationship style, edge shape, port, review label, input timing, nudge, history, hit-width, and default-map constants.

`mindmapDomUtils.js` exports `clean`, `cloneJson`, `escapeHtml`, `isTouchLikePointer`, `isTouchGesturePointer`, `isEditingElement`, and `isCanvasGestureBlockedTarget`.

`mindmapGeometry.js` exports `clamp`, `marqueeRectFromPoints`, `rectsOverlap`, `distance`, `autoPort`, `sideVector`, `portPoint`, `cubicPoint`, `quadPoint`, and `edgeGeometry`.

`mindmapReviewHelpers.js` exports review ID generation, review store/filter normalization, attempt ordering helpers, latest-attempt lookup, weak-card queue, Review Next queue, review stats/history text, relationship review-card IDs, relationship-attempt filtering, visual-state normalization, map review-card generation, and review label constants.

`mindmapStorageHelpers.js` exports map/workspace normalization, page/import helpers, storage fallback/mirror helpers, map page-state payload and workspace export payload builders, safe filenames, and autosave scheduling.

### Entry Imports, Doctor, And ESLint

`mindmap.js` imports from `workspace-store.js`, `mindmapConstants.js`, `mindmapDomUtils.js`, `mindmapGeometry.js`, `mindmapReviewHelpers.js`, and `mindmapStorageHelpers.js`. The HTML still loads only `mindmap.js` as the browser entrypoint.

`scripts/doctor.mjs` checks the map route files and all five helper modules. It verifies that `mindmap.js` imports the helper modules and checks representative exported markers in each helper.

`eslint.config.js` still ignores `public/prototypes/current/mindmap.js`. The extracted helper modules are not ignored and are expected to stay lint-clean.

## Remaining `mindmap.js` Function Inventory

The remaining function inventory is approximate and grouped by line-range and responsibility.

| Subsystem | Approx. function count | Representative functions | Notes |
| --- | ---: | --- | --- |
| Debug/input diagnostics | 17 | `formatDebugNumber`, `logInputDebug`, `copyInputDebugEntries` | DOM-bound diagnostics and local debug storage remain in the entrypoint. |
| Storage/review wrappers | 24 | `persistWorkspaceState`, `save`, `mapPageStatePayload`, `saveReviewState` | Pure storage helpers were extracted, but IndexedDB, status, and current page sync stay here. |
| Review UI wiring | 13 | `renderReviewPanel`, `startReviewSession`, `rateCurrentReviewCard` | Pure card/queue logic is extracted; DOM rendering and mutation stay here. |
| Runtime init/page controls | 10 | `initializeRuntimePage`, `switchPage`, `createNewPage` | Coupled to workspace store, route state, and view restoration. |
| Selection/history foundations | 41 | `setSelectionFromIds`, `commitMapCommand`, `undoMapCommand` | State-heavy and central to editing safety. |
| Placement/layout/overlay safety | 48 | `findFreeNodePlacement`, `panNodeIntoSafeArea`, `updateOverlayOffsets` | High value but coupled to viewport geometry and recent port-placement flakes. |
| Gesture/input handling | 30 | `startLongPress`, `beginCanvasPan`, `updateTouchGesture` | Tablet/S Pen sensitive, DOM and pointer-state heavy. |
| View/zoom/recovery | 23 | `applyView`, `zoomAt`, `recoverViewIfBlank` | Directly affects blank-canvas and pan/zoom regression risks. |
| Rendering/selection shelf | 12 | `render`, `renderNodes`, `renderEdges`, `positionSelectionShelf` | DOM-heavy and visually sensitive. |
| Selection/editing/clipboard | 25 | `pasteClipboardPayload`, `duplicateSelection`, `deleteSelection` | Mutates map state and history; reasonably covered by prototype tests. |
| Port quick-add/connect target | 27 | `choosePortLinkedPosition`, `openPortQuickAddMenu`, `startConnectTargetTap` | High user value but recurring flake family; keep stable for now. |
| Document/source/workbench placement | 38 | `renderWorkbench`, `addDocumentBlock`, `openDocumentDetail` | Coupled to project documents, DOM panels, and placement safety. |
| Relationship editing | 30 | `addEdge`, `directedEdgeBetween`, `splitRelationshipEdge`, `insertBlockBetweenRelationship`, `startReconnect` | Strong candidate for a data-only helper split if DOM and pointer targeting stay in `mindmap.js`. |
| Import/export/reset | 6 | `downloadJson`, `exportMap`, `importMap`, `resetMap` | DOM/FileReader/download side effects; pure payload helpers already extracted. |
| Menus/context menus/actions | 6 | `showMenu`, `nodeMenu`, `edgeMenu`, `runMenuAction` | Compact and lower risk, but lower compatibility value. |
| Side panels/final wiring | 6 | `toggleFocus`, `openSidePanel`, `toggleLegend` | Small and UI-bound. |

## Subsystem Risk Matrix

| Candidate slice | Globals touched | Mutates state | DOM/storage coupling | Focused coverage | Recent flake exposure | Tablet/S Pen sensitive | Contract/storage/review sensitivity | Risk | Extraction value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Relationship editing helpers | Medium | Yes | Medium | Strong prototype coverage for reconnect, Insert block between, undo/redo, duplicate prevention, review clearing | Some selected-relationship Insert block assertion history | Medium | High for portable relationship contract and review card IDs | Medium | High |
| Menu/context-menu helpers | Medium | Indirect | High DOM, low storage | Covered through many interaction tests, no pure focused helper yet | Low direct flake exposure | Medium | Low | Low-medium | Medium |
| Document/source block helpers | Medium | Yes | High DOM/project document coupling | Good workbench/document block tests | Low direct flake exposure | Medium | Medium for document refs | Medium | Medium |
| Rendering helpers | High | Yes | Very high DOM/SVG coupling | Broad smoke coverage, little pure focused coverage | Medium through visual placement assertions | Medium | Medium | High | High |
| Selection/toolbar helpers | High | Yes | High DOM and history coupling | Good selection, toolbar, clipboard, nudge tests | Selected-link toolbar has had transient exposure | Medium | Low-medium | Medium-high | Medium |
| Gesture/input helpers | High | Yes | Very high pointer DOM coupling | Broad touch/pen tests and debug diagnostics | Port quick-add/high-zoom flake family nearby | High | Low-medium | High | High but unsafe now |
| Storage side-effect wrapper split | Medium | Yes | High IndexedDB/status side effects | Strong storage helper, workspace core, backup/import tests | Low | Low | High storage sensitivity | Medium-high | Low after Stage 5A6 |
| Review runtime wiring split | Medium | Yes | High DOM/session/save coupling | Strong helper and prototype review tests | Low | Low-medium | High review sensitivity | Medium | Medium; Stage 5A5 already captured pure logic |
| Runtime-to-portable helper wiring | High | Yes | High contract, storage, review, runtime state coupling | Strong pure parity tests, no runtime wiring tests yet | Unknown | Medium | Very high | High | High but premature |
| Test/flake hardening only | Low | No product mutation | None if tests only | Directly targets known flakes | High relevance | Medium | Low | Low | Medium |

## Test Coverage And Flake Inventory

Existing focused coverage is strong for the current extraction path:

- `mindmap-runtime-extraction.spec.ts`: HTML/CSS/JS extraction, helper module imports, route smoke.
- `mindmap-review-helper-extraction.spec.ts`: review store normalization, latest attempt ordering, weak/next queue, stats/history, card generation, visual state normalization.
- `mindmap-storage-helper-extraction.spec.ts`: map/workspace normalization, storage fallback, page-state and export payloads, imported page append, safe filenames, autosave debounce.
- `learning-map-portable-contract.spec.ts`: portable contract normalization, validation, review queues, card filters, Accessible Reader preview mapping.
- `runtime-portable-snapshot-parity.spec.ts`: runtime page-state to portable snapshot/bundle parity, relationship/document/review metadata, invalid relationship reporting, no mutation.
- `workspace-core.spec.ts`: TypeScript workspace normalization/import/export and autosave serialization.
- `prototype.spec.ts`: broad runtime coverage for relationship editing, port quick-add, Insert block between, review mode, Review Next, backup/import/export, legacy localStorage migration, selection, keyboard shortcuts, touch/pen gestures, and debug input diagnostics.

Obvious gaps before larger runtime splits:

- No pure helper tests yet for relationship mutation transforms.
- Rendering and placement remain mostly covered by browser-level assertions, not pure focused tests.
- Menu/context-menu construction has broad interaction coverage but no direct item-shape tests.
- Gesture/input is intentionally browser-level only and should stay that way until a smaller seam appears.

Known recurring or recent transients:

- Chromium port quick-add clear-slot and high-zoom placement tests can intermittently fail but pass isolated reruns.
- A selected-relationship Insert block assertion has appeared transiently in earlier full-suite runs.
- Keyboard shortcut while editing block text has been noted as a sensitive regression path.
- Parallel focused Playwright invocations can contend for the same Vite port; run focused suites sequentially.

These flakes argue against choosing placement, rendering, or gesture/input as the immediate next split. They do not block a narrow relationship helper split if it avoids pointer targeting and geometry-heavy placement behavior.

## Accessible Reader Compatibility Relevance

- Relationship editing helpers: high relevance. Accessible Reader compatibility depends on preserving relationship endpoints, labels, relation type, strength, route, and port metadata without confusing graph semantics with visual layout.
- Rendering helpers: medium relevance. Rendering must keep layout separate from graph meaning, but it does not directly advance portable data compatibility.
- Selection/toolbar helpers: low-medium relevance. Useful for runtime maintainability, but not a portable contract boundary.
- Gesture/input helpers: low-medium relevance. Important for tablet quality but not directly related to Accessible Reader data compatibility.
- Storage side-effect wiring: medium relevance. Storage envelopes matter to future adapters, but Stage 5A6 already extracted the safer pure payload layer.
- TypeScript contract/runtime adapter wiring: high eventual relevance, but too risky now because it would connect pure contract helpers into live runtime persistence/review behavior.
- Menu/context-menu helpers: low relevance. Good maintainability fallback, but little contract value.
- Document/source block helpers: medium relevance. Document refs matter to compatibility, but current workbench behavior is more DOM/project-document coupled than relationship data helpers.

## Recommendation

The next highest-leverage slice should be a narrow relationship editing helper split.

Recommended branch: `mindmap-runtime-relationship-helper-split`.

Recommended new module: `public/prototypes/current/mindmapRelationshipHelpers.js`.

Extract only pure or dependency-injected helpers:

- endpoint validation and duplicate/self-link decisions;
- edge metadata patch helpers for relation, strength, shape, label, ports, and reverse;
- endpoint change transforms that preserve labels, relation type, strength, route, and reset only the changed endpoint port when current behavior does so;
- Insert block between payload helpers for node template, replacement edge payloads, and review-attempt/card ID cleanup inputs;
- relationship insert placement candidate helpers only where the inputs are plain numbers/objects and no DOM reads are required.

Keep in `mindmap.js`:

- pointer targeting and S Pen/touch flows;
- DOM selection, toolbar, context-menu rendering, prompts, and FileReader/download/status behavior;
- render/save calls, history commits, notification bubbles, and review-attempt clearing wrapper calls;
- all geometry that reads DOM boxes or overlays.

Fallback: if the relationship split cannot stay data-only, use a menu/context-menu helper split. It is lower compatibility value but lower risk.

## Ready-To-Use Next Codex Prompt

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

