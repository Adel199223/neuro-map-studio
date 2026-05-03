# Mindmap Runtime Post-Document Health Check

Stage 5A11 is a docs-only checkpoint after the Stage 5A10 document/source helper split. It reassesses whether the next modernization slice should keep splitting runtime code or pause for test health and product work.

## Baseline

- Baseline commit: `88d61256b7fd23992650c244fc130ffbc75257ae`.
- `mindmap.js` remains the browser entrypoint.
- Accessible Reader remains separate and read-only.
- Stage 5A1/5A3 TypeScript helpers remain unwired from the browser runtime.
- No runtime, route, storage key, backup/import, UI, or GitHub Pages behavior changes are part of this checkpoint.

## Current Module Inventory

| File | Lines | Bytes | Role |
| --- | ---: | ---: | --- |
| `public/prototypes/current/mindmap.js` | 5,360 | 264,867 | Browser entrypoint and stateful runtime wiring. |
| `public/prototypes/current/mindmapConstants.js` | 95 | 7,825 | Static constants, style sets, map defaults, review labels, pointer thresholds. |
| `public/prototypes/current/mindmapDomUtils.js` | 35 | 1,028 | String cleanup, cloning, escaping, editing/gesture target checks. |
| `public/prototypes/current/mindmapGeometry.js` | 99 | 3,980 | Pure geometry helpers for ports, edges, rectangles, distance, and clamping. |
| `public/prototypes/current/mindmapReviewHelpers.js` | 486 | 19,702 | Pure review IDs, store normalization, queues, stats/history, cards, and visual-state normalization. |
| `public/prototypes/current/mindmapStorageHelpers.js` | 218 | 8,117 | Pure map/workspace normalization, payload builders, import append, filenames, autosave debounce. |
| `public/prototypes/current/mindmapRelationshipHelpers.js` | 115 | 3,800 | Pure relationship duplicate/self-link checks, metadata transforms, insert-between payloads, review cleanup IDs. |
| `public/prototypes/current/mindmapMenuHelpers.js` | 217 | 8,550 | Pure menu/context-menu descriptor builders. |
| `public/prototypes/current/mindmapDocumentHelpers.js` | 116 | 3,924 | Pure document/source lookup, labels, picker/workbench descriptors, block templates, detail data, refs. |

### Exported Helper Symbols

`mindmapConstants.js` exports static data and thresholds: `colors`, `shapes`, `nodeTypes`, `sizePresets`, `relationStyles`, `edgeShapes`, `ports`, `portLabels`, `oppositePort`, `NUDGE_STEP`, `NUDGE_LARGE_STEP`, `DEBUG_INPUT_KEY`, `REVIEW_STATE_VERSION`, `REVIEW_RATING_LABELS`, `REVIEW_CARD_TYPE_LABELS`, `REVIEW_FILTER_LABELS`, `REVIEW_SESSION_MODES`, `MAP_HISTORY_LIMIT`, `LONG_PRESS_DELAY`, `LONG_PRESS_MOVE`, `MARQUEE_MIN_SIZE`, `PORT_TAP_MOVE`, `EDGE_HIT_WIDTH`, `EDGE_HIT_WIDTH_COARSE`, `RECENT_LONG_PRESS_MENU_MS`, `RECENT_DRAG_CONTEXTMENU_MS`, `PORT_OUTSET`, and `defaultMap`.

`mindmapDomUtils.js` exports `clean`, `cloneJson`, `escapeHtml`, `isTouchLikePointer`, `isTouchGesturePointer`, `isEditingElement`, and `isCanvasGestureBlockedTarget`.

`mindmapGeometry.js` exports `clamp`, `marqueeRectFromPoints`, `rectsOverlap`, `distance`, `autoPort`, `sideVector`, `portPoint`, `cubicPoint`, `quadPoint`, and `edgeGeometry`.

`mindmapReviewHelpers.js` exports `reviewId`, `normalizeReviewStore`, `normalizeReviewFilter`, `reviewAttemptTime`, `reviewAttemptCount`, `latestReviewAttemptsByCard`, `filterReviewCards`, `buildWeakReviewCards`, `buildReviewNextCards`, `reviewStats`, `reviewCardCountLabel`, `reviewHistoryText`, `relationshipReviewCardId`, `filterOutRelationshipReviewAttempts`, `normalizeReviewVisualState`, `createMapReviewCards`, and review label constants.

`mindmapStorageHelpers.js` exports `cloneDefault`, `normalizeMap`, `createMapPageId`, `blankMap`, `makePage`, `normalizeWorkspace`, `resetViewsForLegacyWorkspace`, `fallbackSeededWorkspace`, `blankPageWorkspace`, `loadWorkspaceFallback`, `saveWorkspaceMirror`, `workspaceFromPageStateData`, `buildMapPageStatePayload`, `buildWorkspaceExportPayload`, `appendImportedMapPage`, `safeFileName`, and `scheduleAutosave`.

