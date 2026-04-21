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

## Context menus

Right-click empty canvas:

- add free block;
- add linked block from selected block;
- paste/import if available;
- recenter/reset/tidy/export.

Right-click block:

- edit;
- add linked block from chosen side;
- duplicate;
- resize/shape/color/importance;
- center on block;
- delete safely.

Right-click line or label:

- change relation type;
- change strength;
- change route;
- change ports;
- rename label;
- reverse;
- delete.

## Persistence

- Autosave must never erase user content because of a migration bug.
- Import/export should preserve all pages, blocks, edges, view states, and relationship metadata.
- If localStorage has an invalid/blank workspace, the app should restore a safe default and tell the user.

## Read-aloud

- Primary read-aloud controls should be compact and not block learning content.
- Options should stay collapsed by default.
- The current sentence should be highlighted while reading.
- Hover/tap a sentence to start reading there.
