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
   - Expected: the block moves cleanly and the canvas does not open a long-press menu.
5. Drag a block by its handle with a finger.
   - Expected: the block moves cleanly and does not accidentally pan the whole canvas.
6. Long-press a block with S Pen or finger.
   - Expected: the block menu opens.
7. Long-press empty canvas.
   - Expected: the canvas menu opens near the press location.
8. Long-press a relationship line or label.
   - Expected: the link menu opens.
9. Select a block and use the selected-item toolbar.
   - Check add linked block, edit, duplicate, connect, style, center/focus, and delete reachability.
10. Select a link and use the selected-item toolbar.
    - Check edit label, relationship type, thickness, route, port side, reverse, and delete reachability.
11. Pinch zoom in and out several times.
    - Expected: zoom feels stable and does not drift away from the visual anchor.
12. Two-finger pan around the canvas.
    - Expected: the canvas moves instead of the whole page scrolling.
13. Try an accidental one-finger page scroll near the map edges.
    - Expected: map interaction remains usable and the page does not get into a broken state.
14. Check whether the selected toolbar or a context menu blocks the selected block or link too much.
    - Expected: the UI stays usable without covering the active item too badly.
15. Try tapping connection ports after selecting a block.
    - Expected: ports feel tappable enough for follow-up interaction.
16. Export the workspace, then import it again after a few tablet edits.
    - Expected: the workspace restores cleanly.

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
- Use Copy after reproducing the bug and paste the result into ChatGPT or Codex with your written report.
- The diagnostics panel is designed to log interaction metadata only. It should not capture node text, link text, or exported workspace content.
