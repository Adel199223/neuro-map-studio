# Stage 3A2: Marquee Selection Polish

## Goal

Add a desktop/trackpad box-selection gesture to the map editor so learners can quickly add several visible blocks to the current selection without disrupting existing pan, block drag, S Pen, port quick-add, or long-press behavior.

## Scope

- Add `Shift` + drag on empty canvas for additive block box selection.
- Also allow mouse/trackpad box selection while Select multiple mode is active.
- Keep relationship line box selection deferred; relationship lines remain selectable by click/tap and multi-select toggles.
- Keep tablet/touch marquee deferred so finger/S Pen pan, drag, long-press, and port taps remain stable.
- Do not add relationship endpoint reconnect, edge midpoint insert, Connect existing block, group resize, grouping/collapsing, cloud sync, operation logs, or app redesign.

## Implementation Notes

- Add a stage-level marquee overlay that is visible only during the gesture and sits above map content but below toolbars and panels.
- Track marquee state separately from pan/drag/history state; selection-only changes must not create undo entries.
- Start marquee only from empty canvas, primary button, non-touch pointer, and no active placement/connect/drag/menu gesture.
- On finish, select blocks whose rendered bounds intersect the marquee rectangle and preserve any existing selected relationship lines.
- `Escape`, `pointercancel`, and lost capture cancel the gesture and hide the rectangle without changing selection.
- Update shortcut help with concise desktop wording and the additive behavior.

## Verification

- Add Playwright coverage for multi-block selection, additive behavior, no history entry, pan/zoom correctness, cancel behavior, pan/drag/port quick-add regressions, toolbar actions after marquee, and help copy.
- Run the full non-packaging suite before committing.
