# Local-First Workspace Architecture

Neuro Map Studio currently stores workspace data locally in IndexedDB.

## Store

Primary store file:

- `public/prototypes/current/workspace-store.js`

IndexedDB database:

- `neuro-map-studio-local-workspace`

Store groups:

- `workspaces`
- `projects`
- `documents`
- `pages`
- `pageDocumentLinks`
- `pageStates`

## Data Model

High-level records:

- Workspace: local root container
- Project: learning project metadata
- Document: source/document metadata, not parsed binary content
- Page: lesson, map, notes, review, or glossary page metadata
- PageDocumentLink: reusable relationship between a page and a document
- PageState: page-specific runtime state

Map pages store pageId-scoped map workspace state in `pageStates`. This prevents one map page from overwriting another map page.

## Runtime Flow

- Project cards and page cards build real runtime links.
- `page.html?pageId=<id>` resolves the page type.
- Map pages redirect/open through `mindmap.html?pageId=<id>`.
- Seeded lesson pages redirect/open through `lesson.html?pageId=<id>`.

## Backup JSON

Workspace backup JSON includes schema/app/storage metadata plus:

- projects
- documents
- pages
- pageDocumentLinks
- pageStates

Import currently merges valid records and skips existing IDs. Invalid backup JSON is rejected without replacing existing local data.

## Not Implemented Yet

- cloud sync
- accounts
- collaborative editing
- PDF/DOCX parsing
- binary document storage
- operation log

Future operation-log work should be designed separately and should not be mixed into small UI or QA tasks.
