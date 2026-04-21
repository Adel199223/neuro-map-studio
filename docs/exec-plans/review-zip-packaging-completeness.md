# ExecPlan: Review Zip Packaging Completeness

## Goal

Add a repo-owned review-zip workflow that faithfully exports the repo contract, including required `.agents/skills/*/SKILL.md` files, so a shared review bundle can be extracted and pass `node scripts/doctor.mjs` without ad hoc packaging mistakes.

## Current behavior

- The actual WSL repo already contains `.agents/skills/a11y-learning-review/SKILL.md`, `.agents/skills/learning-map-feature/SKILL.md`, and `.agents/skills/prototype-migration/SKILL.md`.
- `scripts/doctor.mjs` requires those skill files, and `npm run doctor` plus `npm run check` already pass in the real WSL repo.
- The previous external review zip omitted `.agents/`, so the extracted copy failed `node scripts/doctor.mjs` immediately even though the repo itself was healthy.
- There is currently no built-in `package:review` or `package:verify` workflow in `package.json`.

## Desired behavior

- The repo provides a deterministic `package:review` workflow that includes `.agents/`, prototypes, docs, scripts, and core config files while excluding heavy/generated/private paths.
- The repo provides a `package:verify` workflow that extracts the generated zip, runs `node scripts/doctor.mjs`, and explicitly checks the skill files and prototype cross-links.
- Docs tell future Codex runs to use the repo-owned packaging scripts instead of ad hoc zip commands.

## Constraints

- Do not modify the current prototype behavior in `public/prototypes/current/mindmap.html` or `lesson.html`.
- Do not start React migration or sync implementation in this slice.
- Run verification from WSL/Linux paths.
- Avoid new heavy dependencies; rely on the existing WSL `zip` and `unzip` tools with clear preflight checks.

## Implementation steps

1. Add this ExecPlan before editing code or docs.
2. Add shared packaging config under `scripts/` so review packaging and verification use the same include, required-file, and exclusion rules.
3. Add `scripts/create-review-zip.mjs` to build `artifacts/neuro-map-studio-review-context.zip` from an explicit file list that includes `.agents/`.
4. Add `scripts/verify-review-zip.mjs` to extract the zip to a temp directory, run `node scripts/doctor.mjs`, check required skill files and prototypes, and reject excluded paths.
5. Add `package:review` and `package:verify` npm scripts and ignore `artifacts/`.
6. Update `AGENTS.md`, `README.md`, `CODEX_PROMPT.md`, `docs/codex/codex-setup.md`, and `scripts/doctor.mjs` so the repo contract and documentation reflect the new review-zip workflow.

## Test plan

- Run from a WSL repo path such as `~/projects/neuro-map-studio-codex`:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `npm run package:review`
  - `npm run package:verify`
- Confirm the extracted review zip passes `node scripts/doctor.mjs`.
- Confirm the extracted review zip contains all three `.agents/skills/*/SKILL.md` files.
- Confirm the extracted prototypes keep the local `href="lesson.html"` and `href="mindmap.html"` links.
- Confirm excluded directories such as `node_modules/`, `dist/`, and `playwright-report/` do not appear in the archive.

## Risks and rollback

- Main risk: the packaging script could accidentally omit a required contract file or include generated/private data.
- Secondary risk: verification could be too weak and let another incomplete review bundle slip through.
- Rollback is straightforward: remove the new packaging scripts and doc references, then revisit the export workflow with the current repo still intact.

## Completion checklist

- `package:review` and `package:verify` exist in `package.json`.
- `scripts/create-review-zip.mjs`, `scripts/review-package-config.mjs`, and `scripts/verify-review-zip.mjs` exist.
- `artifacts/` is ignored.
- Docs point future work at the repo-owned review-zip workflow.
- `npm run check` passes in WSL.
- `npm run package:review` creates `artifacts/neuro-map-studio-review-context.zip`.
- `npm run package:verify` passes against the generated zip.
