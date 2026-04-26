# Neuro Map Studio

Neuro Map Studio is a local-first ADHD/dyslexia-friendly learning workspace for projects, pages, documents, and editable diagram maps. It is currently a prototype-first web app with the current user-approved runtime preserved under `public/prototypes/current/` and a React workspace dashboard in `src/App.tsx`.

## Current App

The current app includes:

- a root workspace dashboard with recent work, projects, quick creation, backup/restore, help, and developer utilities;
- a project hub with Pages, Documents, and Utilities boards;
- a local-first IndexedDB workspace/project/page/document model;
- dynamic page runtime URLs through `page.html?pageId=<id>`;
- guided starters for map, lesson, notes, review, and glossary pages;
- JSON workspace backup/export/import with invalid-backup rejection;
- a map editor with Sources & blocks panel, placement mode, document blocks, selection toolbar, notification bubbles, zoom controls, and tablet/S Pen interaction support;
- a lesson runtime with glossary hints and read-aloud controls.

The current source-of-truth branch is `main`.

## Important Routes

Use the Vite dev server locally:

- Workspace dashboard: `/`
- Project hub: `/prototypes/current/project.html?projectId=geopolitics-economics`
- Dynamic page runtime: `/prototypes/current/page.html?pageId=<id>`
- Map editor: `/prototypes/current/mindmap.html?pageId=<id>`
- Lesson runtime: `/prototypes/current/lesson.html?pageId=<id>`
- Map diagnostics: `/prototypes/current/mindmap.html?debugInput=1`

GitHub Pages live preview:

- App root: `https://adel199223.github.io/neuro-map-studio/`
- Project hub: `https://adel199223.github.io/neuro-map-studio/prototypes/current/project.html?projectId=geopolitics-economics`
- Generic page runtime: `https://adel199223.github.io/neuro-map-studio/prototypes/current/page.html`
- Lesson runtime: `https://adel199223.github.io/neuro-map-studio/prototypes/current/lesson.html`
- Map runtime: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html`
- Debug map runtime: `https://adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html?debugInput=1`

## Recommended Setup

Use WSL 2 if you plan to run Codex, Node, Git, Playwright, and shell tools from Linux. Keep the repo inside the WSL filesystem, not under `/mnt/c/...`, for better file performance.

Example:

```bash
cd ~/dev/neuro-map-studio-codex
npm install
npx playwright install chromium
npm run dev -- --host 0.0.0.0
```

Then open the URL printed by Vite, usually `http://localhost:5173/`.

If the repo lives in WSL, do not run `npm` from PowerShell while your current directory is a UNC path such as `\\wsl.localhost\Ubuntu\home\...`. Run verification from WSL using the Linux path instead.

## Scripts

```bash
npm run dev          # start local dev server
npm run build        # build-mode typecheck + Vite build
npm run typecheck    # build-mode TypeScript project-graph check
npm run lint         # ESLint
npm run test:e2e     # Playwright checks
npm run doctor       # repo health checks
npm run check        # doctor + lint + build + e2e
```

Packaging scripts exist for explicit review-bundle requests only:

```bash
npm run package:review
npm run package:verify
```

Do not run packaging scripts or create a zip unless explicitly asked.

## Documentation Map

- Agent instructions: `AGENTS.md`
- Future Codex starter: `CODEX_PROMPT.md`
- Current main handoff: `docs/handoffs/current-main-handoff.md`
- ChatGPT continuation handoff: `docs/handoffs/chatgpt-continuation-handoff.md`
- Current product state: `docs/product/current-state.md`
- Learning model: `docs/product/learning-model.md`
- Local-first architecture: `docs/architecture/local-first-workspace.md`
- Smoke checklist: `docs/qa/current-smoke-checklist.md`
- Galaxy Tab/S Pen checklist: `docs/qa/galaxy-tab-spen-manual-qa.md`
- Next slices: `docs/roadmap/next-slices.md`

## Development Rules

- Start from clean `main`.
- Create a feature branch before editing.
- Preserve current behavior unless the task explicitly changes it.
- Do not push, merge, delete branches, rebase, force-push, create zips, or run packaging scripts unless explicitly asked.
- Do not start cloud/sync/server/PWA/native work or PDF/DOCX parsing unless explicitly requested.
- Keep the UI dyslexia/ADHD-friendly: Comic Sans stack, generous spacing, low visual noise, clear labels, focus states, touch-sized controls, and reduced-motion support.

## Normal Verification

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
```

If Playwright browsers are missing, install Chromium with:

```bash
npx playwright install chromium
```

## User-Facing Terminology

Use visible product names in docs and QA:

- "Sources & blocks panel"
- "selection toolbar"
- "notification bubble"
- "zoom controls"

Internal code and tests may still use identifiers such as `workbench`, `selectionShelf`, and `toast`.
