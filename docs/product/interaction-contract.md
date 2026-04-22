# Interaction contract

## Canvas navigation

- Two-finger trackpad scroll should pan the canvas.
- Pinch gestures should zoom, but must not drift horizontally/vertically away from the visual anchor.
- Zoom buttons should anchor around the selected block when possible, otherwise around viewport center.
- Reset view should return to 100% and a usable centered view.
- Recenter should recover from blank/off-screen states.

## Blocks

- Blocks can be moved by drag handle.
- Block title and body are directly editable.
- Blocks can be resized without clipping content.
- Blocks have a subtle vertical scrollbar only when content exceeds height.
- Horizontal scrollbars should not appear inside blocks.
- Connection ports sit outside the block perimeter.
- Round/oval/pill blocks should not cut off text.

## Relationship lines

- Lines are relationships, not arrows. No arrowheads by default.
- Lines connect directly to outside ports.
- Each line can have relation type, label, thickness/strength, route shape, source port, and target port.
- Line routes should avoid giant arcs when blocks are close together.
- Relationship labels should remain readable but small.

## Context menus and tablet-safe alternatives

- Right-click remains available on desktop, but it must not be the only way to edit the map.
- Long-press on canvas, blocks, and relationship labels/lines should open the same editing vocabulary as right-click when the pointer is touch or pen.
- A selected-item toolbar should expose the most common block and link actions without forcing a context-menu open.
- The selected-item toolbar should stay compact, touch-sized, low-noise, and collapsible if it starts blocking the working area.

Right-click empty canvas:

- add free block;
- add linked block from selected block;
- import if available;
- recenter/reset/tidy/export.

Tablet-safe canvas path:

- keep the left toolbar visible for common canvas actions;
- long-press empty canvas for the canvas menu.
- optional input diagnostics may be enabled only for troubleshooting with `?debugInput=1` or the documented localStorage flag, and it must stay off by default.

Right-click block:

- edit;
- add linked block from chosen side;
- duplicate;
- resize/shape/color/importance;
- center on block;
- delete safely.

Tablet-safe block path:

- tap to select the block;
- use the selected-item toolbar for add linked block, edit, duplicate, connect, style, center/focus, and delete;
- long-press the block to open the full block menu.

Right-click line or label:

- change relation type;
- change strength;
- change route;
- change ports;
- rename label;
- reverse;
- delete.

Tablet-safe link path:

- tap the line or label to select the relationship;
- use the selected-item toolbar for label, relation type, thickness, route, port side, reverse, and delete;
- long-press the line or label to open the full link menu.
- relationship hit targets should be generous enough for S Pen and finger, even when the visible line stays thin.
- if a pointer lands on a relationship hit target or label, edge long-press takes priority over canvas long-press for that gesture.
- after a custom long-press opens a menu, the app should suppress the duplicate native `contextmenu` open for the same gesture.
- active drag or resize gestures, and the short recent-drag window just after release, take priority over `contextmenu` on drag handles, resize surfaces, and the captured node-layer/canvas surface.
- gesture lock should suppress accidental text selection during map manipulation, but node title/body text must remain editable and text-selectable once the gesture ends.
- when diagnostics is enabled, only interaction metadata should be logged; relationship text and learner-authored content must stay out of the log.

## Persistence

- Autosave must never erase user content because of a migration bug.
- Import/export should preserve all pages, blocks, edges, view states, and relationship metadata.
- If localStorage has an invalid/blank workspace, the app should restore a safe default and tell the user.

## Read-aloud

- Primary read-aloud controls should be compact and not block learning content.
- Options should stay collapsed by default.
- The current sentence should be highlighted while reading.
- Hover/tap a sentence to start reading there.
