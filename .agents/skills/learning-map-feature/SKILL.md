---
name: learning-map-feature
description: Use for implementing or debugging the editable learning map, including blocks, ports, connectors, pan/zoom, pages, and persistence.
---

# Learning Map Feature Skill

Use this workflow for learning-map work.

1. Read `AGENTS.md`, `docs/product/interaction-contract.md`, and the relevant part of `public/prototypes/current/mindmap.html`.
2. Reproduce the behavior or bug in the prototype before changing code.
3. For multi-file work, write an ExecPlan in `docs/exec-plans/`.
4. Preserve user-approved behavior unless the task explicitly changes it.
5. Add or update Playwright tests when possible.
6. Verify with `npm run doctor`, then the narrowest useful tests, then broader checks if feasible.

High-risk areas:

- viewport anchoring and zoom drift;
- connector-port geometry;
- localStorage migrations;
- block editing/resizing;
- context menu state;
- import/export schema compatibility.
