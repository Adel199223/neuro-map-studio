# ExecPlan: Pages Enablement And Review-Package Completeness

## Goal

Enable GitHub Pages for the public Neuro Map Studio repo, rerun the existing Pages workflow successfully, and tighten the review-package contract so external review bundles always include the public-license and deployment-critical files.

## Current behavior

- `.github/workflows/pages.yml` exists and uses the official Pages actions.
- The previous Pages run failed during `actions/configure-pages@v5` because the repo-level Pages site was not enabled yet and the Pages API returned `404`.
- The public Pages URLs currently return `404` until Pages is enabled and a deployment completes.
- The review zip workflow includes the Pages workflow and current app files, but it does not yet guarantee `LICENSE`.
- `scripts/doctor.mjs` does not yet strongly assert the license, Pages workflow, Vite Pages base setting, or the README live preview URLs.

## Desired behavior

- GitHub Pages is enabled for workflow-based builds on the public repo.
- The Pages workflow can build and deploy the current static preview successfully.
- The live preview root and both direct prototype URLs respond successfully instead of `404`.
- Review zips always include `LICENSE`, `.github/workflows/pages.yml`, `vite.config.ts`, the current prototypes, and the required `.agents` skill files.
- `scripts/doctor.mjs` fails quickly if the public deployment metadata or review-package contract drifts.

## Constraints

- Do not change behavior inside `public/prototypes/current/mindmap.html` or `lesson.html`.
- Keep the current Pages workflow model and Vite base-path model intact.
- Do not add Vercel, Netlify, or any non-GitHub deployment platform.
- If the GitHub Pages setting cannot be enabled via CLI/API, stop guessing and report the exact manual UI path instead.

## Implementation steps

1. Add this ExecPlan before changing the repo-side package checks.
2. Reconfirm the latest failed Pages log and current Pages API state, then attempt a single `gh api -X POST repos/Adel199223/neuro-map-studio/pages -f build_type=workflow` enablement call.
3. Strengthen `scripts/review-package-config.mjs` so `LICENSE`, `.github/workflows/pages.yml`, and `vite.config.ts` are treated as required review-bundle files.
4. Strengthen `scripts/doctor.mjs` so it requires the MIT license, the Pages workflow, the Pages Vite base markers, and the README live preview URLs.
5. Re-run local verification, regenerate and verify the review zip, then trigger a fresh Pages workflow and validate the deployed URLs once the workflow succeeds.

## Test plan

- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `npm run package:review`
  - `npm run package:verify`
- Confirm the regenerated review zip contains:
  - `LICENSE`
  - `.github/workflows/pages.yml`
  - `vite.config.ts`
  - `public/prototypes/current/mindmap.html`
  - `public/prototypes/current/lesson.html`
  - `.agents/skills/*/SKILL.md`
- After rerunning the Pages workflow, verify:
  - `https://Adel199223.github.io/neuro-map-studio/`
  - `https://Adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html`
  - `https://Adel199223.github.io/neuro-map-studio/prototypes/current/lesson.html`

## Risks and rollback

- Main risk: tightening `doctor` or the review-package contract too loosely or too strictly.
- Secondary risk: Pages deployment may still need a short propagation window after a successful workflow.
- Rollback is straightforward: revert the package-contract changes while keeping the prototypes and Pages workflow shape intact.

## Completion checklist

- GitHub Pages is enabled for workflow builds.
- The Pages workflow succeeds.
- The live preview root and both prototype URLs respond successfully.
- `LICENSE` is included in the review zip.
- `npm run package:verify` passes with the stronger contract.
- Prototype behavior remains unchanged.
