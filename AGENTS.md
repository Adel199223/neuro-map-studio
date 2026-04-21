# AGENTS.md

## Repository purpose

Build a modular ADHD/dyslexia-friendly learning app from the current standalone HTML prototypes.

## Source-of-truth files

- Current mind-map prototype: `public/prototypes/current/mindmap.html`
- Current lesson prototype: `public/prototypes/current/lesson.html`
- Product requirements: `docs/product/product-requirements.md`
- Interaction rules: `docs/product/interaction-contract.md`
- Learning principles: `docs/product/neuroscience-learning-principles.md`

## Working rules

- Preserve the current user-approved behavior unless the task explicitly asks to change it.
- Prefer small, testable steps over large rewrites.
- Before significant refactors or multi-file features, write or update an ExecPlan using `PLANS.md`.
- Add or update tests for behavior changes, especially pan/zoom, connectors, context menus, persistence, and read-aloud.
- Keep the UI dyslexia/ADHD-friendly: Comic Sans stack, generous spacing, low visual noise, clear labels, focus states, and reduced-motion support.
- Do not add production dependencies without explaining why the dependency is worth it.
- Avoid destructive commands. Do not delete prototypes, exported backups, or user data.

## Verification before completion

Run as much of this as the environment allows:

```bash
npm run doctor
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run check
```

If a command cannot run, explain exactly why and what was checked instead.

When preparing a review bundle for external tools, also run:

```bash
npm run package:review
npm run package:verify
```

## Review guidelines

Treat these as high-priority issues:

- blank canvas on load;
- zoom drift or jumpy trackpad behavior;
- relationship lines not touching connection ports;
- blocks losing content while editing;
- localStorage migrations deleting user maps;
- read-aloud controls blocking content;
- accessibility regressions for keyboard users or screen readers.
