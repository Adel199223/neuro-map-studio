# ExecPlan: Map Recall Review MVP

## Goal

Add a focused embedded review mode to the editable map so learners can practice active recall from the blocks and relationship lines they already built.

## Desired behavior

- The map editor exposes a clear `Review this map` action without cluttering the canvas.
- Review opens in a compact overlay while the map stays visible.
- Review cards are generated deterministically from map data, with no AI and no scheduling engine.
- Supported MVP cards:
  - block recall from block title and body;
  - relationship recall from labeled or typed relationship lines;
  - neighbor recall from blocks with multiple connections;
  - source/document support recall when document or evidence blocks are connected to another block.
- The active card temporarily highlights relevant blocks and relationship lines.
- Reveal keeps answers hidden until requested, including answer text that would otherwise be readable on the map canvas.
- Before reveal, block bodies, source/evidence content, and relationship labels that would leak the answer are temporarily masked without mutating map data.
- Neighbor recall masks connected block content and relationship labels before reveal, then restores the connected context after reveal.
- Source/evidence recall is aggregate per supported block, masking all support candidates and labels before reveal.
- Ratings are `Got it`, `Almost`, and `Missed`.
- Rating attempts persist locally per map page and map view through the existing page state payload.

## Constraints

- Do not add Stage 3B relationship endpoint editing, endpoint reconnect, edge midpoint insert, connect-existing-from-port, group resize, AI generation, cloud sync, accounts, PDF/DOCX parsing, operation logs, or an app redesign.
- Do not add a new IndexedDB store or bump the database version.
- Do not alter map content, block styles, or map undo/redo history when entering review, revealing, rating, exiting, or restarting.
- Preserve current pan/zoom, selection, group drag, nudge, zoom to selection, box selection, port quick-add, placement, duplicate/paste, and tablet/S Pen behavior.

## Implementation steps

1. Add review panel markup and CSS in `public/prototypes/current/mindmap.html`, near the existing learning/help surfaces.
2. Add review state helpers that normalize `pageStates.data.review`, preserve it through `persistWorkspaceState()`, and save rating attempts immediately with `savePageState()`.
3. Add deterministic card generation from the active map view and project document metadata.
4. Add phase-aware temporary review highlight and masking classes to rendered blocks and relationship lines, and clear them on exit, map view switch, render, and review completion.
5. Wire the `Review this map` action, reveal/rating/next/restart/exit controls, and Escape behavior.
6. Add focused Playwright tests in `tests/e2e/prototype.spec.ts`.

## Test plan

- Add Playwright coverage for entry, block recall, relationship recall, neighbor recall, source/evidence recall, pre-reveal answer masking, summary, persistence/reload, backup export/import, and undo/history safety.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`

## Risks

- Review state must not be lost when map autosave writes page state.
- Review highlighting must coexist with selection and focus mode without changing saved block styling.
- Review masking must clear after reveal, exit, map switch, import, reset, and normal re-render paths.
- Backup coverage should rely on existing `pageStates` export/import rather than adding schema complexity.
