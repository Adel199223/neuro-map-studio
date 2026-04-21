# Architecture target

## Current state

The app is currently a working standalone HTML prototype. It is intentionally preserved in `public/prototypes/current/`.

## Target state

A modular TypeScript web app with a local-first workspace model.

```text
Learning source
  ↓
Lesson page generator ──→ Read-aloud layer
  ↓
Seed blocks + glossary
  ↓
Learning map workspace
  ├─ pages
  ├─ blocks
  ├─ connectors
  ├─ view state
  └─ export/import
```

## Proposed module boundaries

### `features/learning-map/model`

Types, validation, migration, import/export, seed data conversion.

### `features/learning-map/viewport`

Pan, zoom, recenter, coordinate conversion, trackpad/pinch behavior.

### `features/learning-map/nodes`

Block rendering, editing, resizing, shapes, colors, importance, content scrollbars.

### `features/learning-map/connectors`

Ports, route calculation, labels, relationship styles, context menu actions.

### `features/learning-map/commands`

Add, delete, duplicate, connect, change ports, change relation, undo/redo.

### `features/read-aloud`

Speech synthesis wrapper, sentence segmentation, active sentence highlighting, controls.

## Storage

Start local-first:

- `localStorage` for backwards-compatible prototype support;
- later migrate to IndexedDB for larger maps;
- always keep JSON export/import.

For tablet input, local-first persistence, and future computer-local sync prep, see `docs/product/tablet-pen-sync-architecture.md`.

## Testing strategy

- Unit test pure geometry and migration functions.
- Playwright test user flows and visual regressions.
- Manual QA for trackpad, pinch, and speech synthesis because browsers differ.
