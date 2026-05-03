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

- Review: map review summaries with Review next, normal review, and weak-card review launch actions
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
- connection-port quick-add for linked Concept, Question, Evidence, and Document blocks, plus Connect existing block targeting
- selected relationship `Change source` / `Change target` reconnect targeting with undo/redo
- selected relationship `Insert block between`, which creates a midpoint Concept, Question, Evidence, or Document block and splits the relationship in one undoable command
- collision-aware automatic placement for port quick-add, paste, duplicate, and document blocks
- dynamic relationship re-anchoring when connected blocks move

The map runtime still lives at `public/prototypes/current/mindmap.html`. Stage 5A2 keeps that route and behavior intact while externalizing the runtime assets into sibling files: `public/prototypes/current/mindmap.css` for map styles and `public/prototypes/current/mindmap.js` for the browser entrypoint. Stage 5A4 begins the JavaScript modularization by moving only low-risk constants, string/DOM-target utilities, and geometry helpers into sibling modules while leaving stateful runtime systems in `mindmap.js`. Stage 5A5 moves pure review normalization, queue, stats, card-generation, and visual-state helper logic into `public/prototypes/current/mindmapReviewHelpers.js`; review panel DOM/event wiring, save behavior, and session mutation remain in `mindmap.js`. Stage 5A6 moves low-risk map storage, normalization, page-state payload, import/export payload, and autosave scheduling helpers into `public/prototypes/current/mindmapStorageHelpers.js`; FileReader/download/status handling and IndexedDB save calls remain in `mindmap.js`. Stage 5A8 moves pure relationship data transforms into `public/prototypes/current/mindmapRelationshipHelpers.js`; pointer targeting, menus, prompts, render/save/history wiring, and S Pen/touch flows remain in `mindmap.js`. Stage 5A9 moves pure menu/context-menu descriptor builders into `public/prototypes/current/mindmapMenuHelpers.js`; menu DOM rendering, positioning, action dispatch, long-press behavior, and S Pen/touch flows remain in `mindmap.js`. Stage 5A10 moves pure document/source lookup, descriptor, template, detail-view, and document-reference helpers into `public/prototypes/current/mindmapDocumentHelpers.js`; document picker DOM rendering, Sources & blocks panel wiring, store calls, pending placement orchestration, and save/history/render/status behavior remain in `mindmap.js`. This is not a React rewrite, TypeScript conversion, Accessible Reader integration, or full JavaScript subsystem split.

The Sources & blocks panel supports:

- Concept block placement
- Question block placement
- Evidence block placement
- Document block placement
- adding project source documents as document blocks

Sources & blocks document rows show the project document type, source label, short description, and whether that document is already referenced on the current map. Document picker rows and map document blocks use the same derived metadata so learners can scan source context without duplicating document records.

Document blocks preserve `documentId`, can be dragged, can be linked, and persist after reload. Document blocks display a low-noise source-reference cue and open source details from the existing project document metadata.

## Map Review Mode

The map editor includes a local-first `Review this map` mode for active recall.

Pure review helper logic now lives in `public/prototypes/current/mindmapReviewHelpers.js`, low-risk storage helper logic now lives in `public/prototypes/current/mindmapStorageHelpers.js`, pure relationship data helpers now live in `public/prototypes/current/mindmapRelationshipHelpers.js`, pure menu descriptor helpers now live in `public/prototypes/current/mindmapMenuHelpers.js`, and pure document/source helpers now live in `public/prototypes/current/mindmapDocumentHelpers.js`, while `mindmap.js` still owns runtime state, rendering, menu DOM/event wiring, document picker and Sources & blocks DOM/event wiring, DOM-bound storage wiring, and review UI wiring. Stage 5A1/5A3 TypeScript helpers remain unwired from the browser runtime.

Review cards are generated from the current map without AI:

- block recall
- relationship line recall
- connected-block neighbor recall
- aggregate source/evidence recall

Answers remain hidden until Reveal, including map canvas text that could leak the answer. Weak cards are derived from the latest local rating per card: `Missed` and `Almost` stay weak, and `Got it` graduates a card out of the weak queue.

The review panel supports:

- normal review sessions
- lightweight `Review next` sessions ordered by Missed, Almost, then new/unreviewed cards
- focused `Review weak cards` sessions
- card-type filters for All, Blocks, Relationships, Connected blocks, and Sources/evidence
- lightweight history counts for total, reviewed, weak, missed, almost, and new cards
- local review attempts and session summaries preserved in page state and workspace backup/export/import

The project hub and root workspace dashboard derive review summaries from the same local page state. They show total cards, reviewed cards, weak cards, priority counts, last reviewed status, and launch links for Review next, normal review, or weak-card review. Maps with Missed, Almost, and new cards are prioritized before maps with no priority cards; scheduling and due dates are still deferred.

## Backup And Restore

Workspace backup/export/import uses JSON from the local IndexedDB model. Import merges valid records and rejects invalid backup JSON without replacing existing data.

## Tablet Support

Galaxy Tab and S Pen support includes:

- S Pen tap-to-place
- S Pen/finger drag
- S Pen/finger port tapping for linked-block quick-add and Connect existing block
- S Pen/finger relationship reconnect through selected-line Change source / Change target
- S Pen/finger relationship insertion through selected-line Insert block between
- touch-accessible undo/redo, multi-select, and selection toolbar actions
- finger pan/zoom
- long-press menus
- overlay lane protection for Sources & blocks, zoom controls, selection toolbar, and notification bubbles

## Current Limitations

- No cloud sync, account system, collaboration, server, PWA install flow, or native app.
- No PDF/DOCX parsing or binary file storage.
- Some runtime surfaces remain prototype HTML while the root dashboard is React.
- Operation-log architecture is a future direction, not implemented yet.
- Review Mode does not yet include spaced-repetition scheduling, due dates, reminders, or old-card revisit intervals.
- Hover-only midpoint handles, freeform endpoint dragging, relationship-line box selection, tablet/touch marquee, and group resize remain future map-editor polish.
