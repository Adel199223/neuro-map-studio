# Recommended Next Slices

These are small, high-leverage directions to consider after the current main branch.

## Compatibility-Guided Modernization

- Stage 5A0: document the NeuroMap and Accessible Reader compatibility audit and shared contract before moving code.
- Stage 5A1: extract pure NeuroMap data, review, and model helpers behind the shared contract.
- Stage 5A2: split `mindmap.html` CSS, JS, and runtime modules after the pure contract helpers exist; do not rewrite the map in React.
- Stage 5A3: add compatibility adapter fixture tests with representative NeuroMap and Accessible Reader data.
- Stage 5A4: only if integration becomes likely, prepare targeted Accessible Reader graph/workspace boundaries while keeping Accessible Reader read-only until explicitly approved.
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
