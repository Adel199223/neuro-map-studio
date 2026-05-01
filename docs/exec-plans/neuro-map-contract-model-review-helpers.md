# Stage 5A1 NeuroMap Portable Contract Helpers

## Purpose

Extract pure NeuroMap contract, model, review, and preview-adapter helpers behind the Stage 5A0 compatibility contract. This slice prepares future modularization without integrating Accessible Reader and without wiring the helpers into the current runtime.

## Gates

- Start from clean `main` at `2ae40a57cc1c038df394d30f230e5c90a66076d7` or a descendant.
- Pull with `git pull --ff-only origin main`.
- Confirm Stage 5A0 docs exist:
  - `docs/architecture/neuro-accessible-reader-compatibility.md`
  - `docs/exec-plans/neuro-accessible-reader-compatibility-audit.md`
  - `docs/roadmap/next-slices.md`
- Confirm Stage 3B3 remains on main.
- Inspect Accessible Reader read-only only; do not edit files in `/home/fa507/dev/accessible_reader`.
- Create `neuro-map-contract-model-review-helpers` before editing.

## Non-Goals

- No Accessible Reader integration.
- No Accessible Reader edits.
- No backend endpoints or storage migration.
- No UI, route, storage-key, backup, import, or product-behavior changes.
- No `mindmap.html` split or runtime module extraction.
- No React rewrite or TypeScript conversion of the map runtime script.
- No push, merge, rebase, squash, force-push, branch deletion, `package:review`, or `package:verify`.

## Implementation

Add pure helpers under `src/features/learning-map/`:

| File | Responsibility |
| --- | --- |
| `portableContract.ts` | Version constants and serializable NeuroMap snapshot, block, relationship, document ref, review, layout, and bundle types. |
| `portableSnapshot.ts` | Snapshot normalization, map-state snapshot construction through `workspaceCore.normalizeMap`, validation, summary, document refs, and valid relationship refs. |
| `portableReview.ts` | Latest-attempt selection, weak-card detection, Review next ordering, card-type filters, summary counts, and rating vocabulary preview mapping. |
| `portableAdapters.ts` | Preview-only Accessible Reader-shaped graph data while keeping layout, ports, labels, routes, and metadata outside graph semantics. |

Add fixture and test coverage:

| File | Responsibility |
| --- | --- |
| `tests/fixtures/learning-map/portableFixtures.ts` | Small typed NeuroMap fixture with concept/question/evidence/document blocks, document refs, relationship ports/routes/styles, review cards, attempts, and unknown metadata. |
| `tests/e2e/learning-map-portable-contract.spec.ts` | Playwright-runner pure tests that do not open the UI. |

## Required Behaviors

- Preserve original NeuroMap IDs.
- Use `contractVersion = "neuro-map-snapshot.v1"` and `bundleVersion = "neuro-map-bundle.v1"`.
- Preserve supplied timestamps, but do not invent timestamps during normalization.
- Preserve unknown metadata as `Record<string, unknown>`.
- Keep layout in explicit layout fields and adapter sidecars, not graph node/edge semantics.
- Keep ratings exactly `got-it`, `almost`, and `missed`.
- Map rating previews as `missed -> forgot`, `almost -> hard`, `got-it -> good`; never infer Accessible Reader `easy`.
- Treat adapter output as local preview data only, with no Accessible Reader imports or writes.

## Validation

Run in Neuro Map Studio only:

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

Do not run Accessible Reader tests unless explicitly requested. If an Accessible Reader status is collected, it must be read-only.

## Artifacts

Create `/home/fa507/Downloads/neuro-stage5a1-contract-model-review-helpers/` with:

- `stage5a1-contract-model-review-helpers-report.md`
- `neuro-repo-status.txt`
- `accessible-reader-repo-status.txt`
- `branch-commits.txt`
- `changed-files.txt`
- `diff-stat.txt`
- `stage5a1-contract-model-review-helpers.patch`
- `contract-api-summary.md`
- `test-fixture-summary.md`
- copied changed source, fixture, test, and doc files where practical

Create `/home/fa507/Downloads/neuro-stage5a1-contract-model-review-helpers-share.zip` as a review artifact ZIP, not a release/package ZIP. If WSL Windows Downloads exists, copy the artifact folder and ZIP there too.

## Commit And Handoff

Commit locally only after checks pass:

```bash
git commit -m "feat: add NeuroMap portable contract helpers"
```

Final handoff should include branch, base SHA, final SHA, changed files, Accessible Reader read-only status, helper summary, rating mapping behavior, adapter-preview behavior, test count/skips, checks, artifact paths, limitations, recommended next slice, and whether the branch is ready for ChatGPT review.
