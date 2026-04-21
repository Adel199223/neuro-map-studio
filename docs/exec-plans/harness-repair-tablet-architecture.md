# ExecPlan: Harness Repair And Tablet-Ready Architecture Prep

## Goal

Repair the repo harness so verification is truthful, the durable files the harness promises are actually checked, and the architecture is prepared for a future Galaxy Tab/S Pen plus computer-as-local-server workflow without changing the current approved prototypes.

## Current behavior

- `public/prototypes/current/mindmap.html` is the v20 clean-connectors learning-map prototype and links locally to `lesson.html`.
- `public/prototypes/current/lesson.html` links locally back to `mindmap.html`.
- `CODEX_PROMPT.md` already exists at the repo root.
- `.agents/skills/a11y-learning-review/SKILL.md`, `.agents/skills/learning-map-feature/SKILL.md`, and `.agents/skills/prototype-migration/SKILL.md` already exist.
- In WSL, `npm install --ignore-scripts --dry-run`, `npm run doctor`, `npm run typecheck`, `npm run lint`, and `npm run test:e2e` pass, while `npm run build` fails.
- `npm run typecheck` currently uses `tsc --noEmit`, so it misses Node-side/config-project errors that `npm run build` catches.
- Running `npm` from PowerShell while the cwd is `\\wsl.localhost\...` produces false failures because the process falls back out of the repo.

## Desired behavior

- `npm run typecheck` checks the same TypeScript project graph that `npm run build` relies on.
- `npm run check` cannot miss build-time TypeScript failures.
- `scripts/doctor.mjs` verifies the durable harness contract instead of checking only a small subset of files.
- The repo docs truthfully describe how to run setup and verification in a WSL-hosted workspace.
- The repo includes a durable architecture note for future tablet, pen, local-first storage, and computer-local sync work.

## Constraints

- Do not modify the current prototype behavior in `public/prototypes/current/mindmap.html` or `lesson.html`.
- Do not start the full React migration in this slice.
- Do not build the future sync server yet.
- Do not weaken strict TypeScript checking to get the build green.
- Keep Playwright browser availability as an environment prerequisite rather than hiding it behind a silent skip.

## Implementation steps

1. Add a new Node-side TypeScript project config, update the root references, and move config-file typechecking out of the app tsconfig.
2. Update `package.json` so `typecheck` uses build mode and `check` runs `doctor`, `lint`, `build`, and `test:e2e` in strict order.
3. Fix the current strict TypeScript failures in `src/features/learning-map/` and `tests/e2e/workspace-core.spec.ts` without changing prototype behavior.
4. Expand `scripts/doctor.mjs` to verify durable docs, skill files, source-of-truth paths, prototype link/version invariants, and the script contract.
5. Add `docs/product/tablet-pen-sync-architecture.md` and link it from the existing architecture/setup documentation.
6. Re-run `npm run doctor`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` from a WSL repo path such as `~/projects/neuro-map-studio-codex`.

## Test plan

- Confirm `npm run typecheck` now fails on the same TypeScript graph issues that would have broken `npm run build`.
- Confirm `npm run build` passes after the strict typing fixes.
- Confirm `npm run doctor` fails if the new durable-file or script-contract expectations drift.
- Confirm `npm run test:e2e` still passes when Playwright browsers are available.
- Confirm no prototype HTML files were modified.

## Risks and rollback

- Main risk: accidentally broadening or narrowing the learning-map compatibility layer in a way that changes import/autosave behavior.
- Secondary risk: making doctor so brittle that harmless wording changes break it.
- Rollback is straightforward: revert the harness/config/doc changes and keep the prototypes as the source of truth while reworking the harness slice.

## Completion checklist

- `docs/product/tablet-pen-sync-architecture.md` exists and is linked from the main docs.
- `scripts/doctor.mjs` checks the durable harness contract.
- `npm run typecheck` uses build mode.
- `npm run check` includes `npm run build`.
- `npm run doctor` passes in WSL.
- `npm run typecheck` passes in WSL.
- `npm run lint` passes in WSL.
- `npm run build` passes in WSL.
- `npm run test:e2e` passes in WSL when Playwright browsers are available.
