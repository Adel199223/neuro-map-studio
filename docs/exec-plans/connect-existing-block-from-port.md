# ExecPlan: Connect Existing Block From Port

## Goal

Extend the existing connection-port quick-add flow so a learner can connect a block to another block that is already on the map.

## Desired behavior

- Each block connection-port menu includes `Connect existing block` alongside Concept, Question, Evidence, and Document block creation.
- Choosing `Connect existing block` starts the existing map targeting mode from that source block.
- The source block stays visually marked, other blocks show as targets, and the banner says to tap a block or use Escape/Cancel.
- Clicking or tapping another block creates a relationship line from the source block to the target block.
- The created relationship is selected so the existing relationship toolbar can label, style, reroute, reverse, or delete it.
- The connection is one undoable map edit; entering, canceling, or failing targeting does not create undo history.
- Self-links are prevented with a friendly message.
- Duplicate same-direction relationships are prevented by selecting the existing line and showing a clear message.
- Blank-canvas taps cancel targeting instead of leaving the map stuck in a modal state.

## Constraints

- Do not implement relationship endpoint reconnect, edge midpoint insert, relationship label redesign, group resize, AI generation, cloud sync, accounts, collaboration, or review scheduling.
- Preserve existing port quick-add new-block creation, collision-aware placement, dynamic relationship re-anchoring, undo/redo, multi-select, box selection, group drag, review modes, backup/import/export, and tablet/S Pen behavior.
- Use the existing map graph and undo/history helpers; do not add a new persistence model.

## Implementation steps

1. Add the port-menu action and accessible labeling in `public/prototypes/current/mindmap.html`.
2. Reuse the existing `connectFrom` targeting mode, improving the banner wording and cancel lifecycle.
3. Harden relationship creation so self-links and duplicate same-direction links are handled explicitly.
4. Add touch/pen target-tap handling for connect mode while keeping normal drag and long-press behavior intact after cancel/complete.
5. Update concise product/QA docs for the new port workflow.
6. Add focused Playwright coverage in `tests/e2e/prototype.spec.ts`.

## Test plan

- Verify the port menu shows `Connect existing block` and the existing block-type options.
- Verify connecting from a port to an existing block creates and selects one relationship line.
- Verify undo and redo remove and restore the relationship.
- Verify Escape/Cancel exits targeting with no relationship.
- Verify self-links and duplicate same-direction relationships are prevented.
- Verify touch/S Pen-style port tap to target tap creates one relationship.
- Verify existing port quick-add, Review next, answer masking, and core editor interactions still pass.
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

- Targeting mode must not intercept editable text, drag handles, resize handles, or port taps incorrectly.
- Duplicate prevention must select existing relationship lines without mutating map data.
- Touch/pen target taps must avoid double-creating relationships when a synthetic click follows pointer events.
