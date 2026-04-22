# Node Long-Press Context Menu Polish

## Summary
- Preserve the current drag-capture, edge long-press, and debug-history fixes.
- Harden recent-long-press suppression so native follow-up context menus after a node long-press do not reopen as canvas menus.
- Prevent any `contextmenu` originating inside the open custom menu from being reclassified as canvas.

## Implementation
- Extend the recent-long-press record with mode, item id, edge id, hit kind, and timestamp so suppression can fall back safely when pointer ids differ.
- Add a dedicated `contextmenu` guard on `#contextMenu` that suppresses/logs recent-long-press follow-ups and otherwise always prevents default propagation.
- Keep existing active/recent-drag suppression ahead of recent-long-press suppression.

## Verification
- Add a Playwright regression for node long-press followed by menu `contextmenu`.
- Re-run doctor, typecheck, lint, both builds, E2E, check, and review-package verification before publish.
