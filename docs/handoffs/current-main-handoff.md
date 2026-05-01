# Current Main Handoff

## Snapshot

- Project: Neuro Map Studio
- Repo: `https://github.com/Adel199223/neuro-map-studio`
- Local WSL path: `/home/fa507/dev/neuro-map-studio-codex`
- Source-of-truth branch: `main`
- Latest shipped feature baseline: Stage 5A4 low-risk `mindmap.js` module split on top of Stage 5A3 runtime-to-portable snapshot parity fixtures, Stage 5A2 mindmap runtime CSS/JS extraction, Stage 5A1 pure portable contract/model/review helpers, and the Stage 5A0 compatibility audit. For the exact current commit, run `git rev-parse main`.
- Previous Stage 3A2 baseline retained for doctor checks: `7b062803a309b21daeda74e11a6b0183931d0f58`
- Remote source of truth: `origin/main`.

## Current Product State

Neuro Map Studio is a local-first workspace app for learning projects, pages, documents, and editable diagram maps.

Primary surfaces:

- Root workspace dashboard in `src/App.tsx`
- Project hub at `public/prototypes/current/project.html`
- Dynamic page runtime at `public/prototypes/current/page.html?pageId=<id>`
- Map editor route at `public/prototypes/current/mindmap.html?pageId=<id>`, with the prototype stylesheet in `public/prototypes/current/mindmap.css`, the browser entrypoint in `public/prototypes/current/mindmap.js`, and low-risk constants/string/geometry helpers in sibling `mindmap*.js` modules
- Lesson runtime at `public/prototypes/current/lesson.html?pageId=<id>`
- IndexedDB store at `public/prototypes/current/workspace-store.js`

Preserve:

- workspace/project/page/document model
- pageId-scoped map state
- backup/export/import
- guided page starters
- Sources & blocks panel and placement mode
- document blocks with preserved `documentId`
- map undo/redo, multi-select, bulk delete, copy/paste/duplicate, and keyboard shortcut guards
- connection-port quick-add for linked blocks, Connect existing block targeting from ports, selected relationship Change source / Change target reconnect, selected relationship Insert block between, dynamic relationship re-anchoring, and collision-aware placement
- group drag for selected blocks, arrow-key nudge, Zoom to selection, and desktop/trackpad box selection
- S Pen/finger drag, port tapping, pan/zoom, long-press, selection toolbar, and debug mode
- embedded map Review Mode with block, relationship, connected-block, and source/evidence recall cards
- pre-Reveal answer masking on map blocks and relationship labels
- local review attempts/session summaries, Review next priority queue, weak-card queue, and card-type filters
- project hub and root workspace review summaries with Review next, normal review, and weak-card review launch links

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

Review Mode is local-first only. Do not add spaced-repetition scheduling, due-date intervals, AI-generated questions, cloud sync, accounts, or collaboration unless explicitly requested.

## Recommended Start For Future Work

```bash
git switch main
git pull --ff-only origin main
git switch -c task-specific-branch
```

Read `AGENTS.md`, `CODEX_PROMPT.md`, `docs/product/current-state.md`, and `docs/architecture/local-first-workspace.md` before planning larger changes.

For compatibility-guided modernization, also read `docs/architecture/neuro-accessible-reader-compatibility.md`. Stage 5A1 helper work stays pure TypeScript under `src/features/learning-map/`; Stage 5A2 keeps `mindmap.html` as the route shell while externalizing only `mindmap.css` and `mindmap.js`; Stage 5A3 adds `runtimePortableSnapshot.ts` and runtime parity fixtures that prove saved map page-state data can be represented by the portable contract. Stage 5A4 keeps `mindmap.js` as the runtime entrypoint while extracting only low-risk constants, string/DOM-target utilities, and geometry helpers. The runtime is still plain browser JavaScript, not wired to the Stage 5A1/5A3 helper baseline, and Accessible Reader remains read-only unless explicitly approved.
