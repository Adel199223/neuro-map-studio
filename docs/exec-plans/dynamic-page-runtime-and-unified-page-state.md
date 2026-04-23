# Dynamic Page Runtime And Unified Page State

## Goals

- Make project pages first-class runtime entities keyed by `pageId`.
- Add a generic page runtime entry that can open lesson, map, notes, review, and glossary pages from workspace data.
- Move map persistence under the workspace/page model without breaking the current map interactions.
- Keep the Simon Dixon lesson/map as seeded example pages inside the project rather than app-wide special screens.

## Scope

- Add `page.html?pageId=<id>` as the generic runtime dispatcher.
- Extend `workspace-store.js` with `pageStates` and page-type runtime helpers.
- Keep `lesson.html` and `mindmap.html` as compatibility entry points that load seeded `pageId` values by default.
- Make project page creation produce real runtime pages with initial state.
- Show related project documents on runtime pages without duplicating document records.

## Out Of Scope

- Sync, cloud, server, PWA install, or React migration.
- Binary file upload, PDF/DOCX parsing, or document rendering.
- Full lesson-builder richness for new lesson pages.
- Removing the current map engine or rewriting its interaction model.

## Current Architectural Gap

- IndexedDB already stores projects, documents, pages, and page-document links.
- Runtime still splits between:
  - a hardcoded seeded lesson page,
  - a map prototype with its own localStorage workspace,
  - metadata-only created pages that do not open as real pages.

## Target Runtime Model

- `pages` stays metadata.
- `pageStates` becomes runtime state keyed by `pageId`.
- `page.html` resolves page metadata and either:
  - renders a real runtime page for lesson/notes/review/glossary, or
  - dispatches into `mindmap.html?pageId=<id>` for map pages.
- Map pages keep the old internal graph workspace format behind an adapter, but that payload is saved per project `pageId`.

## Migration Strategy

- Bump IndexedDB version and add `pageStates`.
- Backfill missing `pageStates` for existing pages.
- Normalize older created page routes to `page.html`.
- Keep legacy map localStorage keys readable as a fallback and migrate seeded map data into page-owned state non-destructively.
- Keep direct `lesson.html` and `mindmap.html` URLs working by defaulting to the seeded lesson/map IDs.

## Test Strategy

- Update Playwright tests to cover real runtime page creation and persistence.
- Verify seeded lesson/map pages open via `page.html?pageId=...` and compatibility URLs.
- Verify map state isolation by `pageId`.
- Keep the current lesson/map regressions passing, especially read-aloud, glossary, pan/zoom, shelf dismissal, edge anchoring, drag capture, long-press, and right-click behavior.

## Risks

- The map engine still contains an older multi-view workspace model internally; the adapter must avoid weakening current interactions.
- Existing browsers may have IndexedDB blocked, so lesson/map compatibility fallbacks must remain safe.
- Route normalization for existing pages must not strand old metadata-only pages.
