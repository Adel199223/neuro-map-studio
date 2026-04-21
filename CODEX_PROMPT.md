# Starter prompt for Codex

Paste this into Codex from the repository root.

```text
Goal: Continue developing Neuro Map Studio from the current user-approved prototypes into a modular, testable web app.

Context to inspect first:
- AGENTS.md
- README.md
- CODEX_PROMPT.md
- PLANS.md
- docs/product/product-requirements.md
- docs/product/interaction-contract.md
- docs/product/neuroscience-learning-principles.md
- docs/product/tablet-pen-sync-architecture.md
- public/prototypes/current/mindmap.html
- public/prototypes/current/lesson.html
- tests/e2e/prototype.spec.ts

Important constraints:
- The current prototype behavior is the source of truth unless the requested task explicitly changes it.
- Keep the UI ADHD/dyslexia-friendly: Comic Sans stack, generous spacing, low visual noise, clear controls, sentence/semantic highlighting, and keyboard-accessible interactions.
- Use small, testable steps. Do not do a huge rewrite in one pass.
- Before a substantial refactor, create an ExecPlan in docs/exec-plans/ using PLANS.md.
- Preserve localStorage/export compatibility or add a migration with tests.
- Do not delete current prototypes.
- For architecture-affecting work, read `docs/product/tablet-pen-sync-architecture.md` before planning or coding.

First task:
1. Audit the current advanced learning map prototype.
2. Identify the highest-leverage next implementation step for turning it into modular code.
3. Write an ExecPlan for that step.
4. Ask me to approve the plan before coding, unless the change is only a small test or documentation update.

Done when:
- You have read the listed files.
- You have written a concrete ExecPlan with implementation and test steps.
- You have not changed production behavior yet unless the change is obviously safe and small.
```

## Prompt for a specific bug fix

```text
Fix this specific issue in the learning map: <describe issue>. Start by reproducing it against public/prototypes/current/mindmap.html. Then make the smallest safe change, add or update a Playwright regression test if feasible, and run npm run doctor plus the most relevant tests. Preserve user-approved behavior outside this issue.
```
