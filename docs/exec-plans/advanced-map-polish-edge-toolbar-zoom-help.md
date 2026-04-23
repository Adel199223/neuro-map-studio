# Advanced Map Polish: Edge Anchoring, Contextual Shelf, Zoom Dock, Header Help

## Summary

- Keep this slice inside the current `public/prototypes/current/mindmap.html` prototype.
- Preserve the recent tablet/S Pen fixes for drag capture, edge long-press ownership, contextmenu suppression, pinch/pan, and debug logging.
- Fix four focused issues: linked-edge anchoring during move/resize, selected-item shelf dismissal, lower-right zoom controls, and moving always-visible instructions into the existing help drawer.

## Implementation

- Add one shared edge-layout helper so path, midpoint, hit target, label placement, and selected-edge anchoring all derive from current node geometry.
- Change generic `add linked block` creation to use `auto` ports, while side-specific linked-block actions still use fixed sides.
- Add explicit selection-clearing and temporary shelf-suspension helpers so the selected-item shelf hides on canvas deselect, pan, pinch, Escape, unrelated menus, and during node drag/resize, then returns after drag/resize if the object is still selected.
- Move the zoom cluster into a lower-right overlay and remove those controls from the left rail.
- Remove the persistent instructional subtitle from the header and place concise “Quick map tips” content inside the existing `?` drawer.

## Verification

- Add Playwright coverage for:
  - linked-edge path/label/hit-target updates after moving a new linked block,
  - selected shelf dismissal on empty canvas, Escape, and pan,
  - shelf staying open when clicked directly and returning after drag,
  - zoom controls living near the lower-right corner,
  - help drawer exposing the moved instructions while the header stays cleaner.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `npm run package:review`
  - `npm run package:verify`
