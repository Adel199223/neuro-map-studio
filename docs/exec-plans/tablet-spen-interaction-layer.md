# ExecPlan: Tablet / S Pen Interaction Layer

## Goal

Add tablet-safe editing paths to the current `public/prototypes/current/mindmap.html` prototype without removing desktop right-click behavior or changing the approved map content.

## Baseline

- The current mindmap prototype is still the source of truth.
- Right-click menus already exist for canvas, blocks, and links.
- The existing `selection-shelf` only exposes a tiny subset of actions.
- The stage already uses Pointer Events for drag and pan, but it does not yet provide a touch/pen long-press path or a small selected-item toolbar.

## Implementation outline

1. Expand the current `selection-shelf` into a compact selected-item toolbar.
   - Block mode: add linked block, edit, duplicate, connect, style, center, focus, delete.
   - Link mode: edit label, relationship type, importance/thickness, route, source port, target port, reverse, delete.
   - Keep the toolbar quiet, icon-first, touch-sized, collapsible, and anchored near the selected item when there is room.

2. Add long-press support for touch and pen.
   - Long-press on blank canvas opens the existing canvas menu.
   - Long-press on a block opens the existing block menu.
   - Long-press on a link label or relationship line opens the existing link menu.
   - Cancel long-press on movement, multi-touch, drag/resize start, or pointer cancel.

3. Preserve viewport behavior.
   - Keep mouse drag and right-click behavior intact.
   - Keep wheel/trackpad zoom intact.
   - Add a minimal two-touch pan/pinch path so tablet gestures remain usable with `touch-action:none`.

4. Reuse existing action paths.
   - Keep the existing menu builders and action handlers as the single source of truth.
   - Route toolbar buttons into those same mutation helpers or into smaller menus backed by the same context/action dispatch.

5. Update docs and tests.
   - Interaction contract: right-click is no longer the only edit path.
   - Tablet/S Pen architecture: record the toolbar + long-press layer as the current readiness step.
   - README: mention tablet-friendly interaction support is in progress.
   - Playwright: cover node/link toolbar visibility and right-click retention, plus long-press if reliable.

## Verification

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `GITHUB_PAGES=true npm run build`
- `npm run test:e2e`
- `npm run check`
- `npm run package:review`
- `npm run package:verify`

## Out of scope

- IndexedDB migration
- WebSocket or computer-as-local-server sync
- React migration of the prototype
- Changes to lesson-page behavior
