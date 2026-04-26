# Current Product State

Neuro Map Studio is a local-first learning workspace for projects, pages, documents, and editable diagram maps.

## Workspace Dashboard

The root React app shows an app-like workspace dashboard with recent work, project cards, quick creation, backup/restore, help, and secondary developer utilities.

Primary actions:

- New map
- New page
- New project
- Open recent pages and diagrams
- Open projects

## Project Hub

The project hub is available at `public/prototypes/current/project.html`.

It organizes a project into:

- Pages: lesson, map, notes, review, and glossary pages
- Documents: project source/document metadata
- Utilities: page-document references and secondary actions

New map/page/document flows are compact actions, not permanent large forms.

## Pages And Runtime

Pages open through `page.html?pageId=<id>`. The runtime routes map pages to `mindmap.html?pageId=<id>` and seeded lesson pages to `lesson.html?pageId=<id>`.

Guided starters exist for:

- map
- lesson
- notes
- review
- glossary

## Map Editor

The map editor is the central diagram workspace. It preserves canvas-first behavior with:

- pan/zoom canvas
- lower-right zoom controls
- selected block/link selection toolbar
- long-press and right-click menus
- generous relationship hit targets
- S Pen/finger drag support
- debug mode with `?debugInput=1`

The Sources & blocks panel supports:

- Concept block placement
- Question block placement
- Evidence block placement
- Document block placement
- adding project source documents as document blocks

Document blocks preserve `documentId`, can be dragged, can be linked, and persist after reload.

## Backup And Restore

Workspace backup/export/import uses JSON from the local IndexedDB model. Import merges valid records and rejects invalid backup JSON without replacing existing data.

## Tablet Support

Galaxy Tab and S Pen support includes:

- S Pen tap-to-place
- S Pen/finger drag
- finger pan/zoom
- long-press menus
- overlay lane protection for Sources & blocks, zoom controls, selection toolbar, and notification bubbles

## Current Limitations

- No cloud sync, account system, collaboration, server, PWA install flow, or native app.
- No PDF/DOCX parsing or binary file storage.
- Some runtime surfaces remain prototype HTML while the root dashboard is React.
- Operation-log architecture is a future direction, not implemented yet.
