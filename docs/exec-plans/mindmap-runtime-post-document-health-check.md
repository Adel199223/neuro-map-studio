# Stage 5A11 Mindmap Runtime Post-Document Health Check

## Summary

Stage 5A11 is a docs-only checkpoint after the Stage 5A10 document/source helper split. It reassesses the next modernization choice using current code shape, test coverage, recent transient failures, and future Accessible Reader compatibility.

No runtime source, tests, routes, storage keys, backup/import behavior, GitHub Pages deployment, Stage 5A1/5A3 runtime wiring, React/TypeScript architecture, or Accessible Reader files are changed by this checkpoint.

## Findings

- `mindmap.js` remains the browser entrypoint at 5,360 lines / 264,867 bytes.
- Current helper modules are present and doctor-checked: constants, DOM utilities, geometry, review, storage, relationship, menu, and document helpers.
- Extracted helper modules are lint-covered; `mindmap.js` remains explicitly ignored by ESLint.
- The strongest Accessible Reader compatibility seams are already in place: portable contract helpers, runtime portable snapshot parity, pure relationship data helpers, and pure document/source data helpers.
- Remaining candidate splits are much more coupled to DOM, SVG rendering, live layout, pointer state, selection state, and tablet/S Pen behavior.

## Candidate Decision

Primary recommendation: **test/flake hardening only**.

This should be the next slice before further runtime splitting. It should focus on strengthening the known transient families:

- Chromium high-zoom port quick-add placement.
- Selected-link toolbar visibility/assertion behavior.
- Keyboard shortcut guards while editing block text.
- Selected relationship Insert block between assertions.
- Focused Playwright sequencing to avoid Vite port contention.

Fallback recommendation: **pause modernization and return to product work**.

This is reasonable because Stage 5A1 through Stage 5A10 already created the key data and helper boundaries needed for future compatibility work. Product work should remain local-first and behavior-preserving unless separately approved.

## Explicit Deferrals

- Do not split rendering next. Rendering still owns DOM/SVG output, ports, relationship labels, review highlights, and visual regression risk.
- Do not split gesture/input next. Pointer capture, long-press, touch/S Pen drag, port tapping, pan/zoom, and debug diagnostics remain too sensitive.
- Do not split selection/toolbar next. Selection toolbar positioning, selected-link controls, multi-select, clipboard, and keyboard paths overlap recent transient areas.
- Do not split document picker DOM next unless modernization must continue after hardening. Pure document/source data helpers already landed in Stage 5A10.
- Do not wire Stage 5A1/5A3 TypeScript helpers into the browser runtime yet.
- Do not edit or integrate Accessible Reader.

## Required Verification For This Docs Slice

Run:

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
GITHUB_PAGES=true npm run build
npm run test:e2e
npm run check
git diff --check
```

Expected full Playwright shape from the Stage 5A10 baseline:

- 346 project-runs
- 341 passed
- 5 expected skips

If a known transient appears, rerun the exact failing test sequentially five times where applicable, then rerun the final full e2e/check before completion. Record the transient as test health evidence if final gates pass.

## Ready-To-Use Next Codex Prompt

```text
We are starting Stage 5A12: Mindmap runtime test/flake hardening.

Repo:
/home/fa507/dev/neuro-map-studio-codex

Accessible Reader repo for read-only status confirmation only:
/home/fa507/dev/accessible_reader

Current expected baseline:
- Neuro Map Studio main and origin/main should include Stage 5A11 post-document health check.
- Stage 5A0 through Stage 5A11 are on main.
- mindmap.js remains the browser entrypoint.
- Accessible Reader remains separate and must stay read-only.

Important:
- This is a test/flake hardening slice, not a runtime refactor.
- Do not split more runtime code.
- Do not edit Accessible Reader.
- Do not integrate NeuroMap into Accessible Reader.
- Do not change runtime/UI behavior, routes, storage keys, backup/import behavior, or GitHub Pages deployment.
- Do not convert mindmap.js to TypeScript.
- Do not rewrite NeuroMap in React.
- Do not wire Stage 5A1/5A3 TypeScript helpers into the browser runtime.
- Do not run package:review or package:verify unless explicitly asked.
- Do not push, merge, rebase, squash, force-push, or delete branches unless explicitly asked.

Goal:
Harden the known Stage 5A modernization transient test families before any further runtime module split.

Focus areas:
- Chromium high-zoom port quick-add placement.
- Selected-link toolbar visibility/assertions.
- Keyboard shortcuts while editing block text.
- Selected relationship Insert block between assertions.
- Focused Playwright sequencing/Vite port contention guidance.

Implementation guidance:
- Prefer test harness hardening and deterministic waits/assertions over product code changes.
- Product code changes are allowed only if a real bug is proven and fixed behavior-preservingly.
- Keep all focused Playwright runs sequential.
- Record whether each known transient reproduces before and after hardening.

Required checks:
- npm run doctor
- npm run typecheck
- npm run lint
- npm run build
- GITHUB_PAGES=true npm run build
- focused e2e specs for the affected paths
- npm run test:e2e
- npm run check
- git diff --check

Artifacts:
- Create a Stage 5A12 hardening artifact folder and review ZIP.
- Include before/after flake evidence, exact rerun counts, focused logs, full check logs, changed files, patch, and final repo statuses.

Commit locally after checks pass. Do not push or merge.
```
