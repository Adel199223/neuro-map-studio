# Canvas Overlay Layout Hardening

## Goal

Make the map editor feel spatially reliable by preventing the workbench, zoom dock, selected shelf, toast messages, starter panel, toolbar, and newly inserted blocks from covering each other in normal desktop/tablet layouts.

## Current behavior

`public/prototypes/current/mindmap.html` has several independent overlay surfaces: `.toolbar`, `.zoom-dock`, `.selection-shelf`, `.map-workbench`, `#mapStarterPanel`, `.toast`, context menus, and document picker/detail cards. Workbench-created blocks currently use `visibleWorkbenchPosition()` and `chooseWorkbenchBlockPosition()`, while document blocks still pass through `chooseDocumentBlockPosition()`. These helpers account for some overlays but do not expose one shared safe canvas rectangle. The zoom dock is fixed to the lower-right with only `--zoom-dock-lift`, toasts are also anchored near the lower-right, and the selected shelf is centered/docked without checking the newly selected block.

## Desired behavior

New blocks from the workbench, starter, and document-source paths appear in a visible safe region that avoids the left toolbar, open workbench, zoom dock, visible toast, and selected shelf. The selected shelf should position itself near the selected block only when it can avoid the block and workbench; otherwise it should dock compactly to a safe edge. Toasts should stay transient and non-layout, but avoid the zoom dock/workbench area. The workbench should keep its hide action attached to the drawer and behave as a bounded right drawer on wide/medium screens and a bottom sheet on narrow screens.

## Constraints

- Do not change IndexedDB, localStorage schema, runtime routing, import/export shape, or seeded map layouts.
- Do not reposition existing saved nodes or saved view states.
- Preserve pan/zoom, edge anchoring, selected shelf actions, context menus, S Pen/finger drag behavior, document reference blocks, and `?debugInput=1`.
- Keep controls touch-sized, low clutter, dyslexia/ADHD-friendly, and accessible with aria-live status for transient messages.

## Implementation steps

1. Add overlay geometry helpers: `rectFromElement()`, `rectsOverlap()`, `getOverlayRects()`, `getCanvasSafeArea()`, `nodeScreenRectFromWorld()`, `nodeFitsSafeArea()`, and `chooseSafeNodePosition()`.
2. Replace `visibleWorkbenchPosition()`/`chooseWorkbenchBlockPosition()` with the safe-area placement helper for workbench Concept, Question, Evidence, Document, and starter actions.
3. Make `chooseDocumentBlockPosition()` prefer a supplied point only when it still fits the safe area, then fall back to safe candidates around the selected/core node and finally the safe-area center.
4. Update `updateOverlayOffsets()` to set CSS variables for zoom-dock lift and workbench-aware horizontal offset; keep the zoom dock reachable while the workbench is open.
5. Refine workbench CSS so the collapsed handle always says `Sources & blocks`, the close button remains in the drawer header, content scrolls internally, and narrow screens use a bottom-sheet style above the zoom dock.
6. Update toast CSS/JS so toasts live in a safe region that avoids the zoom dock/workbench and update overlay offsets whenever a toast appears/disappears.
7. Improve `positionSelectionShelf()` so it chooses safe above/below/docked positions, avoids covering the selected node, avoids the workbench, and only uses a temporary compact class when space is tight.
8. Keep root/project surfaces unchanged except for screenshots/artifacts.

## Test plan

- Add Playwright geometry helpers for rect overlap and interactive reachability.
- Test workbench vs zoom dock: open workbench, assert drawer and zoom dock controls do not overlap, and click zoom.
- Test workbench handle: open/close at medium and narrow widths with no horizontal overflow.
- Test document block safe placement: add from Project sources and assert the node avoids toolbar, workbench, zoom dock, toast, and selected shelf.
- Test selected shelf safe positioning with a selected document block and an open workbench.
- Test toast placement for `View reset` and `Document block added`, including auto-dismiss.
- Test fresh-map safe layout with `Main idea`, starter/workbench, shelf, toolbar, and zoom dock.
- Run the full non-package check suite.

## Risks and rollback

Overlay geometry can affect perceived canvas placement and selection shelf ergonomics. Keep the change limited to new insertions and overlay CSS/positioning. If regressions appear, rollback this branch or revert the `mindmap.html` geometry helpers while preserving the previous workbench commit.

## Completion checklist

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `GITHUB_PAGES=true npm run build`
- `npm run test:e2e`
- `npm run check`
- Handoff, QA checklist, status file, and optional screenshots saved to Downloads.
