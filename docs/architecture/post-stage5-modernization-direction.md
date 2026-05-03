# Post-Stage 5 Modernization Direction

Stage 5A13 is a docs-only checkpoint after the Stage 5A0 through Stage 5A12 modernization wave. It compares returning to product work against the next possible runtime splits and Accessible Reader compatibility work.

## Baseline

- Baseline commit: `72803f390b68919dd9e3532ab2a7759e4e6965f4`.
- `mindmap.js` remains the browser entrypoint.
- Runtime/product behavior is unchanged after Stage 5A12.
- Accessible Reader remains separate and read-only.
- Stage 5A1/5A3 TypeScript helpers remain unwired from the browser runtime.
- No runtime source, tests, routes, storage keys, backup/import behavior, UI, GitHub Pages deployment, or Accessible Reader files are changed by this checkpoint.

## Modernization Summary

Stage 5A0 through Stage 5A12 created the core compatibility and maintainability foundation without moving the browser runtime out of `mindmap.js`:

- Stage 5A0 audited Accessible Reader compatibility and defined shared contract direction.
- Stage 5A1 extracted pure learning-map contract, data/model, review, and preview adapter helpers.
- Stage 5A2 externalized the prototype map runtime into `mindmap.html`, `mindmap.css`, and `mindmap.js`.
- Stage 5A3 added runtime-to-portable snapshot parity fixtures.
- Stage 5A4 through Stage 5A6 extracted constants, DOM utilities, geometry, review helpers, and storage helpers.
- Stage 5A7 paused for a modernization health check.
- Stage 5A8 through Stage 5A10 extracted pure relationship, menu descriptor, and document/source data helpers.
- Stage 5A11 recommended test/flake hardening before further runtime splitting.
- Stage 5A12 hardened the known high-zoom quick-add, selection toolbar, keyboard-editing, Insert block between, and focused Playwright sequencing families.

The runtime is now better protected and easier to reason about, but the remaining large areas in `mindmap.js` are more visual, event-driven, and behavior-sensitive than the data helpers already extracted.

## Current Module Inventory

| File | Lines | Bytes | Role |
| --- | ---: | ---: | --- |
| `public/prototypes/current/mindmap.js` | 5,360 | 264,867 | Browser entrypoint and stateful runtime wiring. |
| `public/prototypes/current/mindmapConstants.js` | 95 | 7,825 | Static constants, style sets, map defaults, review labels, pointer thresholds. |
| `public/prototypes/current/mindmapDomUtils.js` | 35 | 1,028 | String cleanup, cloning, escaping, editing and gesture target checks. |
| `public/prototypes/current/mindmapGeometry.js` | 99 | 3,980 | Pure geometry helpers for ports, edges, rectangles, distance, and clamping. |
| `public/prototypes/current/mindmapReviewHelpers.js` | 486 | 19,702 | Pure review IDs, store normalization, queues, stats/history, cards, and visual-state normalization. |
| `public/prototypes/current/mindmapStorageHelpers.js` | 218 | 8,117 | Pure map/workspace normalization, payload builders, import append, filenames, and autosave debounce. |
| `public/prototypes/current/mindmapRelationshipHelpers.js` | 115 | 3,800 | Pure relationship duplicate/self-link checks, metadata transforms, insert-between payloads, and review cleanup IDs. |
| `public/prototypes/current/mindmapMenuHelpers.js` | 217 | 8,550 | Pure menu and context-menu descriptor builders. |
| `public/prototypes/current/mindmapDocumentHelpers.js` | 116 | 3,924 | Pure document/source lookup, labels, picker descriptors, block templates, detail data, and refs. |

## Remaining Risk Areas

