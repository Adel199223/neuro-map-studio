# ExecPlan: Relationship Endpoint Reconnect MVP

## Goal

Let learners correct an existing relationship line without deleting and recreating it.

## Desired behavior

- Selecting a relationship line exposes `Change source` and `Change target` from the selection toolbar and relationship context menu.
- Choosing either action starts a compact targeting mode:
  - `Tap a block to use as the new source. Esc to cancel.`
  - `Tap a block to use as the new target. Esc to cancel.`
- The selected relationship stays highlighted while targetable blocks are visually marked.
- Tapping or clicking a replacement block updates only the chosen endpoint.
- The relationship ID, label, relationship type, strength, and route are preserved.
- The changed endpoint port resets to `auto` so dynamic re-anchoring remains safe.
- The reconnect is one undoable map edit.
- Escape, Cancel, and blank-canvas taps cancel without creating undo history.
- Self-links, no-op endpoint choices, and duplicate same-direction relationships are prevented with friendly messages.
- Reconnecting clears only current relationship-card attempts for that relationship in the current map view; historical review session summaries stay intact.

## Constraints

- Do not add freeform endpoint dragging, edge midpoint insert, relationship label redesign, scheduling, AI generation, cloud sync, accounts, or collaboration.
- Preserve Stage 3B1 Connect existing block from port, port quick-add, dynamic re-anchoring, undo/redo, selection, group movement, box selection, review modes, backup/import/export, and tablet/S Pen behavior.
- Use the existing map graph, selection toolbar, context menu, and undo helpers.

## Implementation steps

1. Add `Change source` and `Change target` actions to selected relationship toolbar and relationship context menu.
2. Add reconnect targeting state beside the Stage 3B1 connect-existing targeting flow.
3. Reuse the existing banner/cancel/input lifecycle for mouse, touch, and pen target taps.
4. Implement endpoint validation, duplicate prevention, endpoint update, review-attempt clearing, selection preservation, and undo history.
5. Update concise product, roadmap, handoff, smoke, and Galaxy Tab/S Pen docs.
6. Add Playwright coverage for reconnect behavior and regressions.

## Test plan

- Verify toolbar and context menu expose `Change source` and `Change target`.
- Verify changing target and changing source preserve relationship metadata and reset the changed endpoint port to `auto`.
- Verify undo/redo restores and reapplies endpoint changes.
- Verify Escape, Cancel, and blank canvas cancel without mutation or history entries.
- Verify self/no-op and duplicate reconnect attempts are blocked.
- Verify a pen/touch-style reconnect flow completes once.
- Verify Review next and answer masking still work after reconnect.
- Verify Stage 3B1 Connect existing block from port and regular port quick-add still work.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `git diff --check`

## Risks

- Reconnect targeting must not interfere with block dragging, content editing, or port tapping after cancel/complete.
- Review status for an edge-ID relationship card must not make changed relationship content look already mastered.
- Duplicate prevention must avoid mutating data while still giving clear feedback.
