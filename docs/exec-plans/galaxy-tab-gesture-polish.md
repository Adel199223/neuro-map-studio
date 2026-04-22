# Galaxy Tab Gesture Polish

## Summary
- Preserve the current pointer-capture drag fix and the edge long-press ownership fix.
- Add a narrow gesture-suppression layer so active or just-finished drag/resize gestures do not open accidental menus.
- Broaden gesture lock so map manipulation does not leave stray text selection, while intentional editing still works once the gesture ends.

## Implementation
- Track active and recent drag/resize interaction state with a `700ms` cooldown window for context-menu suppression.
- Reuse the existing debug panel to log `contextmenu-suppressed` with `active-drag` and `recent-drag` reasons.
- Expand the existing gesture-lock class from drag-only use to drag, resize, pan, pinch, connect mode, and touch/pen long-press arming.
- Keep node text editable by avoiding gesture starts from `[contenteditable]` and clearing gesture lock immediately on gesture end.

## Verification
- Add Playwright coverage for context-menu suppression during active/recent drag and for gesture-lock cleanup after drag.
- Re-run doctor, typecheck, lint, both builds, E2E, check, and review-package verification before publish.
