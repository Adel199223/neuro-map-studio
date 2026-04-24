# Canvas Narrow Overlay Final Polish

## Goal
Verify and, only if necessary, harden the final narrow/tablet overlay lanes for the placement-mode map workbench before any push or merge.

## Current Risks To Verify
- The lower-right zoom dock may visually compete with the Sources & blocks bottom sheet or collapsed handle on portrait-like widths.
- A newly placed document block may land too close to the zoom dock, workbench lane, selected shelf, or toast lane.
- The selected shelf or toast may crowd the selected document block after placement.
- The top map header and bottom workbench sheet may reduce usable canvas height on narrow/tablet layouts.
- The latest `canvas-placement-mode-qa-fixes` commit may already have resolved these issues, so product changes must be reproduction-driven.

## Reproduction Plan
- Start local Vite with `npm run dev -- --host 0.0.0.0`.
- Use isolated Playwright browser contexts only.
- Test viewport set:
  - `1366x768` wide desktop
  - `1000x760` medium
  - `900x760` medium/narrow
  - `768x1024` tablet portrait
  - `600x900` narrow
  - `430x900` mobile-like stress
- For each relevant viewport:
  - open a fresh map page from the project runtime
  - open Sources & blocks
  - enter Concept placement mode and cancel
  - enter document placement mode from a project source
  - place a document block
  - select the document block
  - trigger View reset toast
  - collapse and reopen the workbench

## Overlay Lane Contract
- Zoom dock and workbench controls must not overlap.
- Collapsed Sources & blocks handle must remain visible and not sit under the zoom dock.
- New document blocks must remain readable and not sit under the zoom dock, bottom sheet, selected shelf, toolbar, or toast.
- Selected shelf must not cover selected block title/body/details.
- Toasts must remain transient and avoid workbench, zoom dock, and selected shelf.
- No horizontal overflow on normal app surfaces.
- Map header must remain compact enough to preserve usable canvas height.

## If Issues Do Not Reproduce
- Do not change product or test code.
- Capture final screenshots to Downloads.
- Run the full non-packaging check suite.
- Create handoff/status/checklist artifacts stating that latest branch verification passed and no product change was needed.
- Do not create an empty code commit.

## If Issues Reproduce
- Patch only `public/prototypes/current/mindmap.html` and only the measured overlay/placement behavior needed to satisfy the failing contract.
- Add focused bounding-box Playwright coverage in `tests/e2e/prototype.spec.ts`.
- Prefer actual measured overlay rectangles over viewport-specific magic numbers.
- Preserve runtime routing, IndexedDB model, backup/import/export, guided starters, pan/zoom, edge anchoring, S Pen/touch behavior, context menus, and debug mode.

## Tests
- Existing checks must pass:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
- If fixes are required, add or update tests for:
  - narrow/mobile document placement vs zoom dock/workbench/shelf/toast
  - tablet portrait block placement visibility
  - collapsed Sources & blocks handle lane
  - toast lane safety
  - selected shelf after document placement

## Risks
- Automated bounding boxes cannot fully validate Galaxy Tab S Pen ergonomics.
- Narrow bottom-sheet behavior can be sensitive to browser UI and device safe-area differences.
- Over-tightening placement could surprise users by moving a block farther from the tap point; keep any nudge minimal and visible.
