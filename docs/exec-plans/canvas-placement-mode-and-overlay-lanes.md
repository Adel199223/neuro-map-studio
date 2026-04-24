# Canvas Placement Mode And Overlay Lanes

## Goal

Make workbench-created map blocks behave like a real diagram editor action: choose a block type or source, then tap/click the canvas to place it intentionally. The canvas should stay spatially reliable across mouse, finger, and S Pen use, with overlays kept in clear lanes and new blocks avoiding existing nodes and controls.

## Current behavior

`public/prototypes/current/mindmap.html` already has a canvas-first workbench, transient toast feedback, safe-area helpers, and selected-shelf positioning. Workbench actions still immediately place concept/question/evidence/document blocks using `addWorkbenchBlock()` and `addWorkbenchDocumentBlock()`, so blocks can appear too close to other blocks or feel surprising. Safe placement accounts for overlays, but does not consistently treat all existing node rectangles as avoid areas for user-directed placement. The workbench, zoom dock, toast, starter, and selected shelf have partial layout separation, but creation still relies too much on automatic placement.

## Desired behavior

Workbench actions enter placement mode. A compact overlay says what will be placed and offers Cancel. The next tap/click in canvas space creates the block at that map coordinate, nudged to a nearby free position if the point is occupied or too close to an overlay. Escape cancels. Workbench source buttons enter the same mode with a specific `documentId`. Existing toolbar/context-menu paths stay compatible. Starter actions may continue safe automatic placement, but must reuse collision-aware placement helpers.

## Constraints

- Preserve dynamic runtime routing, pageId-scoped map state, backup/import/export, document references, guided starters, existing toolbar actions, pan/zoom, edge anchoring, context menus, selected shelf behavior, and touch/S Pen drag behavior.
- Do not add storage schema changes, PDF/DOCX parsing, sync/cloud/PWA work, dashboard/project redesign, or a map engine rewrite.
- Placement feedback must be short, non-layout, keyboard-cancellable, and available to assistive tech through `aria-live`.
- New overlays must not cover core content unnecessarily, and narrow/tablet layouts must keep the canvas usable.

## Implementation steps

1. Add a placement status overlay and ghost preview inside the map stage.
2. Add placement state helpers: start, cancel, update preview, and complete placement.
3. Extend overlay geometry with placement overlay/ghost awareness and a lane-oriented `getOverlayLanes()` wrapper.
4. Add collision-aware placement using existing node screen rects plus overlay rects, nudging preferred positions to nearby free spots before falling back to a safe-area scan.
5. Route workbench concept/question/evidence/document and source actions into placement mode; collapse the bottom-sheet workbench on narrow screens when placement starts.
6. Keep starter actions automatic but make them use the same collision-aware safe placement path.
7. Intercept stage and node-layer pointer/click/contextmenu behavior while placement mode is active so placing does not trigger pan, selection, or long-press menus.
8. Reposition the selected shelf and toast offsets after placement so they avoid the newly placed block and existing overlay lanes.

## Test plan

- Add Playwright coverage for entering/canceling placement mode.
- Place concept, question, evidence, and document blocks from the workbench and verify persistence after reload.
- Place a document block from a project source and verify title/type, `documentId`, drag/link behavior, and reload persistence.
- Attempt placement on top of `Main idea` and assert the new block does not overlap it.
- Verify workbench and zoom dock do not overlap at wide, medium, and narrow widths.
- Verify selected shelf and toast do not cover newly placed document blocks or workbench/zoom controls.
- Keep existing regression tests passing for runtime opening, legacy recovery, backup/import/export, starters, document blocks, pan/zoom, edge re-anchoring, touch/S Pen drag, and contextmenu suppression.

## Risks and rollback

- Pointer interception could accidentally suppress pan, long-press menus, or node selection. Limit it to active placement mode and overlay-free canvas taps.
- Collision scanning could place blocks farther than expected. Prefer user tap location first, then near candidates, then safe-area scan.
- Narrow layout can still feel busy. Collapse the workbench when placement starts on small screens and keep the placement overlay compact.
- Rollback is limited to this branch by reverting the placement-mode commit.

## Completion checklist

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `GITHUB_PAGES=true npm run build`
- `npm run test:e2e`
- `npm run check`
- Local commit only on `canvas-placement-mode-and-overlay-lanes`
- No push, merge, zip, `package:review`, or `package:verify`
