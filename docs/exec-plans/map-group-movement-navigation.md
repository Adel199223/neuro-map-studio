# Map Group Movement And Navigation

## Goal

Polish everyday navigation and movement in the current map editor without changing the local-first model or starting Stage 3A marquee/relationship insertion work.

## Scope

- Multi-selected block group dragging.
- Arrow-key nudge for selected blocks.
- Zoom to selection from the selection toolbar.
- Concise shortcut/help copy for those behaviors.

## Non-Goals

- Marquee or box selection.
- Relationship endpoint reconnect.
- Edge midpoint insert.
- Connect existing block from port menus.
- Group resize, grouping/collapsing, cloud sync, operation logs, or visual redesign.

## Implementation Notes

- Group drag uses the existing drag-handle path. If the dragged block is already in a multi-block selection, all selected blocks are moved from their captured starting positions. Dragging an unselected block keeps the existing single-block behavior.
- Group drag commits one existing map-history command on gesture completion and preserves selected relationship lines as selection only.
- Arrow nudge moves selected blocks by 12 map units, or 48 map units with Shift, after the existing text-edit shortcut guards.
- Zoom to selection computes bounds from selected block rectangles and selected relationship endpoints, fits them into the safe canvas area, saves only the view, and does not create a history entry.
- The selection toolbar center control is repurposed as "Zoom to selection" for block, line, and mixed selections. Context-menu "Center on this block" remains a single-block action.

## Verification

- Add Playwright coverage for group drag, single drag regression, mixed selection drag, arrow nudge, text-edit arrow guard, zoom to selection, and shortcut/help discoverability.
- Keep Stage 1/2/2.5 interaction coverage passing.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
