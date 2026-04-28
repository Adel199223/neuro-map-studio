# ExecPlan: Project Review Dashboard

## Goal

Add lightweight review dashboards outside the map editor so learners can see which maps are worth reviewing next and jump directly into normal or weak-card review.

## Desired behavior

- The project hub shows a compact Review section for map pages in the project.
- Each map review row shows total cards, reviewed cards, weak cards, and last reviewed status.
- `Review map` opens the map review launcher.
- `Review weak cards` opens weak-card review when weak cards exist; otherwise the project hub shows a friendly no-weak-cards state.
- The root workspace dashboard shows a small review summary with weak maps first, recently reviewed maps, and maps not reviewed yet.
- Review summaries are derived from existing map page state and review attempts.

## Constraints

- Do not add spaced-repetition scheduling, due dates, intervals, SM-2, reminders, AI generation, cloud sync, accounts, collaboration, or relationship endpoint editing.
- Do not add a new IndexedDB store or bump the database version.
- Keep `data.review.version = 1`; weak status remains derived from latest attempts.
- Preserve Stage 4A1/4A2 map review behavior, answer masking, filters, persistence, backup/import/export, undo/history safety, and editor interactions.

## Implementation steps

1. Add shared pure helpers for default map access and review summaries in `public/prototypes/current/`.
2. Add safe review deep-link handling in the map editor for `review=1`, `review=normal`, and `review=weak`.
3. Add a compact project hub Review section and actions.
4. Add a compact root workspace Review summary panel.
5. Update current-state, next-slices, handoff, and smoke checklist docs.
6. Add focused Playwright coverage for project/workspace dashboard summaries, deep links, persistence, backup/import, and Stage 4A2 regressions.

## Test plan

- Verify project Review section rendering, counts, sorting, weak empty state, and deep-link actions.
- Verify root workspace review summary categories.
- Verify review summaries persist after reload and through workspace backup/import.
- Verify existing map Review weak cards, filters, answer masking, and undo/history safety still pass.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`

## Risks

- Dashboard card counts must stay compatible with the map editor's generated card IDs.
- Seeded maps need a safe default-map summary before the map editor initializes page state.
- Deep links must not change map data or create undo/redo history entries.
