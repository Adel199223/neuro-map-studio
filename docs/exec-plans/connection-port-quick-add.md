# Connection Port Quick Add ExecPlan

## Goal

Make visible block connection ports usable as compact add-linked-block controls without changing the local-first map model or weakening Stage 1 editing safety.

## Implementation Notes

- Convert rendered connection ports into accessible buttons with the existing dot visual, larger invisible hit areas, focus styles, and subtle plus affordances.
- Reuse the current compact menu system for a port menu with Concept, Question, Evidence, and Document block choices.
- Add one helper for port quick-add placement and creation. It biases placement toward the clicked side, reuses safe placement helpers, creates the new block and relationship in one undoable map command, selects the new block, and shows an undo-friendly notification.
- Keep port quick-add relationships dynamic with `fromPort:"auto"` and `toPort:"auto"`. Existing context menu side-specific link creation and relationship port controls remain fixed-side where they already are.
- Extend the existing document picker pending state so choosing a document from a port menu creates a linked document block with preserved `documentId`.

## Verification

- Add Playwright coverage for accessible port affordance, concept quick-add, persistence, undo/redo, dynamic reanchoring after move, and document quick-add persistence.
- Keep existing placement, relationship context menu, tablet/S Pen diagnostics, and Stage 1 command/history tests passing.
