# Current Product State

Neuro Map Studio is a local-first learning workspace for projects, pages, documents, and editable diagram maps.

## Workspace Dashboard

The root React app shows an app-like workspace dashboard with recent work, project cards, a compact workspace review summary, quick creation, backup/restore, help, and secondary developer utilities.

Primary actions:

- New map
- New page
- New project
- Open recent pages and diagrams
- Open projects

## Project Hub

The project hub is available at `public/prototypes/current/project.html`.

It organizes a project into:

- Review: map review summaries with normal review and weak-card review launch actions
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
- map-level undo/redo for meaningful edits
- multi-select for blocks and relationship lines
- bulk delete, copy/paste, duplicate, and Ctrl/Cmd+A canvas selection
- selected-block group drag and arrow-key nudge
- Zoom to selection from the selection toolbar
- desktop/trackpad box selection with Shift-drag on empty canvas
- connection-port quick-add for linked Concept, Question, Evidence, and Document blocks
- collision-aware automatic placement for port quick-add, paste, duplicate, and document blocks
- dynamic relationship re-anchoring when connected blocks move

The Sources & blocks panel supports:

- Concept block placement
- Question block placement
- Evidence block placement
- Document block placement
- adding project source documents as document blocks

Document blocks preserve `documentId`, can be dragged, can be linked, and persist after reload.

## Map Review Mode

The map editor includes a local-first `Review this map` mode for active recall.

Review cards are generated from the current map without AI:

- block recall
- relationship line recall
- connected-block neighbor recall
- aggregate source/evidence recall

Answers remain hidden until Reveal, including map canvas text that could leak the answer. Weak cards are derived from the latest local rating per card: `Missed` and `Almost` stay weak, and `Got it` graduates a card out of the weak queue.

The review panel supports:

- normal review sessions
- focused `Review weak cards` sessions
- card-type filters for All, Blocks, Relationships, Connected blocks, and Sources/evidence
- lightweight history counts for total, reviewed, and weak cards
- local review attempts and session summaries preserved in page state and workspace backup/export/import

The project hub and root workspace dashboard derive review summaries from the same local page state. They show total cards, reviewed cards, weak cards, last reviewed status, and launch links for normal or weak-card review. Maps with weak cards are prioritized before maps with no weak cards; scheduling and due dates are still deferred.

## Backup And Restore

Workspace backup/export/import uses JSON from the local IndexedDB model. Import merges valid records and rejects invalid backup JSON without replacing existing data.

## Tablet Support

Galaxy Tab and S Pen support includes:

- S Pen tap-to-place
- S Pen/finger drag
- S Pen/finger port tapping for linked-block quick-add
- touch-accessible undo/redo, multi-select, and selection toolbar actions
- finger pan/zoom
- long-press menus
- overlay lane protection for Sources & blocks, zoom controls, selection toolbar, and notification bubbles

## Current Limitations

- No cloud sync, account system, collaboration, server, PWA install flow, or native app.
- No PDF/DOCX parsing or binary file storage.
- Some runtime surfaces remain prototype HTML while the root dashboard is React.
- Operation-log architecture is a future direction, not implemented yet.
- Review Mode does not yet include spaced-repetition scheduling, due dates, or project-wide scheduling dashboards.
- Relationship endpoint reconnect, edge midpoint insert, relationship-line box selection, tablet/touch marquee, and group resize remain future map-editor polish.
