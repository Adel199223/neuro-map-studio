# Current Main Handoff

## Snapshot

- Project: Neuro Map Studio
- Repo: `https://github.com/Adel199223/neuro-map-studio`
- Local WSL path: `/home/fa507/dev/neuro-map-studio-codex`
- Source-of-truth branch: `main`
- Current main SHA: `226f716e45380174095770fb58ae0ca997f012bf`
- Branch state after cleanup: only `main` exists locally and remotely.

## Current Product State

Neuro Map Studio is a local-first workspace app for learning projects, pages, documents, and editable diagram maps.

Primary surfaces:

- Root workspace dashboard in `src/App.tsx`
- Project hub at `public/prototypes/current/project.html`
- Dynamic page runtime at `public/prototypes/current/page.html?pageId=<id>`
- Map editor at `public/prototypes/current/mindmap.html?pageId=<id>`
- Lesson runtime at `public/prototypes/current/lesson.html?pageId=<id>`
- IndexedDB store at `public/prototypes/current/workspace-store.js`

Preserve:

- workspace/project/page/document model
- pageId-scoped map state
- backup/export/import
- guided page starters
- Sources & blocks panel and placement mode
- document blocks with preserved `documentId`
- S Pen/finger drag, pan/zoom, long-press, selection toolbar, and debug mode

## Normal Checks

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
```

Do not run `package:review`, `package:verify`, create zips, push, merge, delete branches, rebase, or force-push unless explicitly asked.

## Recommended Start For Future Work

```bash
git switch main
git pull --ff-only origin main
git switch -c task-specific-branch
```

Read `AGENTS.md`, `CODEX_PROMPT.md`, `docs/product/current-state.md`, and `docs/architecture/local-first-workspace.md` before planning larger changes.
