# ExecPlan: GitHub Pages Live Preview

## Goal

Add a small, safe GitHub Pages live preview for the public Neuro Map Studio repo so visitors can open the current root app and the preserved source-of-truth prototypes from a repository-subpath deployment without changing prototype behavior.

## Current behavior

- The repo is public at `github.com/Adel199223/neuro-map-studio`.
- `public/prototypes/current/mindmap.html` and `public/prototypes/current/lesson.html` remain the source of truth.
- `vite.config.ts` does not currently set a repo-aware Pages base path.
- `src/App.tsx` uses root-relative links such as `/prototypes/current/mindmap.html`, which would break on a GitHub Pages repo URL under `/neuro-map-studio/`.
- There is an existing CI workflow, but no dedicated Pages deployment workflow yet.

## Desired behavior

- Local development still uses `/`.
- GitHub Pages builds use `/neuro-map-studio/` so assets and root-app links work from the repo subpath.
- The root app links correctly to the current prototype pages in both local and Pages builds.
- A GitHub Pages workflow deploys `dist/` using the official GitHub Pages actions.
- The README explains the live preview URL and clarifies that Pages is only a static preview, not the future sync architecture.

## Constraints

- Do not change behavior inside `public/prototypes/current/mindmap.html` or `lesson.html`.
- Keep the existing CI workflow.
- Use GitHub Pages only. Do not add Vercel, Netlify, `.vercel/`, or extra deployment platforms.
- Do not add secrets or environment-variable requirements beyond a simple build-time Pages flag.

## Implementation steps

1. Add this ExecPlan before editing the deployment config.
2. Update `vite.config.ts` so `GITHUB_PAGES=true` switches the Vite `base` to `/neuro-map-studio/`, while all other builds stay on `/`.
3. Update `src/App.tsx` to generate prototype links from `import.meta.env.BASE_URL` and replace the broken local `/docs/` link with the GitHub docs tree URL.
4. Add `.github/workflows/pages.yml` to build with `GITHUB_PAGES=true`, verify the built prototype files and prefixed asset URLs, upload `dist/`, and deploy with GitHub Pages actions.
5. Add a small homepage regression check for the prototype entry links and document the live preview URL plus direct prototype URLs in `README.md`.

## Test plan

- Before and after changes, run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run check`
- Also run a Pages-style build with `GITHUB_PAGES=true npm run build`.
- Confirm:
  - `dist/prototypes/current/mindmap.html` exists
  - `dist/prototypes/current/lesson.html` exists
  - built asset URLs and homepage prototype links use `/neuro-map-studio/`
- After push, inspect the latest Actions runs and the Pages deployment status with `gh run list` and, if needed, `gh run watch`.

## Risks and rollback

- Main risk: breaking local links while fixing GitHub Pages paths.
- Secondary risk: the repo may still need the GitHub Pages setting enabled manually before the workflow can deploy.
- Rollback is simple: revert the Pages-specific config and workflow changes while keeping the prototype files untouched.

## Completion checklist

- `vite.config.ts` uses a dedicated Pages build flag.
- `src/App.tsx` uses base-aware prototype links.
- `.github/workflows/pages.yml` exists and keeps CI separate.
- `README.md` documents the live preview and its limitations.
- Local checks still pass.
- A GitHub Pages deployment run has been pushed, or the exact GitHub Settings step is documented if manual enablement is still required.
