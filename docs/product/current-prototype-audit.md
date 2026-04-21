# Current prototype audit

Current version included in this repo: v20 clean connectors.

## What is working well

- The user-approved mental model is represented as editable blocks.
- The map has meaningful relationship types and visual coding.
- Link connection ports exist outside blocks.
- Context menus support common editing actions.
- Multi-page workspace exists.
- Read-aloud layer exists on the lesson page.

## High-leverage next improvements

1. Modularize without changing behavior.
2. Add undo/redo for block/link operations.
3. Improve connector routing with simple obstacle avoidance.
4. Add a command palette for keyboard use.
5. Add regression tests for blank-canvas recovery and connector geometry.
6. Add a reusable importer to generate seed maps from lesson blocks.

## Known caution points

- The standalone prototype has tightly coupled CSS/DOM/state logic.
- localStorage migrations must be handled carefully.
- Pan/zoom interactions are sensitive to trackpad behavior.
- Connection geometry should be tested visually and interactively.
