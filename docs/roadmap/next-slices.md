# Recommended Next Slices

These are small, high-leverage directions to consider after the current main branch.

## Compatibility-Guided Modernization

- Stage 5A0: compatibility audit and shared contract are on main.
- Stage 5A1: extract pure NeuroMap contract, data/model, review, and preview adapter helpers behind the shared contract with fixture coverage; keep runtime behavior unchanged.
- Stage 5A2: externalize the `mindmap.html` stylesheet and existing browser runtime into `mindmap.css` and `mindmap.js`; keep routes, behavior, storage, and GitHub Pages deployment unchanged.
- Stage 5A3: add runtime-to-portable snapshot parity fixtures for saved map page-state and backup-like data; keep helpers pure and leave `mindmap.js` unwired.
- Stage 5A4: split only low-risk `mindmap.js` constants, string/DOM-target utilities, and geometry helpers into sibling modules while keeping `mindmap.js` as the browser entrypoint and preserving behavior.
- Later modernization: continue splitting `mindmap.js` one subsystem at a time, such as review, storage/autosave, gestures, rendering, or placement; do not rewrite the map in React.
- Stage 5A5 or later: only if integration becomes likely, prepare targeted Accessible Reader graph/workspace boundaries while keeping Accessible Reader read-only until explicitly approved.
- Later only: actual integration, host UI decisions, backend persistence, and migration planning.

## Source And Document Workflow

- Make source/document metadata easier to review while mapping.
- Improve document block affordances without adding PDF/DOCX parsing.
- Add clearer page-document reference management.

## Review And Retrieval Pages

- Add spaced-repetition scheduling only after the local weak-card queue, Review next priority flow, and dashboard summaries have settled.
- Keep any review dashboard expansion local-first and avoid due-date scheduling unless it is explicitly approved.
- Keep review surfaces short and focused for recall practice.
- Keep forms short and ADHD-friendly.

## Relationship Editing

- Polish relationship label editing and port-side controls.
- Harden endpoint reconnect and Insert block between after real tablet use, then consider freeform endpoint dragging only if it stays low-risk.
- Consider a hover-only midpoint affordance only after the explicit Insert block between action stays stable.
- Make link meaning easier to scan without adding visual clutter.
- Preserve generous S Pen/finger hit targets.

## Backup Safety

- Improve restore/replace wording and confirmation.
- Keep merge import safe.
- Consider a clearer backup preview before import.

## Large Map Performance

- Measure interaction performance on larger maps.
- Identify bottlenecks before refactoring the canvas.
- Keep tablet testing in the loop.

## Future Operation Log

- Design operation-log architecture separately from UI polish.
- Do not start cloud sync until local-first behavior and backup safety are stable.