`mindmapRelationshipHelpers.js` exports `isSelfRelationship`, `findDirectedRelationship`, `createRelationshipDraft`, `reverseRelationship`, `changeRelationshipEndpoint`, `patchRelationshipRelation`, `patchRelationshipStrength`, `patchRelationshipShape`, `patchRelationshipPort`, `buildSplitRelationshipEdge`, `buildRelationshipInsertNode`, `buildInsertBetweenRelationshipPayload`, and `relationshipReviewCleanupCardIds`.

`mindmapMenuHelpers.js` exports `createMenuItem`, `createMenuSection`, color/shape/size/importance/relation/strength/route/port row builders, port quick-add descriptors, insert-between descriptors, node/relationship/canvas/page menu descriptors, and relationship menu title helpers.

`mindmapDocumentHelpers.js` exports `findDocumentById`, `hasProjectDocuments`, `documentTitle`, `documentTypeLabel`, `documentSourceLabel`, `documentDescription`, `buildDocumentPickerItems`, `buildWorkbenchDocumentItems`, `projectDocumentCountLabel`, `buildDocumentBlockTemplate`, `buildDocumentNodeOptions`, `buildDocumentPlacementPending`, `buildRelationshipDocumentInsertTemplate`, `buildDocumentDetailView`, `isDocumentNode`, and `extractDocumentRefsFromNodes`.

### Entry Imports And Harness Coverage

`mindmap.js` imports the workspace store, constants, DOM utilities, geometry helpers, review helpers, storage helpers, relationship helpers, menu helpers, and document helpers.

`scripts/doctor.mjs` currently requires all current map runtime files and checks:

- `mindmap.html` still loads only `mindmap.js` as the module script.
- `mindmap.js` imports all current helper modules.
- representative tokens remain in `mindmap.js` for runtime page state, review, relationship insert/connect, document IDs, and storage.
- each helper module has representative exports and expected imports.

ESLint still ignores `public/prototypes/current/mindmap.js` and prototype HTML files. The extracted `mindmap*Helpers.js`, constants, DOM utility, and geometry modules are not broadly ignored and stay lint-covered.

## Remaining `mindmap.js` Subsystem Inventory

| Subsystem | Representative functions/state | Notes |
| --- | --- | --- |
| Rendering | `render`, `renderNodes`, `renderEdges`, `getEdgeLayout`, `applyFocus`, `updateOverlayOffsets` | DOM and SVG heavy, connected to ports, labels, review highlights, selection, and overlay safety. |
| Selection/toolbar | `selectedId`, `selectedNodeIds`, `selectedEdgeIds`, `selectionShelf`, `updateSelectionUI`, `positionSelectionShelf`, `setSelectionFromIds`, clipboard, nudge, delete | State-heavy and visibly tablet-sensitive. Selection toolbar logic touches history, menus, DOM, and layout. |
| Gesture/input | pointer owners, gesture locks, long-press state, canvas pan, pinch, port tap state, connect target tap state, drag capture, debug input | Highest S Pen/finger sensitivity; dense event listener coupling. |
| Review UI wiring | `renderReviewPanel`, `startReviewSession`, `rateCurrentReviewCard`, `applyReviewHighlights`, `saveReviewState` | Pure card/queue logic is extracted; session mutation, DOM rendering, save, and highlights remain runtime-owned. |
| Storage side-effect orchestration | `persistWorkspaceState`, `save`, `mapPageStatePayload`, `downloadJson`, `exportMap`, `exportWorkspace`, `importMap` | Pure payload helpers are extracted; IndexedDB, FileReader, download, status, and page sync remain. |
| Document picker DOM | `refreshProjectDocuments`, `renderDocumentPicker`, `openDocumentPicker`, `chooseDocumentFromPicker`, `renderWorkbenchDocuments`, `renderWorkbench`, `openDocumentDetail` | Pure document data helpers are extracted; DOM rendering, store calls, pending state, and placement orchestration remain. |
| Relationship runtime orchestration | `addEdge`, `deleteEdge`, `reverseEdge`, `setEdge*`, `showInsertBetweenMenu`, `insertBlockBetweenRelationship`, `startReconnect`, `completeReconnectToBlock`, `startConnect`, `completeConnectToBlock` | Pure transforms are extracted; prompts, menus, render/save/history, review cleanup wrapper calls, and pointer targeting remain. |
| Map/page/project initialization | `initializeRuntimePage`, `refreshProjectDocuments`, `renderPageControls`, `switchPage`, `createNewPage`, `duplicateCurrentPage`, `renameCurrentPage`, `deleteCurrentPage` | Coupled to route context, workspace store, active page, and runtime chrome. |
| Debug/input diagnostics | `formatDebugNumber`, `describeDebugTarget`, `rememberDebugPointer`, `logInputDebug`, `copyInputDebugEntries`, `updateInputDebugUI` | Local diagnostic UI and storage remain in runtime. Useful for touch/S Pen debugging. |
| Remaining utilities | ID factories, map history, view/zoom/recovery, safe placement, workbench placement, menu rendering, side panels | Many are cross-cutting and currently safer inside `mindmap.js`. |

