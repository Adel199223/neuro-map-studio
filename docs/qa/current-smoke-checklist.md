# Current Smoke Checklist

Use this for quick validation on local dev or GitHub Pages.

## Workspace Dashboard

- [ ] Root dashboard loads.
- [ ] Workspace review summary shows Review next, weak, recent, and not-reviewed map states when review data exists.
- [ ] Recent pages/diagrams section appears.
- [ ] Project cards are visible.
- [ ] New map, New page, and New project are reachable.
- [ ] Backup/restore panel opens.

## Project Hub

- [ ] Geopolitics & Economics project opens.
- [ ] Pages view loads by default.
- [ ] Documents view loads and shows project sources.
- [ ] Utilities view opens.
- [ ] Page cards have real runtime links.
- [ ] Project Review section shows map card counts, reviewed counts, weak counts, priority counts, and last reviewed state.
- [ ] Review next opens a priority review session ordered by Missed, Almost, then new cards.
- [ ] Review map opens the map review launcher.
- [ ] Review weak cards opens weak-card review when weak cards exist, or stays disabled with a friendly state when none exist.

## Pages

- [ ] Create a generic notes page.
- [ ] New page opens through `page.html?pageId=<id>`.
- [ ] Lesson runtime opens.
- [ ] Glossary/review/notes starters remain usable.

## Map Editor

- [ ] Create/open a map page.
- [ ] Sources & blocks panel opens and closes.
- [ ] Concept placement mode starts and can be canceled.
- [ ] Question and Evidence blocks can be placed.
- [ ] A project source can be added as a document block.
- [ ] Document block shows title/type, can be dragged, can be linked, and persists after reload.
- [ ] A connection-port menu can Connect existing block, creates one undoable relationship line, and prevents self-links or duplicate same-direction links.
- [ ] Selecting a relationship line shows Change source and Change target.
- [ ] Change source / Change target can reconnect a relationship, preserve its label/type/style, and undo/redo cleanly.
- [ ] Reconnect prevents self-links and duplicate same-direction relationships.
- [ ] Selecting a relationship line shows Insert block between.
- [ ] Insert block between can create a Concept / Question / Evidence block near the line midpoint and split one relationship into two.
- [ ] Insert block between can create a Document block through the document picker and preserve `documentId`.
- [ ] Undo restores the original relationship and removes the inserted block; redo restores the inserted block and split relationships.
- [ ] Selection toolbar remains usable.
- [ ] Notification bubbles appear briefly and do not stretch layout.
- [ ] Zoom controls remain usable.
- [ ] Review this map still opens normal review with card-type filters.
- [ ] Review next uses latest Missed/Almost ratings plus new cards, excluding current Got it cards.
- [ ] Review weak cards uses latest Missed/Almost ratings and excludes cards later rated Got it.
- [ ] Answers remain masked on the map before Reveal for block, relationship, connected-block, and source/evidence cards.

## Backup

- [ ] Export workspace backup downloads JSON.
- [ ] Import valid backup merges data.
- [ ] Import invalid JSON is rejected and existing data remains.

## Live Smoke

- [ ] GitHub Pages root returns HTTP 200.
- [ ] Project, page, lesson, map, and debug URLs return HTTP 200.
- [ ] `?debugInput=1` opens diagnostics on the map runtime.

## Focused Playwright Runs

- Run focused Playwright invocations sequentially. For repeat flake evidence, prefer `--workers=1` and avoid parallel independent commands against the same Vite dev-server port.
