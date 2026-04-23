# Project Workspace Shell

## Summary

- Keep this slice static and prototype-compatible.
- Reframe Neuro Map Studio as a reusable learning-project workspace.
- Treat the Simon Dixon lesson and debt-power map as pages inside the `Geopolitics & Economics` project, not as the whole app.

## Implementation

- Add `public/prototypes/current/project.html` as the current project home.
- Add `public/prototypes/current/project-data.js` with stable static project/source/page metadata for future storage work.
- Reframe `lesson.html` and `mindmap.html` headers with app, project, source, and page identity while preserving current content and interactions.
- Update the React root landing page to send users to the project workspace first.
- Keep all map, read-aloud, glossary, tablet, and right-click behavior unchanged.

## Verification

- Update Playwright tests for project home, project links, lesson/map framing, and existing route coverage.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`

## Out of Scope

- No IndexedDB, sync, server, PWA, React migration, upload/import flow, dynamic project editor, zip packaging, or branch push.
