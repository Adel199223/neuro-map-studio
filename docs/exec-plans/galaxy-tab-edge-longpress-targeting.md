# Galaxy Tab Edge Long-Press Targeting Fix

## Summary

- Fix the tablet bug where long-pressing a relationship line can open the canvas menu instead of the link menu.
- Keep the change limited to edge hit targeting, edge-versus-canvas gesture ownership, duplicate contextmenu suppression, and richer opt-in diagnostics.

## Plan

1. Widen the invisible edge hit target in `public/prototypes/current/mindmap.html` without changing the visible line design.
2. Give edge long-press the same-pointer ownership it needs so the stage does not start a competing canvas long-press for that gesture.
3. Suppress duplicate native `contextmenu` opens that happen right after a custom long-press menu.
4. Increase retained debug history, add privacy-safe edge metadata to the log, and keep copy/clear controls unchanged.
5. Extend Playwright coverage for edge long-press targeting, duplicate menu suppression, and larger diagnostics retention.
