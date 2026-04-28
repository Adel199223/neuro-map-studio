# AGENTS.md

## Repository Purpose

Neuro Map Studio is a local-first ADHD/dyslexia-friendly learning workspace for projects, pages, documents, and editable learning maps. The current source of truth is the published `main` branch.

Current local repo path:

- `/home/fa507/dev/neuro-map-studio-codex`

Current source-of-truth branch:

- `main`

## Current App Surfaces

- Root workspace dashboard: `/`
- Project hub: `/prototypes/current/project.html?projectId=geopolitics-economics`
- Dynamic page runtime: `/prototypes/current/page.html?pageId=<id>`
- Map runtime/editor: `/prototypes/current/mindmap.html?pageId=<id>`
- Lesson runtime: `/prototypes/current/lesson.html?pageId=<id>`
- Map diagnostics: `/prototypes/current/mindmap.html?debugInput=1`

Important source files:

- Workspace dashboard: `src/App.tsx`
- Global app styles: `src/styles/global.css`
- Local-first store: `public/prototypes/current/workspace-store.js`
- Project hub: `public/prototypes/current/project.html`
- Dynamic page runtime: `public/prototypes/current/page.html`
- Map editor: `public/prototypes/current/mindmap.html`
- Lesson runtime: `public/prototypes/current/lesson.html`

## Current Product State

Preserve these behaviors unless the task explicitly changes them:

- IndexedDB workspace/project/page/document model
- JSON workspace backup/export/import, including invalid backup rejection
- Dynamic `page.html?pageId=<id>` runtime routing
- Created pages opening through real runtime URLs
- PageId-scoped map state
- Guided starters for map, lesson, notes, review, and glossary pages
- Page-document references and document reference blocks
- Map Sources & blocks panel
- Placement mode for Concept, Question, Evidence, and Document blocks
- Project source documents added as document blocks with preserved `documentId`
- Document blocks remain draggable, linkable, and persistent
- Map undo/redo for meaningful edits
- Multi-select for blocks and relationship lines
- Bulk delete, copy/paste, duplicate, and canvas Ctrl/Cmd+A selection
- Connection-port quick-add for linked Concept, Question, Evidence, and Document blocks
- Collision-aware automatic placement for port quick-add, paste, duplicate, and document blocks
- Dynamic relationship re-anchoring as connected blocks move
- Selected-block group drag, arrow-key nudge, and Zoom to selection
- Desktop/trackpad box selection with Shift-drag on empty canvas
- Map pan/zoom, lower-right zoom controls, and responsive overlay lanes
- Selection toolbar behavior
- Edge re-anchoring, long-press behavior, and duplicate context menu suppression
- S Pen/finger drag behavior
- S Pen/finger port tapping behavior
- Lesson scrolling, glossary hints, and read-aloud controls
- Debug mode with `?debugInput=1`

## User-Facing Terminology

Prefer user-visible names in docs, QA, and user communication:

- Say "Sources & blocks panel", not just "workbench".
- Say "selection toolbar", not "selected shelf".
- Say "notification bubble", not "toast".
- Say "zoom controls" or "zoom dock", not only "dock".

Internal code and tests may still use names such as `workbench`, `selectionShelf`, and `toast` when those are the real identifiers.

## Working Rules

- Start feature work from clean `main`.
- Create a new feature branch before editing.
- Do not push, merge, delete branches, rebase, force-push, or create zips unless explicitly asked.
- Do not run `package:review` or `package:verify` unless explicitly asked.
- Do not start cloud/sync/server/PWA/native work unless explicitly requested.
- Do not start PDF/DOCX parsing unless explicitly requested.
- Do not broadly rewrite the map canvas or migrate the app architecture without an approved ExecPlan.
- Preserve current user-approved behavior.
- Prefer small, testable changes over large rewrites.
- Add or update Playwright coverage for behavior changes, especially persistence, map interactions, connectors, context menus, backup/import/export, and read-aloud.
- Keep the UI ADHD/dyslexia-friendly: Comic Sans stack, generous spacing, low visual noise, clear labels, visible focus states, touch-sized controls, and reduced-motion support.

## Documentation Starting Points

- Current state: `docs/product/current-state.md`
- Local-first architecture: `docs/architecture/local-first-workspace.md`
- Learning model: `docs/product/learning-model.md`
- Current smoke checklist: `docs/qa/current-smoke-checklist.md`
- Galaxy Tab/S Pen QA: `docs/qa/galaxy-tab-spen-manual-qa.md`
- ChatGPT continuation handoff: `docs/handoffs/chatgpt-continuation-handoff.md`
- Current main handoff: `docs/handoffs/current-main-handoff.md`

## Verification Before Completion

Run as much of this as the environment allows:

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
```

If a command cannot run, explain exactly why and what was checked instead.

Do not run packaging commands unless explicitly requested:

```bash
npm run package:review
npm run package:verify
```

## High-Priority Regression Risks

Treat these as serious issues:

- blank canvas on load
- created pages failing to open through runtime URLs
- pageId-scoped map state leaking between pages
- backup import replacing data after invalid JSON
- document blocks losing `documentId`
- relationship lines not touching connection ports
- blocks losing content while editing
- map pan/zoom drift or jumpy trackpad behavior
- S Pen/finger drag regressions
- selection toolbar covering important content on tablet
- read-aloud controls blocking lesson content
- accessibility regressions for keyboard users or screen readers