## Risk And Value Matrix

| Candidate | Extraction value | Behavior risk | Test coverage strength | S Pen/touch sensitivity | Accessible Reader relevance | Flake likelihood | Screenshots needed | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selection/toolbar helper split | Medium | Medium-high | Strong browser coverage for selected toolbar, multi-select, nudge, copy/paste, tablet layout | Medium-high | Low-medium | Medium due selected-link toolbar transient | Yes | Defer until test hardening reduces toolbar/geometry uncertainty. |
| Rendering helper split | High | High | Broad smoke coverage, little pure helper coverage | Medium | Medium | High around placement, ports, labels, review masks | Yes | Defer; DOM/SVG and visual regressions are too likely. |
| Document picker DOM split | Medium | Medium-high | Good document/helper/workbench regression coverage | Medium | Medium | Medium | Yes | Least-bad future code split, but not next because pure document boundary already landed. |
| Gesture/input split | High | High | Broad browser/mobile coverage plus manual QA docs | Very high | Low-medium | High near long-press, port taps, high-zoom placement | Yes, plus device QA | Defer; this is the most tablet-sensitive surface. |
| Test/flake hardening only | Medium | Low | Directly targets known weak spots | Medium | Indirect but improves confidence for future compatibility work | Low implementation risk | No product screenshots required | Primary recommendation. |
| Pause modernization for product work | Medium product value | Low-medium depending on slice | Existing suite protects core flows | Depends on product slice | Depends on product slice | Low if scoped | Depends on product slice | Fallback recommendation. |

## Flake And Test Health Inventory

Known recent or recurring transient families:

- Chromium high-zoom port quick-add placement can fail in focused runs, then pass isolated reruns and final full suites.
- Selected-link toolbar assertions have failed once in earlier runs and passed isolated reruns.
- Keyboard shortcuts while editing block text are sensitive because runtime shortcuts and editable block content share document-level listeners.
- Selected relationship Insert block assertions have had transient exposure in earlier modernization stages.
- Parallel focused Playwright runs can contend for the same Vite port; focused suites should run sequentially.

These transients cluster around geometry, placement, selection toolbar visibility, pointer state, and event timing. That is exactly the surface area touched by rendering, selection/toolbar, and gesture/input splits. Test/flake hardening should happen before another behavior-sensitive runtime extraction.

Existing coverage remains strong:

- Helper extraction specs cover document, menu, relationship, storage, review, and runtime module wiring.
- Portable contract and runtime parity specs guard Stage 5A1/5A3 data compatibility while keeping those helpers unwired.
- Workspace core specs cover workspace normalization, import/export, autosave serialization, document node metadata, and page operations.
- `prototype.spec.ts` covers review, Review Next, backup/import/export, document blocks, port quick-add, relationship editing, selection, keyboard guards, touch/pen paths, and debug diagnostics.

## Accessible Reader Compatibility Relevance

The highest-value compatibility seams are already present:

- Stage 5A1 portable contract/model/review helpers.
- Stage 5A3 runtime-to-portable snapshot parity.
- Stage 5A8 relationship data helpers.
- Stage 5A10 document/source data helpers.

Remaining candidate splits are mostly runtime ergonomics and UI behavior:

- Selection/toolbar helpers help maintainability but do not directly improve portable graph semantics.
- Rendering helpers help separate layout from DOM, but they risk visual and port/label regressions.
- Document picker DOM split could clarify UI wiring, but pure document/source data compatibility is already externalized.
- Gesture/input helpers matter for tablet quality, not direct data compatibility, and are too sensitive now.
- Test/flake hardening improves confidence for later compatibility work without touching Accessible Reader.

Accessible Reader should remain read-only until an explicit integration task is approved.

## Recommendation

Primary next step: test/flake hardening only.

Harden the known transient paths before splitting any more runtime code:

- high-zoom port quick-add placement
- selected-link toolbar visibility/assertions
- keyboard shortcuts while editing text
- Insert block between relationship assertions
- focused Playwright sequencing and Vite port contention guidance

Fallback next step: pause modernization and return to product work.

Rationale:

- The core compatibility data boundaries are already in place.
- Remaining runtime splits are more DOM-bound, pointer-bound, and visual than the prior helper extractions.
- A hardening-only slice reduces risk before any future selection/toolbar, rendering, gesture/input, or document picker DOM work.

If a code split must continue later, the least-bad next split is a narrow document picker DOM boundary. It should move only deterministic document picker view-model/render helpers with dependency injection and should avoid store calls, pending placement orchestration, FileReader/download behavior, save/history/render/status calls, and pointer/S Pen flows.
