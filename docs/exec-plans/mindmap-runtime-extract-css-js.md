# Stage 5A2 Mindmap Runtime CSS/JS Extraction Exec Plan

## Goal

Reduce `public/prototypes/current/mindmap.html` by moving its existing inline stylesheet and inline map runtime script into sibling files:

- `public/prototypes/current/mindmap.css`
- `public/prototypes/current/mindmap.js`

This is a refactor-only slice. It preserves the current map route, UI, storage keys, query parameters, backup/import behavior, GitHub Pages deployment shape, and plain browser JavaScript runtime.

## Gates

Start from clean `main` at `414a1d04987b1bcd965c6158408c04e998ee8b9d` or a clean descendant. Confirm:

- Stage 5A0 docs are present.
- Stage 5A1 portable contract/model/review helper files and tests are present.
- Accessible Reader is inspected read-only and not edited.
- The current `mindmap.html` has one large inline `<style>` block and one large `type="module"` script.

Create the working branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c mindmap-runtime-extract-css-js
```

## Scope

Allowed changes:

- Move the inline CSS body into `mindmap.css`.
- Move the inline module script body into `mindmap.js`.
- Replace the removed blocks with:
  - `<link rel="stylesheet" href="./mindmap.css">`
  - `<script type="module" src="./mindmap.js"></script>`
- Add static and smoke tests for the extracted assets.
- Update doctor checks so future large inline style/script regressions are caught.
- Update docs to describe the new file shape.

Non-goals:

- No Accessible Reader integration or edits.
- No React rewrite.
- No TypeScript conversion of the runtime script.
- No split of `mindmap.js` into modules.
- No Stage 5A1 helper wiring.
- No route, storage key, backup/import, query parameter, or behavior changes.
- No packaging commands or release ZIPs.

## Implementation Notes

The extraction should be mechanical. Preserve CSS, JavaScript, and the existing `./workspace-store.js` import exactly unless a path fix is required. Do not add imports for `review-summary.js`, `map-defaults.js`, or Stage 5A1 helpers because the current map script does not import them.

Keep ESLint behavior equivalent to the pre-extraction state by ignoring only `public/prototypes/current/mindmap.js`; the inline script was not previously linted, and making it lint-clean belongs in a separate behavior-aware cleanup.

## Validation

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

After the GitHub Pages build, verify these files exist:

- `dist/prototypes/current/mindmap.html`
- `dist/prototypes/current/mindmap.css`
- `dist/prototypes/current/mindmap.js`

Also verify the built HTML references `./mindmap.css` and `./mindmap.js`.

## Handoff

Report:

- branch name and final SHA
- base SHA
- before/after `mindmap.html` size and line count
- new `mindmap.css` and `mindmap.js` size and line count
- changed files
- checks and Playwright results
- Pages build file verification
- Accessible Reader status/SHA and read-only confirmation
- known limitations: `mindmap.js` remains monolithic and ESLint-ignored, Stage 5A1 helpers remain unwired, and no Accessible Reader integration was attempted
- recommended next slice: Stage 5A3 adapter/runtime fixture hardening or a later behavior-preserving modular JS split
