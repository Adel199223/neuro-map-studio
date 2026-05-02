# Stage 5A10 Mindmap Runtime Document Helper Split

## Summary

Stage 5A10 extracts pure document/source helper logic from the browser map runtime into `public/prototypes/current/mindmapDocumentHelpers.js`.

This is a behavior-preserving runtime modularization slice. `public/prototypes/current/mindmap.js` remains the only HTML entrypoint, and user-facing document/source behavior stays unchanged.

## Scope

The new helper module owns plain-data document/source logic:

- document lookup and safe title/type/source/description fallbacks
- document picker and Sources & blocks panel descriptor data
- document count labels
- document block templates and node option builders
- pending placement payloads for document blocks
- relationship Insert block between document templates
- document detail view data
- document-node checks and document-reference extraction from map nodes

`mindmap.js` still owns runtime wiring:

- document picker DOM rendering and events
- Sources & blocks panel rendering and actions
- project document refresh/store calls
- FileReader/upload/download behavior
- pending document placement, quick-add, and relationship insert orchestration
- render, save, history, status, and notification bubble calls
- pointer, touch, S Pen, and menu flows

## Non-Goals

- No Accessible Reader integration or edits
- No route, storage key, backup/import/export, or GitHub Pages deployment changes
- No React rewrite or TypeScript conversion of `mindmap.js`
- No Stage 5A1/5A3 TypeScript helper wiring into the browser runtime
- No rendering, gesture/input, review UI, relationship runtime, or storage side-effect split
- No document picker UI redesign

## Verification Plan

- Add Node-side Playwright-runner coverage for `mindmapDocumentHelpers.js`.
- Update the runtime extraction/static checks and `scripts/doctor.mjs` so the document helper module is required, imported, and represented by stable export markers.
- Run the document-focused helper spec, prior helper extraction specs, runtime portable parity, portable contract, workspace core, and a document/source/review/storage prototype grep subset sequentially.
- Run the full non-packaging verification suite:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `git diff --check`

## Handoff Notes

Document/source behavior remains local-first and browser-runtime owned. The extracted helper clarifies the future compatibility boundary for source/document concepts without integrating Neuro Map Studio with Accessible Reader.
