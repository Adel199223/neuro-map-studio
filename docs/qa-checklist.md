# QA checklist

## Map load

- [ ] Page opens with article-specific blocks visible.
- [ ] Recenter restores visible blocks.
- [ ] Reset view returns to 100% without losing selection.
- [ ] Bad saved state does not create a blank canvas.

## Pan/zoom

- [ ] Two-finger scroll pans.
- [ ] Pinch zooms smoothly.
- [ ] Zoom buttons do not drift horizontally.
- [ ] Text remains readable at 50%, 100%, 185%, and 260%.

## Blocks

- [ ] Blocks drag smoothly.
- [ ] Title/body editing saves.
- [ ] Resize handles do not overlap connection ports.
- [ ] Round/oval blocks do not cut off words.
- [ ] Only subtle vertical scrollbars appear when needed.

## Connectors

- [ ] Lines touch outside ports.
- [ ] No arrowheads unless intentionally added later.
- [ ] Close blocks do not create giant curves.
- [ ] Context menu can change ports, relation, label, strength, and route.

## Pages and persistence

- [ ] Create page.
- [ ] Rename page.
- [ ] Duplicate page.
- [ ] Delete page safely.
- [ ] Export/import preserves all pages.
- [ ] localStorage migration does not erase content.

## Read aloud

- [ ] Hover/tap starts from a sentence.
- [ ] Active sentence highlights.
- [ ] Toolbar stays compact.
- [ ] Options are collapsed by default.
- [ ] Auto-scroll and focus lens work.
