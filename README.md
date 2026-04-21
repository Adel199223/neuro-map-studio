# Neuro Map Studio

Neuro Map Studio is a prototype-first ADHD/dyslexia-friendly learning app that combines a lesson page with read-aloud support and an editable learning map. This repo keeps the current user-approved HTML prototypes as the source of truth while the modular app architecture is built out around them.

The current app has two parts:

1. an ADHD/dyslexia-friendly lesson page with glossary hover terms and read-aloud support;
2. an advanced editable learning map with blocks, relationship lines, pages, context menus, pan/zoom, import/export, and autosave.

## Current source of truth

Open these files through the Vite dev server:

- Current learning map prototype: `/prototypes/current/mindmap.html`
- Current lesson prototype: `/prototypes/current/lesson.html`

Untouched reference copies are stored in:

- `public/prototypes/reference-single-file/`

The repo also includes Codex/agent development instructions and project harness docs such as `AGENTS.md`, `CODEX_PROMPT.md`, and `docs/project-instructions/`. Those files are development context, not end-user product docs.

## Recommended setup

Use WSL 2 if you plan to run Codex, Node, Git, Playwright, and shell tools from Linux.
Keep the repo inside the WSL filesystem, not under `/mnt/c/...`, for better file performance.

Example location:

```bash
mkdir -p ~/projects
cd ~/projects
unzip /path/to/neuro-map-studio-codex-harness.zip
cd neuro-map-studio-codex
npm install
npx playwright install chromium
npm run dev
```

Then open the URL printed by Vite, usually `http://localhost:5173`.

If you use Windows-native Node/PowerShell/Codex instead, keep the repo on the Windows filesystem and run the same npm commands in PowerShell.

If the repo lives in WSL, do not run `npm` from PowerShell while your current directory is a UNC path such as `\\wsl.localhost\Ubuntu\home\...`. `npm` shells out through Windows `cmd.exe` in that case, which can fall back out of the repo and produce misleading missing-module or missing-script errors. Run verification from WSL using the Linux path instead.

## Scripts

```bash
npm run dev          # start local dev server
npm run build        # build-mode typecheck + Vite build
npm run typecheck    # build-mode TypeScript project-graph check
npm run lint         # ESLint
npm run test:e2e     # Playwright checks
npm run doctor       # repo health checks
npm run check        # doctor + lint + build + e2e
npm run package:review  # build artifacts/neuro-map-studio-review-context.zip
npm run package:verify  # extract the review zip and run doctor-level checks
```

## Verification note

For a WSL-hosted repo, run verification from a WSL shell. The path below is an example:

```bash
cd ~/projects/neuro-map-studio-codex
npm run doctor
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

If Playwright browsers are missing, install them with `npx playwright install chromium`. Missing browsers are an environment prerequisite, not an app failure.

## Review zip workflow

When you want to send the repo to ChatGPT.com or another external reviewer, create the bundle from WSL with the repo-owned packaging scripts instead of ad hoc shell zip/glob commands:

```bash
cd ~/projects/neuro-map-studio-codex
npm run package:review
npm run package:verify
```

This creates `artifacts/neuro-map-studio-review-context.zip`, includes required dot-directories such as `.agents/`, and checks the extracted copy with `node scripts/doctor.mjs` before you share it.

## Live preview

GitHub Pages is the small static live preview for this repo:

- App root: `https://Adel199223.github.io/neuro-map-studio/`
- Current learning map prototype: `https://Adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html`
- Current lesson prototype: `https://Adel199223.github.io/neuro-map-studio/prototypes/current/lesson.html`

This Pages deployment is only a static preview of the current repo state. It is not the planned computer-as-local-server sync system described in `docs/product/tablet-pen-sync-architecture.md`.

Tablet-friendly interaction support is now in progress in the current learning-map prototype: major edit actions are being exposed through long-press and a compact selected-item toolbar so tablet and S Pen workflows do not rely on right-click alone.

For real-device Galaxy Tab / S Pen testing, use the manual checklist in `docs/qa/galaxy-tab-spen-manual-qa.md`. An optional diagnostics view is available only when you open `https://Adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html?debugInput=1`.

## First Codex task suggestion

Ask Codex to inspect `public/prototypes/current/mindmap.html`, `docs/product/product-requirements.md`, `docs/product/interaction-contract.md`, and `AGENTS.md`; then write an execution plan before changing code.

The exact starter prompt is in `CODEX_PROMPT.md`.

## Architecture target

Move gradually from monolithic HTML to modular code:

- `src/features/learning-map/` for the canvas, nodes, connectors, page/workspace persistence, and editing commands;
- `src/features/read-aloud/` for Speechify-like reading tools;
- `src/data/` for seed maps and imported lesson data;
- `tests/e2e/` for regression checks against blank canvas, zoom drift, connectors, context menus, and saved workspace behavior.

For the future Galaxy Tab/S Pen plus computer-as-local-server direction, see `docs/product/tablet-pen-sync-architecture.md`. That document is roadmap architecture guidance, not a completed implementation.

Do not lose the current prototype while refactoring. Keep the prototype as a regression oracle until the modular app matches it.
