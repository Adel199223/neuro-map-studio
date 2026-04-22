# Galaxy Tab / S Pen Manual QA

Use this guide when testing the live learning-map prototype on a real Galaxy Tab with finger input and S Pen input.

## URLs

- Normal map: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html`
- Diagnostics map: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html?debugInput=1`

Optional persistent diagnostics flag from the browser console:

```js
localStorage.setItem("neuro-map-studio:debug-input", "1")
localStorage.removeItem("neuro-map-studio:debug-input")
```

## Before you start

1. Open the normal map URL first and confirm the default Simon Dixon map loads.
2. Export the current workspace before any destructive test:
   - use the toolbar export control or the canvas menu export action;
   - keep the exported file so you can restore your workspace if needed.
3. Run the script once in Chrome and once in Samsung Internet if possible.
4. If something feels wrong, repeat the step with the diagnostics URL and keep a screenshot or short screen recording.

## Test script

1. Open the normal map URL and wait for the map to finish loading.
2. Tap a block with a finger.
   - Expected: the block selects and the selected-item toolbar appears.
3. Tap the same or another block with S Pen.
   - Expected: selection works the same way and the toolbar remains reachable.
4. Drag a block by its handle with S Pen.
   - Expected: the block moves cleanly and keeps moving without immediately ending after a few millimeters. The canvas should not open a long-press menu.
5. Drag a block by its handle with a finger.
   - Expected: the block moves cleanly and does not accidentally pan the whole canvas.
6. While dragging, or immediately after releasing the handle, confirm that no context menu opens on the handle or canvas.
   - Expected: dragging stays uninterrupted. If the browser attempts a menu, diagnostics should show `contextmenu-suppressed` with `reason=active-drag` or `reason=recent-drag`.
7. Check whether map manipulation leaves any accidental text highlight inside a node.
   - Expected: dragging, resizing, panning, pinching, and connect mode should not leave node text selected. Intentional text editing should still work once the gesture ends.
8. Long-press a block with S Pen or finger.
   - Expected: the block menu opens.
9. Long-press empty canvas.
   - Expected: the canvas menu opens near the press location.
10. Long-press a relationship line or label.
   - Expected: the link menu opens.
11. Select a block and use the selected-item toolbar.
   - Check add linked block, edit, duplicate, connect, style, center/focus, and delete reachability.
12. Select a link and use the selected-item toolbar.
    - Check edit label, relationship type, thickness, route, port side, reverse, and delete reachability.
13. Pinch zoom in and out several times.
    - Expected: zoom feels stable and does not drift away from the visual anchor.
14. Two-finger pan around the canvas.
    - Expected: the canvas moves instead of the whole page scrolling.
15. Try an accidental one-finger page scroll near the map edges.
    - Expected: map interaction remains usable and the page does not get into a broken state.
16. Check whether the selected toolbar or a context menu blocks the selected block or link too much.
    - Expected: the UI stays usable without covering the active item too badly.
17. Try tapping connection ports after selecting a block.
    - Expected: ports feel tappable enough for follow-up interaction.
18. Export the workspace, then import it again after a few tablet edits.
    - Expected: the workspace restores cleanly.

## Edge / relationship line long-press

1. Open the diagnostics URL.
2. Long-press a visible relationship line with S Pen.
   - Expected: the link menu or selected-link toolbar opens.
   - Expected debug signal: `mode=edge`, not `mode=canvas`.
3. Long-press a visible relationship line with a finger.
   - Expected: the same link-focused behavior without needing unrealistically precise targeting.
4. Confirm the canvas menu does not open for the same gesture.
   - Expected debug signal: no duplicate `menu-open` in `mode=canvas` for the same long-press.
5. Long-press empty space afterward.
   - Expected: canvas long-press still opens the canvas menu normally.

## What to report back

Copy and fill this template:

```text
Device:
Browser:
URL:
Input used: finger / S Pen / mouse
Diagnostics enabled: yes / no

Steps:
Expected:
Actual:

Was it repeatable:
Screenshot or video:
Anything else that felt awkward:
```

## If diagnostics is enabled

- Expand the diagnostics panel only when you need it.
- Use Clear before reproducing a bug so the log stays short.
- Use Copy after reproducing the bug and paste the full retained log into ChatGPT or Codex with your written report.
- The panel now keeps a longer rolling history so full gesture sequences are easier to review.
- For drag-handle issues, look for `capture-requested`, `capture-acquired`, `capture-lost`, and whether a drag ends with `reason=pointercancel`.
- For accidental menu issues during map manipulation, look for `contextmenu-suppressed` with `reason=active-drag` or `reason=recent-drag`.
- For edge long-press issues, look for `mode=edge`, `edge=...`, `hit=edge-hit-target` or `hit=edge-label`, and `contextmenu-suppressed` when the native menu is blocked.
- The diagnostics panel is designed to log interaction metadata only. It should not capture node text, link text, or exported workspace content.
