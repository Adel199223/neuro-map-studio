# Codex setup notes

## Why this repo includes AGENTS.md

Codex reads repository instructions from `AGENTS.md`. Keep it short, concrete, and focused on durable rules.

## Why this repo includes PLANS.md

For complex features, Codex should write an execution plan before coding. This is especially important here because interaction bugs can appear in pan/zoom, connection geometry, localStorage migrations, and read-aloud behavior.

## Why this repo includes skills

The `.agents/skills/` folder contains reusable workflows for this app:

- `learning-map-feature`
- `a11y-learning-review`
- `prototype-migration`

Codex can use these as recurring task recipes when working in the repo.

## Recommended prompt structure

Use four parts:

1. Goal
2. Context files
3. Constraints
4. Done when

See `CODEX_PROMPT.md` for starter prompts.

## Review bundle workflow

When preparing a repo snapshot for external review, use:

```bash
npm run package:review
npm run package:verify
```

Run those commands from WSL in the repo root. Do not rely on ad hoc zip commands or shell globs for review bundles, because they can omit dot-directories such as `.agents/` and produce a package that fails `node scripts/doctor.mjs` after extraction.

## WSL placement advice

If Codex, Node, npm, Git, and Playwright run in WSL, keep this repo in the Linux filesystem, for example:

```bash
~/projects/neuro-map-studio-codex
```

Do not actively develop from:

```bash
/mnt/c/Users/<you>/...
```

unless your tools are Windows-native. Keep code in the same filesystem as the tools that operate on it.

Also avoid running `npm` from PowerShell when the current directory is a UNC WSL path such as `\\wsl.localhost\Ubuntu\home\...`. In that setup, Windows `cmd.exe` can fall back out of the repo and make `npm run doctor`, `npm run lint`, or `npm run build` fail for environment reasons instead of real repo problems.
