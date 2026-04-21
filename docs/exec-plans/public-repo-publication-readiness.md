# ExecPlan: Public Repo Publication Readiness

## Goal

Prepare Neuro Map Studio for a safe first public GitHub publication by cleaning public-facing metadata, removing user-specific path examples, adding a license, re-running the verification suite, and publishing only if the repo is free of obvious secrets and all checks pass.

## Current behavior

- The repo lives in the WSL filesystem and the current source-of-truth prototypes remain `public/prototypes/current/mindmap.html` and `public/prototypes/current/lesson.html`.
- The verification suite currently passes in WSL: `npm run doctor`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run check`, `npm run package:review`, and `npm run package:verify`.
- `README.md` is still written as a Codex harness readme instead of a public project readme.
- Public docs still contain user-specific path examples that need to be replaced with generic WSL examples such as `~/projects/neuro-map-studio-codex`.
- The repo has no `LICENSE` file yet and is not yet a Git repository.

## Desired behavior

- The repo has a public-facing `README.md`, an MIT `LICENSE`, and generic path examples suitable for public sharing.
- `.gitignore` excludes generated outputs and review artifacts that should not be committed.
- The repo passes the full verification suite from a WSL shell before publication.
- No obvious secrets, private local material, or user-specific path leaks remain in public-facing docs.
- A public GitHub repository named `neuro-map-studio` is created and pushed only if the safety audit stays clean.

## Constraints

- Do not change behavior in `public/prototypes/current/mindmap.html` or `public/prototypes/current/lesson.html`.
- Keep `"private": true` in `package.json`.
- Keep `docs/project-instructions/` public unless the audit finds a privacy problem.
- Do not publish if any required verification step fails or if sensitive material is found.
- Work from WSL paths, for example `~/projects/neuro-map-studio-codex`, not from `/mnt/c/...` or a PowerShell UNC cwd.

## Implementation steps

1. Add this ExecPlan and then update `README.md`, `.gitignore`, and public-facing docs to remove user-specific path examples and present the repo as a public project.
2. Add an MIT `LICENSE` and keep `package.json` private for npm-safety.
3. Re-run prototype marker checks, the full verification suite, and secret/path scans from a WSL shell.
4. If the audit is clean, initialize Git, inspect staged content carefully, and commit as `Initial public prototype harness`.
5. Confirm GitHub CLI authentication, ensure the target `neuro-map-studio` repo name does not already exist under the authenticated account, then create and push the public repo.

## Test plan

- Confirm the source-of-truth prototypes still contain the expected local cross-links and current workspace key marker.
- Re-run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `npm run package:review`
  - `npm run package:verify`
- Search for secrets, `.env` files, private keys, tokens, personal contact data, and hard-coded local paths.
- Verify `.gitignore` excludes `.env`, `.env.*`, `node_modules/`, `dist/`, `build/`, `coverage/`, `test-results/`, `playwright-report/`, `.vite/`, and `artifacts/`.
- After push, confirm `git status` is clean and capture the GitHub URL.

## Risks and rollback

- Main risk: publishing a repo that still contains user-specific or private material.
- Secondary risk: pushing a repo name that already exists or staging unwanted generated files.
- Rollback is straightforward before publication: stop, unstage, and fix the audit findings before any push.

## Completion checklist

- `LICENSE` exists with MIT text.
- `README.md` is public-facing and uses generic example paths.
- Public docs no longer expose user-specific local filesystem paths.
- `.gitignore` covers the expected generated output directories.
- Full WSL verification passes.
- Secret/path scan is clean.
- The public GitHub repo is created and pushed, or publication is halted with a clear reason.
