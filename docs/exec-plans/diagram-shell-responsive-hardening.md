# Diagram Shell Responsive Hardening

## Goal
Fix the responsive layout regression in the diagram-workspace shell without adding new product features. The root dashboard, project hub, and fresh map runtime should keep the diagram-first app feel while remaining readable across desktop, medium tablet/window, and narrow widths.

## Current Bug
- At medium widths the root dashboard can squeeze the "Continue working" card until normal words wrap one letter per line.
- The likely causes are the fixed 214px rail, the root two-column board staying active too long, the `continue-layout` text/actions split using an `auto` action column, and broad `overflow-wrap: anywhere` on headings and paragraphs.
- The fresh map runtime can start with the default "Main idea" block too close to overlays, making new maps feel partially hidden.

## Target Layout
- Wide desktop: keep left rail, compact topbar, two-column Continue/Quick create board, Recent pages/diagrams, and Projects visible early.
- Medium window/tablet: keep the app shell, but stack Continue and Quick create before text is squeezed. Continue actions wrap below the project summary.
- Narrow/tablet portrait: collapse the rail into a top navigation area, stack cards in one column, keep buttons reachable, and prevent horizontal overflow.
- Project hub follows the same breakpoints: page/document cards keep readable minimum widths, tabs wrap, and dialogs fit within the viewport.
- Map runtime remains canvas-first. Only the fresh one-block map startup view is adjusted; seeded maps and saved user views are preserved.

## Implementation Scope
- Add robust wrapping and sizing rules in `src/styles/global.css`: remove one-character wrapping, add `min-width: 0`, earlier stacking, safer grid minimums, and compact medium/narrow rail behavior.
- Mirror the same responsive safety rules inside `public/prototypes/current/project.html`.
- Add a fresh-map-only startup helper in `public/prototypes/current/mindmap.html` that positions the initial node clear of the left toolbar, top chrome, starter panel, selection shelf, and zoom dock.
- Update `tests/e2e/prototype.spec.ts` with medium, narrow, wide, project-card, and fresh-map viewport tests.

## Out Of Scope
- No IndexedDB schema change.
- No new backup, import, document parsing, sync, cloud, PWA, or native work.
- No map canvas redesign and no changes to manual pan/zoom semantics.
- No push, merge, zip, package:review, or package:verify.

## Test Strategy
- Root medium viewport: assert Continue working title/card width is readable, Quick create is visible, and no horizontal overflow exists.
- Root narrow viewport: assert rail/top navigation does not crush content and cards stack cleanly.
- Root wide viewport: assert the object board remains visible early.
- Project medium viewport: assert page cards/tabs are readable with real links and no horizontal overflow.
- Fresh map viewport: create a new map, assert the "Main idea" node is fully visible and not under the toolbar or starter panel.
- Run the full non-packaging check set after changes.

## Risks
- Over-collapsing the rail could make the workspace feel less app-like on tablets, so the medium breakpoint should preserve identity while protecting content width.
- Fresh-map viewport logic must avoid overwriting saved user views; it should run only for new one-block maps with a default view.
- Responsive tests should validate geometry without becoming brittle about exact pixel styling.
