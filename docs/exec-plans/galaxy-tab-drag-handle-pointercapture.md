# Galaxy Tab Drag Handle Pointer Capture Fix

## Summary

- Fix the Android Chrome block-drag regression reported on Galaxy Tab S11 Ultra with S Pen in the source-of-truth prototype.
- Keep the scope narrow: make drag from the circular block handle reliable without changing text editing, long-press menus, right-click, or the data model.

## Plan

1. Harden the node drag pipeline in `public/prototypes/current/mindmap.html`.
   - Capture on a stable element (`#nodeLayer`) instead of the transient handle button.
   - Track an explicit active drag pointer id and ignore other pointers until drag end.
   - Prevent default browser gesture ownership on drag-handle `pointerdown`.
   - Add clear cleanup for `pointerup`, `pointercancel`, and `lostpointercapture`.
2. Improve drag ergonomics without redesigning the UI.
   - Keep the visible handle small.
   - Increase the actual hit area to roughly `44x44` CSS px.
   - Add a temporary drag-lock class during active drag to suppress text selection and accidental gestures.
3. Extend diagnostics and regression coverage.
   - Log capture requested/acquired/lost in opt-in debug mode.
   - Add a Playwright touch-style drag-handle test plus a structural `touch-action:none` assertion.
4. Verify with the full repo check suite and publish only if it all passes.
