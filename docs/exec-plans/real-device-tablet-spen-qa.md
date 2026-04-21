# ExecPlan: Real-Device Galaxy Tab / S Pen QA Harness

## Goal

Add the next small readiness slice for the source-of-truth learning-map prototype: a real-device Galaxy Tab / S Pen QA workflow plus an optional input diagnostics mode that helps collect useful bug reports without logging learner content.

## Baseline

- The repo is clean on `main` in WSL and the public repo already includes the long-press plus selected-item toolbar slice.
- `public/prototypes/current/mindmap.html` still contains the tablet markers `long-press`, `selection-shelf`, and `LONG_PRESS_DELAY`.
- GitHub Pages is already live for the repo and remains the static preview target for manual tablet testing.

## Implementation outline

1. Add real-device QA docs.
   - Create a manual checklist for Galaxy Tab testing in Chrome and Samsung Internet.
   - Include export-first safety guidance before destructive tests.
   - Include a compact bug-report template and optional diagnostics enable/disable commands.

2. Add an opt-in input diagnostics panel in `mindmap.html`.
   - Keep diagnostics off by default.
   - Enable only through `?debugInput=1` or `localStorage["neuro-map-studio:debug-input"] === "1"`.
   - Dock the panel away from the main toolbar and toast, keep it collapsed by default, and hide it in print.
   - Log only interaction metadata: pointer type/id/buttons, pressure/tilt when available, safe target summaries, and normalized actions such as tap, long-press, drag, pan, pinch, resize, connect, and menu-open.

3. Do a light ergonomic polish pass.
   - Keep right-click and the current toolbar/menu model intact.
   - Slightly enlarge coarse-pointer menu/action targets and keep overlays clamped inside the viewport.
   - Make long-press cancellation explicit when drag, resize, pan, or pinch clearly begins.

4. Extend automated coverage.
   - Verify diagnostics stays hidden by default.
   - Verify `?debugInput=1` shows the panel, starts collapsed, and logs at least one synthetic interaction without errors.
   - Add a narrow/tablet viewport regression check for selected-item toolbar visibility.

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
- Lesson-page behavior changes
- Any logging of user-authored map text