| Area | Current shape | Risk |
| --- | --- | --- |
| Rendering and SVG | `render`, `renderNodes`, `renderEdges`, edge layout, labels, review highlights, port alignment, overlay offsets | High visual and connector regression risk. |
| Selection toolbar | selected node/edge state, toolbar visibility, selected relationship controls, clipboard, nudge, delete, zoom to selection | Medium-high risk because assertions recently needed hardening. |
| Gesture/input | pointer capture, long-press, S Pen/finger drag, port tapping, pan/zoom, debug diagnostics | Very high tablet and touch sensitivity. |
| Review UI wiring | review panel rendering, session mutation, highlight application, save/status calls | Medium risk; pure review queue logic is already extracted. |
| Document picker DOM | Sources & blocks panel rendering, document picker state, document detail UI, pending document placement | Medium risk; pure document/source data helpers are already extracted. |
| Storage side-effect orchestration | IndexedDB calls, FileReader/download flows, workspace persistence, backup/import command wiring | Medium-high risk because storage keys and backup behavior must stay stable. |
| Relationship orchestration | prompts, menus, reconnect state, Insert block between runtime wrappers, render/save/history/review cleanup calls | Medium-high risk; pure transforms are already extracted. |
| Page and project init | runtime page loading, page controls, project documents, workspace mirror sync | Medium risk because route and pageId behavior are high-priority regressions. |
| Debug diagnostics | input debug UI, pointer event logging, local diagnostics | Low product value, but useful for S Pen/touch regression diagnosis. |

## Product-Vs-Modernization Matrix

| Direction | User value | Foundation leverage | Behavior risk | Test readiness | Accessible Reader relevance | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Return to product work | High | High | Low-medium if scoped | Strong after Stage 5A12 | Medium, especially source/document semantics | Primary recommendation. |
| Selection/toolbar helper split | Medium | Medium | Medium | Better after hardening, still layout-sensitive | Low-medium | Modernization fallback only. |
| Rendering helper split | Medium maintainability value | Medium | High | Browser coverage exists, but visual regressions are likely | Low-medium | Defer. |
| Gesture/input split | Medium maintainability value | Low-medium | Very high | Needs more device-oriented evidence | Low | Defer. |
| Accessible Reader compatibility adapter | Medium future value | Medium | Medium-high if it becomes integration | Contract/parity tests exist, but integration is unapproved | High | Too early beyond pure fixture/adapter review. |

## Decision

Primary next direction: return to product work.

The best next slice is a narrow Sources & blocks / document references polish slice. It should make source/document metadata easier to inspect and review while mapping, clarify page-document references, and improve document block affordances without changing storage keys or parsing uploaded files.

Why this is the best next step:

- Stage 5A10 created document/source helpers that make this product area easier to evolve.
- Stage 5A12 reduced test timing risk around map interactions, so a small user-facing slice has better safety than another structural split.
- Source/document clarity is directly useful to learners and makes the local-first workspace feel more coherent.
- The work benefits future Accessible Reader compatibility by improving document semantics in Neuro Map Studio without integrating the apps.

Recommended product scope:

- Improve source/document metadata visibility in the Sources & blocks panel and document block/detail surfaces.
- Clarify which page references which project document.
- Preserve `documentId` across document blocks, map state, workspace backup/export/import, and review cards.
- Keep PDF/DOCX parsing, cloud sync, storage migrations, and Accessible Reader integration out of scope.

Fallback direction: selection/toolbar helper split.

If product work is intentionally deferred and modernization must continue, the least risky next modernization split is a narrow selection/toolbar helper boundary. It should extract only pure descriptor, action availability, and selection-summary helpers. It should leave DOM rendering, positioning, keyboard listeners, pointer state, clipboard mutation, render/save/history calls, and menu dispatch in `mindmap.js`.

## Deferred Directions

- Rendering split: defer because DOM/SVG output, edge anchoring, labels, review masks, and overlay geometry remain tightly coupled and visually sensitive.
- Gesture/input split: defer because S Pen/finger behavior, long-press, port tapping, drag ownership, and pan/zoom remain the highest-risk runtime surface.
- Accessible Reader adapter work: defer actual integration. The smallest safe future step is pure non-integration fixture review that compares existing contracts and document/source examples without editing Accessible Reader or wiring runtimes together.

## Test Evidence

Stage 5A12 ended with the expected full Playwright shape:

- 346 project-runs
- 341 passed
- 5 expected skips

Focused repeat evidence from Stage 5A12:

- high-zoom port quick-add: 5 Chromium passed and 5 expected mobile skips after extra overlay-geometry settling.
- selected-link toolbar: 10/10 passed.
- keyboard shortcut editing guard: 10/10 passed.
- Insert block between subset: 40/40 passed.

This test posture supports a small product slice better than another large visual or pointer-driven runtime split.
