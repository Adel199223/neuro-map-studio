# Tablet, Pen, and Sync Architecture

## Purpose

Prepare the modular app for a future Galaxy Tab plus S Pen workflow and a computer-as-local-server sync model without rewriting the current approved prototypes in this slice.

## Current boundary

- Keep the existing `public/prototypes/current/` files as the behavioral oracle.
- Stay PWA-first rather than native Android-first.
- Do not build the WebSocket sync server yet.
- Preserve current `localStorage` compatibility while the modular app is still forming.

## Input abstraction

Use a Pointer Events-first interaction layer for all future modular map work.

- Normalize `pointerdown`, `pointermove`, `pointerup`, and `pointercancel` across mouse, touch, and pen.
- Keep `pointerType`, `pressure`, `buttons`, and modifier keys available in the event model even if the first implementation uses only a subset.
- Treat hover as optional. Hover-only affordances are acceptable as enhancements for mouse, but must never be required to edit or inspect content.
- Reserve two-finger pan and pinch zoom for viewport control. Avoid gesture designs that assume a keyboard or trackpad is present.

Recommended interaction modes:

- Single-pointer drag moves blocks, resize handles, or connector handles depending on the selected tool and target.
- Two-finger gestures control pan and zoom.
- Long-press opens the same action set as right-click.
- A selected-item toolbar exposes block and edge actions without requiring context menus.
- Canvas-level actions stay reachable through a visible button as well as context menus.

## Tablet UX requirements

- Right-click cannot be the only edit path.
- Minimum touch targets should be about `44x44` CSS px, larger for destructive or high-frequency actions.
- A selected block should expose a visible toolbar for edit, color, shape, connect, duplicate, and delete actions.
- Long-press on canvas, block, and edge should map to the current context-menu vocabulary.
- S Pen workflows should prefer precise drag, resize, and connect gestures, with touch still able to pan and open actions.
- Connection ports should remain usable without hover by supporting explicit connect mode or always-visible-on-selection handles.
- Toolbars, panels, and read-aloud controls must avoid covering the active block or sentence on smaller tablet screens.
- Keyboard access must remain available for desktop users and external-keyboard tablet users.

## Storage abstraction

The modular app should move to a storage adapter instead of coupling state directly to `localStorage`.

Recommended responsibilities:

- load the latest workspace snapshot;
- read and write pending operations;
- persist periodic compacted snapshots;
- preserve JSON import/export;
- bridge legacy `localStorage` payloads during migration.

Storage strategy:

- Keep `localStorage` compatibility for current prototype payloads and recovery paths.
- Use IndexedDB as the primary modular-app store because it scales better for larger workspaces, snapshots, and pending operation queues.
- Store both a compact snapshot and an append-only operation log so offline edits can be replayed.

## Sync abstraction

Keep sync separate from storage and UI so the app can run offline-first.

Recommended layers:

- `WorkspaceStore`: canonical local state plus snapshot persistence.
- `SyncEngine`: queues, replays, acknowledges, and reconciles operations.
- `SyncTransport`: local WebSocket transport when a computer-local server is available, with room for future transports later.

Expected future states:

- offline local-only mode;
- pending-sync mode with locally queued operations;
- live-sync mode when the computer-local server is reachable.

If the computer is offline or unreachable:

- keep accepting local edits;
- append operations to the local pending queue;
- retry sync when the transport is available again;
- avoid blocking editing behind connectivity.

## Operation log shape

Model future synchronization around durable workspace operations rather than raw whole-workspace replacements.

```ts
type WorkspaceOp = {
  opId: string;
  deviceId: string;
  sessionId: string;
  workspaceId: string;
  pageId?: string;
  entityId?: string;
  entityType: 'workspace' | 'page' | 'node' | 'edge' | 'view';
  kind:
    | 'workspace.import'
    | 'page.create'
    | 'page.rename'
    | 'page.delete'
    | 'page.activate'
    | 'node.create'
    | 'node.update'
    | 'node.move'
    | 'node.resize'
    | 'node.delete'
    | 'edge.create'
    | 'edge.update'
    | 'edge.delete'
    | 'view.set';
  baseRevision: number;
  createdAt: string;
  payload: Record<string, unknown>;
};
```

Notes:

- Keep text edits granular inside `node.update` payloads so title/body conflicts can be handled separately from position and shape changes.
- Persist monotonically increasing local revisions and a stable device id.
- Compact old operations into snapshots after acknowledgement so offline queues do not grow forever.

## Conflict strategy

Default strategy: deterministic operation replay with last-writer-wins for structural and view changes, plus conflict-copy handling for divergent text edits.

- Order operations by acknowledged revision when available, otherwise by `createdAt` and `opId`.
- Apply last-writer-wins to fields such as active page, viewport, geometry, ports, relation type, color, shape, and delete/create races.
- When two devices edit the same text field from the same base revision, do not silently discard the losing text.
- Instead, keep the winning value in the main field and preserve the losing value as a conflict copy or manual-review item attached to the node/page metadata.
- Future UI should surface those conflicts as reviewable recoveries rather than invisible data loss.

This keeps sync predictable for structure while protecting the most meaningful learner-authored content.

## Implementation guidance for future slices

- Keep the workspace core pure and command-oriented so operations can be replayed locally or over sync.
- Prefer id-based commands over whole-tree replacement APIs.
- Treat selection state and temporary drag state as ephemeral UI state, not durable sync state.
- Keep JSON import/export as a stable escape hatch even after IndexedDB and sync arrive.
