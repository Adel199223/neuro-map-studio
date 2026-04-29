# Stage 5A0 NeuroMap And Accessible Reader Compatibility Audit

## Summary

Stage 5A0 creates a docs-only compatibility blueprint for future NeuroMap modernization and possible Accessible Reader integration. It does not integrate the apps or change product behavior.

The audit is allowed to inspect both repos, but Accessible Reader is read-only. All deliverables live in Neuro Map Studio.

## Branch And Gate

- Neuro Map Studio repo: `/home/fa507/dev/neuro-map-studio-codex`
- Accessible Reader repo: `/home/fa507/dev/accessible_reader`
- Required Neuro branch: `neuro-accessible-reader-compatibility-audit`
- Required base: clean Neuro Map Studio `main` after `git pull --ff-only origin main`
- Required Stage 3B3 gate: `main` must contain `9b51af1 Add relationship insert block between` or equivalent live Stage 3B3 work.

Gate commands:

```bash
cd /home/fa507/dev/neuro-map-studio-codex
git status --short --branch
git branch -vv
git log --oneline --decorate --graph --max-count=60 --all
git rev-parse HEAD
git rev-parse main
git rev-parse origin/main
git merge-base --is-ancestor 9b51af1 main

cd /home/fa507/dev/accessible_reader
git status --short --branch
git branch -vv
git log --oneline --decorate --graph --max-count=40 --all

cd /home/fa507/dev/neuro-map-studio-codex
git switch main
git pull --ff-only origin main
git switch -c neuro-accessible-reader-compatibility-audit
```

If Stage 3B3 is not on Neuro Map Studio `main`, stop and report that Stage 3B3 must be merged first.

## Scope

Create or update docs only:

- `docs/architecture/neuro-accessible-reader-compatibility.md`
- `docs/exec-plans/neuro-accessible-reader-compatibility-audit.md`
- `docs/roadmap/next-slices.md`

Do not edit Accessible Reader.

Do not:

- integrate NeuroMap into Accessible Reader;
- move NeuroMap data into Accessible Reader backend storage;
- create backend endpoints;
- change storage models;
- rewrite NeuroMap in React;
- convert NeuroMap to TypeScript;
- split `mindmap.html`;
- change UI or behavior;
- push, merge, rebase, squash, force-push, or delete branches;
- run `package:review` or `package:verify`.

## Required Audit Content

The architecture doc must include:

- current role comparison between NeuroMap and Accessible Reader;
- size/complexity metrics for the key files in both repos;
- shared integration principle: Accessible Reader remains host, NeuroMap becomes a portable Map Studio surface if integration happens;
- mapping tables for direct, partial, unsafe, NeuroMap-only, and Accessible-Reader-only concepts;
- portable contract proposal covering `NeuroMapSnapshot`, `NeuroMapBlock`, `NeuroMapRelationship`, `NeuroMapDocumentRef`, `NeuroMapReviewCard`, `NeuroMapReviewAttempt`, `NeuroMapLayoutState`, and `NeuroMapImportExportBundle`;
- adapter strategy without implementation;
- modernization sequence through Stage 5A4 and later integration;
- targeted Accessible Reader cleanup recommendations without edits;
- risk register;
- recommendation to proceed next with Stage 5A1 pure model/review extraction.

## Compatibility Decisions

Use these decisions as defaults:

- Preserve NeuroMap block and relationship IDs in the portable contract.
- Keep visual layout, ports, and route style outside graph semantics.
- Treat review attempts as separate from Study scheduling state.
- Map ratings only with explicit provenance: `missed` to `forgot`, `almost` to `hard`, `got-it` to `good`; never infer `easy`.
- Preserve source/document references as optional links. Do not create Accessible Reader `SourceDocument` records automatically.
- Use pure adapters and fixture tests before any host integration or storage writes.

## Artifact Plan

Create:

```text
/home/fa507/Downloads/neuro-accessible-reader-compatibility-audit/
```

If unavailable, use:

```text
/home/fa507/dev/neuro-map-studio-codex/artifacts/neuro-accessible-reader-compatibility-audit/
```

Include:

- `neuro-accessible-reader-compatibility-audit-report.md`
- `neuro-repo-status.txt`
- `accessible-reader-repo-status.txt`
- `neuro-branch-commits.txt`
- `neuro-changed-files.txt`
- `neuro-diff-stat.txt`
- `neuro-accessible-reader-compatibility-audit.patch`
- `file-size-inventory.txt`
- `data-contract-summary.md`
- `integration-risk-register.md`
- `recommended-next-slices.md`
- copied final docs:
  - `docs/architecture/neuro-accessible-reader-compatibility.md`
  - `docs/exec-plans/neuro-accessible-reader-compatibility-audit.md`
  - `docs/roadmap/next-slices.md` if changed

Generate a review artifact ZIP:

```text
/home/fa507/Downloads/neuro-accessible-reader-compatibility-audit-share.zip
```

If `/mnt/c/Users/FA507/Downloads` exists, copy the artifact folder and ZIP there too.

Artifact commands:

```bash
git status --short --branch > <artifact-dir>/neuro-repo-status.txt
cd /home/fa507/dev/accessible_reader && git status --short --branch > <artifact-dir>/accessible-reader-repo-status.txt
cd /home/fa507/dev/neuro-map-studio-codex && git log --oneline --decorate --graph main..HEAD > <artifact-dir>/neuro-branch-commits.txt
git diff --name-status main..HEAD > <artifact-dir>/neuro-changed-files.txt
git diff --stat main..HEAD > <artifact-dir>/neuro-diff-stat.txt
git diff main..HEAD > <artifact-dir>/neuro-accessible-reader-compatibility-audit.patch
```

## Verification

Because this is docs-only, run the full Neuro Map Studio verification set:

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

Expected Playwright shape from inspection:

- 117 e2e test definitions: 107 in `prototype.spec.ts` and 10 in `workspace-core.spec.ts`;
- Chromium and mobile Chrome projects;
- 234 project-runs total;
- 5 conditional project skips expected.

Do not run Accessible Reader build/tests unless there is spare time after the required Neuro checks. If they are run, record exact commands and results, and do not edit Accessible Reader to make anything pass.

## Commit

Commit locally only after checks pass:

```bash
git add docs/architecture/neuro-accessible-reader-compatibility.md docs/exec-plans/neuro-accessible-reader-compatibility-audit.md docs/roadmap/next-slices.md
git commit -m "docs: add NeuroMap Accessible Reader compatibility audit"
```

Do not push or merge.

## Final Handoff Checklist

Report:

- branch name;
- final SHA;
- base SHA;
- whether Stage 3B3 was confirmed on main or still pending;
- changed files;
- Accessible Reader read-only confirmation;
- Accessible Reader git status summary;
- compatibility conclusion;
- proposed shared data contract;
- mapping summary;
- key incompatibilities and risks;
- recommended next code slice;
- whether to modernize NeuroMap first, Accessible Reader first, or both;
- checks run and results;
- Playwright test count and expected skips;
- artifact folder;
- share ZIP path;
- known limitations;
- what could not be tested;
- whether ready for ChatGPT review.
