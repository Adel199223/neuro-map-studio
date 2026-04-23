# Guided Page Start And Local Backup

## Goals
- Make newly created pages feel useful immediately without adding a heavy editor or wizard.
- Add a local JSON backup/export/import path for IndexedDB workspace data before users create more real content.
- Keep backup/import non-destructive and preserve page runtime, pageId-scoped maps, document references, and tablet/map interaction fixes.

## Scope
- Add workspace-level backup helpers in `workspace-store.js`.
- Add root-dashboard backup and restore controls behind a calm collapsed panel.
- Improve default lesson, notes, review, and glossary starter content.
- Add a dismissible starter panel for fresh one-block map pages with safe starter actions.
- Tighten context-aware page navigation and page-card labels.

## Out Of Scope
- Cloud sync, server storage, PWA install, native app work, React migration, and account features.
- PDF/DOCX upload, parsing, rendering, or binary file backup.
- Destructive replace import by default.
- Broad visual redesign or map engine refactor.

## Data Safety Strategy
- Export writes a plain JSON object containing all workspace stores plus schema metadata.
- Import is merge-only in this slice: records with existing IDs are skipped, new IDs are inserted, and existing user data is never silently overwritten.
- Invalid JSON or missing backup shape is rejected with a clear UI message.
- Old page metadata without `pageState` continues to recover through the existing runtime migration path.

## Export/Import Format
- `schemaVersion`
- `exportedAt`
- `app` metadata with app name and package version
- `storage` metadata with IndexedDB name/version and page state version
- `workspace`, `projects`, `documents`, `pages`, `pageDocumentLinks`, `pageStates`

## Guided Empty-State Strategy
- New lesson/notes/review/glossary pages start with short editable learning prompts instead of generic placeholders.
- New map pages keep the existing safe one-block graph but show a small starter panel when the active map has only that starter block.
- Starter actions add a central question block, an evidence block, or a document block if project documents exist; the panel can be hidden and that choice persists in map page state.

## Navigation Strategy
- Project pages keep dead lesson/map shortcuts hidden for empty projects.
- Map pages only show an active related-lesson action when a lesson page exists in the same project.
- Page cards keep real runtime links and type-specific labels.

## Tests
- Backup export includes schema metadata and all workspace stores.
- Valid backup import merges data and persists after reload.
- Invalid backup import is rejected without deleting existing data.
- New map starter panel appears, adds starter blocks, hides persistently, and keeps page state after reload.
- Document starter path creates document reference blocks when project documents exist and shows a calm no-documents message otherwise.
- Existing runtime, legacy metadata recovery, map interactions, document blocks, and lesson regressions remain passing.

## Risks
- IndexedDB import shape must stay conservative to avoid corrupting local data.
- Starter UI must not block map manipulation or become persistent clutter.
- Existing map localStorage compatibility must remain untouched for seeded map users.
