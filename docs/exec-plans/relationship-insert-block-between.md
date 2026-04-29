# Stage 3B3 Insert Block Between Relationship Endpoints

## Summary

Stage 3B3 adds a selected-relationship workflow for inserting a new block between two already-connected blocks.

The user can select a relationship line, choose `Insert block between`, choose Concept, Question, Evidence, or Document, and the map replaces `A -> B` with `A -> C` and `C -> B` in one undoable command.

## Implementation Notes

- The selection toolbar and relationship context menu expose `Insert block between`.
- The insert menu offers `Concept block`, `Question block`, `Evidence block`, and `Document block`.
- Concept/question/evidence insertion uses the existing block starter defaults.
- Document insertion reuses the existing document picker and preserves `documentId`.
- The inserted block is placed near the relationship midpoint with the existing collision-aware placement helpers.
- If the midpoint is blocked, the app chooses a nearby clear visible spot without zooming the map.
- Both split relationships inherit the original label, relationship type, strength, and route.
- Split relationships use `auto` source and target ports so dynamic re-anchoring remains intact.
- The original relationship review attempts are cleared so Review Next does not reuse stale mastery for changed topology.

## Verification

Playwright coverage was added for:

- toolbar and context menu visibility
- concept insertion and metadata preservation
- undo/redo
- blocked-midpoint placement
- document insertion and reload persistence
- pen-style insertion
- Review Next and answer-masking regression

Full verification target:

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
git diff --check
```

## Non-Goals

- No hover-only midpoint handle.
- No freeform endpoint dragging.
- No relationship label redesign.
- No scheduling, AI, cloud sync, accounts, or collaboration.
