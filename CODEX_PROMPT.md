# Starter Prompt For Future Codex Sessions

Paste this into Codex from the repository root when starting a new task.

```text
Goal: Continue Neuro Map Studio from the current main branch without relying on old chat context.

First inspect:
- git status --short --branch
- git branch -vv
- git rev-parse HEAD
- git rev-parse main
- git rev-parse origin/main
- AGENTS.md
- README.md
- docs/handoffs/current-main-handoff.md
- docs/product/current-state.md
- docs/architecture/local-first-workspace.md
- docs/qa/current-smoke-checklist.md
- public/prototypes/current/workspace-store.js
- public/prototypes/current/project.html
- public/prototypes/current/page.html
- public/prototypes/current/mindmap.html
- tests/e2e/prototype.spec.ts

Current architecture summary:
- Root React workspace dashboard in src/App.tsx.
- Local-first IndexedDB workspace store in public/prototypes/current/workspace-store.js.
- Project hub has Pages, Documents, and Utilities boards.
- Dynamic page runtime uses page.html?pageId=<id>.
- Map pages are pageId-scoped and open through mindmap.html?pageId=<id>.
- Map editor includes a Sources & blocks panel, placement mode, document blocks, selection toolbar, notification bubbles, zoom controls, and debug mode with ?debugInput=1.
- Map editor also includes undo/redo, multi-select, bulk delete, copy/paste/duplicate, port quick-add, collision-aware placement, selected-block group drag, arrow-key nudge, Zoom to selection, and desktop/trackpad Shift-drag box selection.
- Backup/export/import uses plain JSON and must reject invalid backups safely.

Safety rules:
- Start new work from clean main.
- Create a feature branch before editing.
- Do not push, merge, delete branches, rebase, force-push, create zips, or run package:review/package:verify unless explicitly asked.
- Do not start cloud/sync/server/PWA/native work or PDF/DOCX parsing unless explicitly requested.
- Preserve current runtime, backup/import/export, Sources & blocks, placement mode, document block, map editing safety, port quick-add, collision-aware placement, group movement, box selection, read-aloud, and tablet/S Pen behavior.

Normal checks:
- npm run doctor
- npm run typecheck
- npm run lint
- npm run build
- GITHUB_PAGES=true npm run build
- npm run test:e2e
- npm run check

Handoff expectations:
- State starting branch/SHA and ending branch/SHA.
- List files changed and checks run.
- Say whether committed and whether pushed.
- Save requested handoff files to Windows Downloads when asked.
```

## Bug Fix Prompt Template

```text
Fix this specific Neuro Map Studio issue: <describe issue>.

Start by reproducing or locating the behavior on current main. Make the smallest safe change, add or update focused Playwright coverage if feasible, run the relevant checks plus npm run check when practical, and preserve unrelated behavior.
```
