# Canvas-First Map Workbench

## Goal

Make the map editor feel like the central diagram workbench of Neuro Map Studio by giving learners an obvious, canvas-first way to add concept, question, evidence, and document blocks from the current project sources without changing the storage schema or existing map interaction mechanics.

## Current behavior

`public/prototypes/current/mindmap.html` already has strong canvas interactions, document reference blocks, guided fresh-map starters, and pageId-scoped persistence. The remaining workflow gap is that source/document creation is split between an icon-only toolbar, a separate document picker, and a starter panel that floats over the canvas. Status feedback such as `View reset` can also appear in `#saveStatus`, which participates in the map header layout and can stretch controls instead of behaving like transient feedback.

## Desired behavior

The map screen should keep the canvas primary while adding a compact `Sources & blocks` workbench drawer. The drawer should open by default for fresh maps, remain collapsible for existing maps, and include short labeled actions for `Concept`, `Question`, `Evidence`, and `Document` blocks. Project documents should appear as source rows with `Add as document block`, using the existing document block model and preserving `documentId`. Fresh-map starter actions should live inside the same workbench so guidance is useful but no longer competes with the canvas.

## Constraints

Do not alter IndexedDB schema, runtime routing, backup/import/export, pageId map state, or the map engine. Preserve existing toolbar, context menus, document picker, selected shelf, ports, pan/zoom, edge re-anchoring, long-press behavior, S Pen/finger drag behavior, duplicate contextmenu suppression, and `?debugInput=1`. Keep the UI ADHD/dyslexia-friendly: short labels, large touch targets, low clutter, no dense prose, clear focus states, and no controls covering the main starting node.

## Implementation steps

1. Convert `#saveStatus` into a compact live-region status that does not take visual header space, and route user-facing feedback such as `View reset`, `Map saved`, `Block added`, `Document block added`, and `Starter hidden` through the existing toast system.
2. Add a `Sources & blocks` workbench overlay in `mindmap.html` with a toggle, close button, starter section, block starter actions, project source list, and collapsed learning prompts.
3. Reuse existing primitives: `addNodeAt()` for concept/question/evidence blocks and `addDocumentBlock()` for source/document blocks.
4. Add safe visible placement helpers so workbench-created blocks avoid the left toolbar, open workbench drawer, starter section, selected shelf, and lower-right zoom dock.
5. Keep `#mapStarterPanel` for compatibility and tests, but render it inside the workbench and hide it after a meaningful starter/workbench action.
6. Update event exclusions so clicks inside the workbench do not clear selection, start canvas gestures, or open context menus.
7. Update Playwright coverage for status toasts, workbench open/collapse, document block creation/persistence, question/evidence creation, starter non-blocking behavior, and responsive workbench safety.

## Test plan

Run focused Playwright tests for the new workbench flows, then the full non-packaging verification set: `npm run doctor`, `npm run typecheck`, `npm run lint`, `npm run build`, `GITHUB_PAGES=true npm run build`, `npm run test:e2e`, and `npm run check`. Preserve existing coverage for dynamic runtime, backup/import/export, guided non-map starters, legacy page recovery, document blocks, pan/zoom, edge re-anchoring, selected shelf, touch/S Pen drag, contextmenu suppression, glossary/read-aloud, and debug mode.

## Risks and rollback

The main risk is overlay interference with canvas gestures or fresh-map visibility. The rollback path is to keep the existing toolbar/document picker/starter flows intact and remove only the workbench wrapper. Another risk is double status feedback; keeping `#saveStatus` as a live region and using toast messages only for user-visible feedback avoids header layout regressions while preserving accessibility.

## Completion checklist

- `Sources & blocks` workbench opens by default on fresh maps and can collapse.
- Concept, question, evidence, and document block actions create visible, persistent blocks.
- Document blocks preserve `documentId`, remain draggable, and remain linkable.
- `View reset` appears as a toast and does not stretch the header.
- Fresh-map starter is inside the workbench, non-blocking, and hide state persists.
- Required checks pass.
- Work is committed locally on `canvas-first-map-workbench`; nothing is pushed, merged, zipped, or packaged.
