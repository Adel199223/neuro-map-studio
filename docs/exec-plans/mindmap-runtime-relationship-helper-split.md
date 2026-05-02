# Stage 5A8 Mindmap Runtime Relationship Helper Split

## Summary

Stage 5A8 extracts pure relationship data helpers from the browser map runtime into `public/prototypes/current/mindmapRelationshipHelpers.js`.

This is a behavior-preserving refactor. `mindmap.js` remains the only browser entrypoint and continues to own DOM reads, pointer targeting, menu rendering, prompts, render/save/history calls, notification bubbles, review cleanup wrappers, and S Pen/touch flows.

## Implementation

- Add a lint-clean plain JavaScript module for relationship data transforms:
  - self-link and same-direction duplicate detection
  - relationship draft creation
  - reverse relationship transform
  - endpoint-change transform
  - relation, strength, route, and port patch helpers
  - Insert block between node/edge payload builders
  - relationship review cleanup card IDs
- Update `mindmap.js` wrappers to call the pure helpers while preserving existing user-facing behavior and undo/save/render wiring.
- Update doctor and static runtime extraction tests so the new helper file is required, imported by `mindmap.js`, and present in GitHub Pages builds.

## Boundaries

- Do not move rendering, relationship hit testing, pointer/gesture state, context-menu rendering, selection toolbar controls, prompts, review UI wiring, storage, autosave, or document/source picker behavior.
- Do not wire Stage 5A1/5A3 TypeScript helpers into the browser runtime.
- Do not change relationship behavior, routes, storage keys, backup/import behavior, UI, or Accessible Reader.

## Verification

- Add pure Playwright-runner coverage for the helper module.
- Run the relationship-focused prototype subset for Connect existing, Change source, Change target, Insert block between, selected link toolbar, and relationship review masking.
- Run the full normal verification suite before committing.
