# Workspace Local Model And Document Blocks

## Summary

- Move from a static project shell to a first local-first workspace slice.
- Keep this prototype-compatible: no sync, server, PWA, binary import, PDF/DOCX parsing, or React migration.
- Preserve current lesson/map behavior and the recent tablet/S Pen interaction fixes.

## Entity Model

- Workspace owns project order and the current project id.
- Projects own documents and pages.
- Documents live in the project library first and can be reused by multiple pages.
- Pages reference documents through page-document links.
- Map document blocks reference project document ids through node metadata.

## Implementation

- Add a plain browser IndexedDB module under `public/prototypes/current/` so React and standalone HTML prototypes can share it.
- Seed the `Geopolitics & Economics` project, Simon Dixon source document, linear lesson page, editable map page, and source links.
- Refactor the root app into a workspace dashboard with project listing and a create-project action.
- Refactor the project page into project overview, document library, page library, and lightweight page-document relationship management.
- Add document reference blocks to the map without changing the existing map autosave/export model beyond safe node metadata.

## Out Of Scope

- No file upload, binary storage, document rendering, sync, cloud, PWA install, or full project editor.
- No migration of the full map engine into React.
- No operation log implementation yet.

## Verification

- Add Playwright coverage for workspace dashboard, project/document/page CRUD, page-document links, and document map blocks.
- Keep existing lesson, map, tablet, right-click, diagnostics, and workspace-core regressions passing.
- Run `doctor`, `typecheck`, `lint`, `build`, `GITHUB_PAGES=true build`, `test:e2e`, and `check`.
