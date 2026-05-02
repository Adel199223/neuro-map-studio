# Stage 5A9 Mindmap Runtime Menu Helper Split

## Summary

Stage 5A9 extracts pure menu/context-menu descriptor helpers from the browser map runtime into `public/prototypes/current/mindmapMenuHelpers.js`.

This is a behavior-preserving refactor. `mindmap.js` remains the only browser entrypoint and continues to own menu DOM rendering, positioning, event dispatch, long-press/contextmenu handling, pointer and S Pen flows, runtime action execution, render/save/history calls, document picker opening, and notification bubbles.

## Implementation

- Add a lint-clean plain JavaScript module for menu descriptor builders:
  - port quick-add and Insert block between item descriptors
  - block, relationship, canvas, and page menu descriptor builders
  - menu row builders for colors, shapes, sizes, importance, relationship types, strengths, route/shape options, port sides, and linked-block directions
  - small title/item/section helpers used by the descriptor builders
- Update `mindmap.js` wrappers to call the descriptor helpers while preserving existing labels, action IDs, titles, aria labels, disabled states, and danger states.
- Update doctor and static runtime extraction tests so the new helper file is required, imported by `mindmap.js`, and present in GitHub Pages builds.

## Boundaries

- Do not move `showMenu`, `closeMenu`, menu button creation, menu click dispatch, menu positioning, contextmenu listeners, long-press suppression, pointer targeting, prompts, document picker behavior, relationship action execution, render/save/history calls, or S Pen/touch gesture state.
- Do not wire Stage 5A1/5A3 TypeScript helpers into the browser runtime.
- Do not change menu behavior, routes, storage keys, backup/import behavior, UI, GitHub Pages deployment, or Accessible Reader.

## Verification

- Add pure Playwright-runner coverage for the menu helper module.
- Run the menu/relationship-focused prototype subset for context menus, long-press menus, port quick-add, Connect existing, relationship actions, Insert block between, and selected link toolbar behavior.
- Run the full normal verification suite before committing.
