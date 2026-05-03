# Stage 5A13 Product-Vs-Modernization Direction Check

## Summary

Stage 5A13 is a docs-only checkpoint after Stage 5A12 test/flake hardening. It compares returning to product work against continuing runtime modernization or starting Accessible Reader compatibility adapter work.

No runtime source, tests, routes, storage keys, backup/import behavior, UI, GitHub Pages deployment, Stage 5A1/5A3 runtime wiring, React/TypeScript architecture, or Accessible Reader files are changed by this checkpoint.

## Method

The checkpoint reviewed:

- the Stage 5A12 baseline at `72803f390b68919dd9e3532ab2a7759e4e6965f4`;
- current `mindmap.js` size and helper module inventory;
- Stage 5A11 post-document health findings;
- Stage 5A12 QA hardening notes;
- the current roadmap and product state;
- Accessible Reader compatibility audit direction;
- remaining high-risk `mindmap.js` subsystems.

Accessible Reader was inspected for status/SHA only and remains read-only.

## Findings

- The key data seams are already in place: portable contract helpers, runtime snapshot parity, review/storage helpers, relationship data helpers, menu descriptor helpers, and document/source helpers.
- `mindmap.js` is still large, but the remaining code is mostly DOM, SVG, pointer, selection, persistence orchestration, and runtime state wiring.
- Stage 5A12 reduced known test timing risk, but rendering and gesture/input splits would still be behavior-sensitive.
- Product-facing source/document workflow polish can now use the modular foundation with lower risk than another split.
- Accessible Reader compatibility work should remain non-integration and fixture/contract-only until explicitly approved.

## Recommendation

Primary next slice: return to product work with a narrow Sources & blocks / document references polish slice.

The slice should improve learner-visible source/document clarity without changing routes, storage keys, backup/import behavior, or runtime architecture. It should lean on the Stage 5A10 document helpers and the existing document/reference tests.

Suggested scope:

- make source/document metadata easier to scan in the Sources & blocks panel;
- clarify document reference blocks and page-document reference context;
- preserve `documentId` behavior across map state, reload, backup/export/import, and review cards;
- keep the product surface ADHD/dyslexia-friendly with clear labels, low visual noise, and touch-sized controls.

Explicit non-goals:

- no PDF/DOCX parsing;
- no cloud sync, backend endpoints, or storage migrations;
- no Accessible Reader integration or edits;
- no React rewrite or TypeScript conversion of `mindmap.js`;
- no runtime contract wiring from Stage 5A1/5A3 helpers;
- no broad rendering, selection/toolbar, gesture/input, or storage side-effect split.

## Fallback

Fallback next slice: selection/toolbar helper split only if modernization is intentionally continued.

The fallback should extract only pure selection-summary, toolbar descriptor, action availability, and label helpers. It should keep DOM rendering, toolbar positioning, menu dispatch, pointer/touch/S Pen flows, clipboard mutations, keyboard listeners, render/save/history/status calls, and selection state ownership inside `mindmap.js`.

Rendering and gesture/input splits remain deferred because their user-facing regression risk is higher than their immediate value. Accessible Reader compatibility adapter work remains too early beyond pure fixture or adapter review.

## Verification For This Docs Slice

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

Expected Playwright shape:

- 346 project-runs
- 341 passed
- 5 expected skips

If a known Stage 5A12 family transient appears, rerun the exact failing test sequentially with `--workers=1`, then rerun full e2e/check before completing.

## Ready-To-Use Next Codex Prompt

```text
We are starting a narrow product slice: Sources & blocks / document references polish.

Repo:
/home/fa507/dev/neuro-map-studio-codex

Accessible Reader repo for read-only status confirmation only:
/home/fa507/dev/accessible_reader

Current expected baseline:
- Neuro Map Studio main and origin/main include Stage 5A13 direction checkpoint.
- Stage 5A0 through Stage 5A13 are on main.
- Runtime/product behavior is stable after Stage 5A12 test/flake hardening.
- mindmap.js remains the browser entrypoint.
- Accessible Reader remains separate and must stay read-only.

Important:
- This is product polish, not another runtime split.
- Do not edit Accessible Reader.
- Do not integrate NeuroMap into Accessible Reader.
- Do not add PDF/DOCX parsing.
- Do not change routes, storage keys, backup/import behavior, GitHub Pages deployment, or local-first persistence semantics.
- Do not convert mindmap.js to TypeScript.
- Do not rewrite NeuroMap in React.
- Do not wire Stage 5A1/5A3 TypeScript helpers into the browser runtime.
- Do not split rendering, gesture/input, storage side effects, relationship runtime, or selection/toolbar systems.
- Do not run package:review or package:verify unless explicitly asked.
- Do not push, merge, rebase, squash, force-push, or delete branches unless explicitly asked.

Goal:
Improve source/document workflow clarity for learners while preserving behavior exactly.

Focus:
- Make source/document metadata easier to scan in the Sources & blocks panel.
- Improve document reference block clarity and page-document reference context.
- Preserve documentId behavior across document blocks, reload, map state, workspace backup/export/import, and review cards.
- Keep the interface ADHD/dyslexia-friendly: clear labels, low visual noise, generous spacing, visible focus, and touch-sized controls.

Before editing:
- Confirm main/origin/main are clean.
- Confirm current mindmap helper modules exist, including mindmapDocumentHelpers.js.
- Confirm Accessible Reader status/SHA read-only only.
- Create a feature branch.
- Read current-state, roadmap, Stage 5A13 direction docs, document helper tests, workspace-core tests, and prototype document/source/review tests.

Implementation guidance:
- Prefer small UI copy, metadata, descriptor, or document-reference clarity improvements.
- Use existing document/source helpers where they already fit.
- Add or update focused Playwright coverage for changed document/source behavior.
- Avoid broad layout redesign and avoid changing map serialization.

Required checks:
- npm run doctor
- npm run typecheck
- npm run lint
- npm run build
- GITHUB_PAGES=true npm run build
- focused document/source/workspace/review specs
- npm run test:e2e
- npm run check
- git diff --check

Artifacts:
- Create a review artifact folder and review ZIP.
- Include changed files, diff stat, patch, test summaries, and screenshots if UI changed.

Commit locally after checks pass. Do not push or merge.
```
