# Stage 5A4 Mindmap Low-Risk Module Split Exec Plan

## Goal

Begin behavior-preserving modularization of the extracted map runtime by moving only low-risk static data and pure helpers out of `public/prototypes/current/mindmap.js`.

## Scope

- Keep `public/prototypes/current/mindmap.html` as the route shell and `public/prototypes/current/mindmap.js` as the browser entrypoint.
- Add sibling modules for constants, string/DOM-target utilities, and geometry helpers.
- Do not wire Stage 5A1 or Stage 5A3 TypeScript helpers into the browser runtime.
- Do not split review, storage/autosave, pointer/gesture, drag, placement, or rendering systems in this slice.
- Do not edit Accessible Reader.

## Implementation

- Extract static map/review/input constants into `public/prototypes/current/mindmapConstants.js`.
- Extract pure helpers such as `clean`, `cloneJson`, `escapeHtml`, pointer-kind checks, editable-target checks, and canvas-blocked-target checks into `public/prototypes/current/mindmapDomUtils.js`.
- Extract pure geometry helpers such as `clamp`, `rectsOverlap`, `distance`, port-point math, and edge path geometry into `public/prototypes/current/mindmapGeometry.js`.
- Update `mindmap.js` imports and remove only the moved declarations.
- Keep `mindmap.js` ignored by ESLint; keep the new modules lint-clean.
- Update doctor and static Playwright coverage so the module boundary is part of the harness contract.

## Verification

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

Focused specs:

```bash
npx playwright test tests/e2e/mindmap-runtime-extraction.spec.ts
npx playwright test tests/e2e/runtime-portable-snapshot-parity.spec.ts
npx playwright test tests/e2e/learning-map-portable-contract.spec.ts
```

Also verify the GitHub Pages build output contains `prototypes/current/mindmap.html`, `mindmap.css`, `mindmap.js`, and the new helper modules.

## Handoff Notes

Record before/after `mindmap.js` size and line counts, extracted module sizes, changed files, check results, screenshots, and artifact paths. The next modularization slice should split one stateful subsystem at a time only after this low-risk boundary is reviewed.
