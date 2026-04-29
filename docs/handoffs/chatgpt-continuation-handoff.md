# ChatGPT Continuation Handoff

Copy this into a new ChatGPT/Codex conversation when you want to continue Neuro Map Studio work.

```text
Project: Neuro Map Studio
Repo: https://github.com/Adel199223/neuro-map-studio
Local WSL path: /home/fa507/dev/neuro-map-studio-codex
Source-of-truth branch: main
Latest shipped feature baseline: Stage 3B3 Insert block between relationship endpoints.
For the exact current commit, run: git rev-parse main

Current state:
- The app is a local-first learning workspace, not just a standalone Simon Dixon prototype.
- Root dashboard, project hub, dynamic page runtime, map runtime, lesson runtime, and IndexedDB workspace store are all on main.
- Pages open through page.html?pageId=<id>; map pages open through mindmap.html?pageId=<id>.
- JSON workspace backup/export/import is implemented and invalid imports are rejected.
- Guided starters exist for map, lesson, notes, review, and glossary pages.
- Map editor has a Sources & blocks panel, placement mode for Concept/Question/Evidence/Document, project source document blocks, selection toolbar, notification bubbles, zoom controls, tablet/S Pen handling, and ?debugInput=1 diagnostics.
- Map editing safety is live: undo/redo, multi-select blocks and relationship lines, bulk delete, copy/paste/duplicate, and shortcut guards inside editable text.
- Connection-port quick-add is live: visible ports open Concept/Question/Evidence/Document linked-block creation, with dynamic relationship re-anchoring and collision-aware placement.
- Relationship correction is live: Connect existing block from ports, selected-line Change source / Change target, and selected-line Insert block between.
- Navigation polish is live: selected-block group drag, arrow-key nudge, Zoom to selection, and desktop/trackpad additive box selection with Shift-drag on empty canvas.
- Review Mode is live: map recall cards, weak-card review, Review next priority review, card-type filters, local review persistence, and project/workspace review summaries.

Terminology:
- Use "Sources & blocks panel" for the visible map source/block panel.
- Use "selection toolbar" for selected block/link actions.
- Use "notification bubble" for temporary status messages.
- Use "zoom controls" or "zoom dock" for lower-right zoom buttons.

Before editing:
- git status --short --branch
- git branch -vv
- git rev-parse HEAD
- git rev-parse main
- git rev-parse origin/main
- git switch main
- git pull --ff-only origin main
- git switch -c <new-task-branch>

Normal checks:
- npm run doctor
- npm run typecheck
- npm run lint
- npm run build
- GITHUB_PAGES=true npm run build
- npm run test:e2e
- npm run check

Do not:
- push, merge, delete branches, rebase, force-push, create zips, or run package:review/package:verify unless explicitly asked.
- start cloud/sync/server/PWA/native work or PDF/DOCX parsing unless explicitly requested.
- rewrite the map engine or redesign the dashboard unless the task explicitly asks.

Good next directions:
- improve source/document workflow inside the map editor;
- polish relationship labels and hover-only relationship affordances;
- improve review/retrieval pages without adding full spaced repetition unless explicitly requested;
- strengthen backup restore/replace safety;
- measure performance for larger maps;
- design a future operation-log architecture without implementing cloud sync yet.
```
