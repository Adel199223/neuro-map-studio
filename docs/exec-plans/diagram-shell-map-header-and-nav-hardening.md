# Diagram Shell Map Header And Nav Hardening

## Goal

Harden the remaining responsive layout contract bugs in the diagram workspace shell without adding product features or changing data/runtime behavior.

## Current Bugs

- The map header can collapse into a narrow column at medium and narrow widths because the topbar uses four columns while the map view controls keep a large minimum width. The title/context column is allowed to shrink until long metadata wraps awkwardly.
- Root dashboard panels still leave more empty vertical space than needed, which pushes Recent pages/diagrams lower than ideal.
- Developer tools still appear as a normal rail utility instead of a secondary/advanced tool.
- Sidebar labels such as "Workspace home" can wrap awkwardly when rails compress.
- If the map header wraps badly, it steals vertical space from the canvas, making the diagram feel secondary.

## Target Responsive Behavior

- Wide desktop: map nav, title/context, map view controls, and save status share one compact row.
- Medium desktop/window and tablet landscape: map title/context own the first row while navigation and map view controls wrap to a clean second row.
- Tablet portrait/narrow: long project metadata is truncated or hidden as secondary context, title remains readable, controls remain reachable, and the canvas keeps usable height.
- Root dashboard: Continue, Quick create, and Recent pages/diagrams appear early with no oversized empty panels.
- Project hub: rail labels stay readable, tabs wrap cleanly, and page/document cards do not create horizontal overflow.

## Implementation Plan

- Replace the map header's squeeze-prone implicit grid with named grid areas and earlier breakpoints.
- Use nowrap, ellipsis, and title attributes for map context metadata rather than permissive word breaking.
- Shorten visible map context text while retaining the full breadcrumb in the `title` attribute.
- Demote Developer tools behind Help/advanced access and only show the rail shortcut with `?dev=1` or `?debug=1`.
- Shorten project rail "Workspace home" to "Workspace" and add nowrap/ellipsis guardrails to rail labels.
- Reduce root card padding/gaps and creation tile height enough to bring recent objects higher without changing the app-shell concept.

## Tests

- Add map header medium and narrow viewport tests that assert readable title/context boxes, reachable controls, usable canvas height, and no horizontal overflow.
- Add root Developer tools demotion coverage.
- Tighten root medium layout assertions so Recent pages/diagrams is visible earlier.
- Add project/nav label responsive assertions.
- Keep the existing dynamic runtime, backup/import/export, guided starter, document block, and map interaction tests passing.

## Risks

- Over-truncating map context could hide useful project identity, so full context remains available through title text and project/back links.
- Header changes could affect fresh-map canvas geometry, so fresh map viewport tests must remain in the full suite.
- Developer tools must stay available for diagnostics, just not as a primary user navigation item.
