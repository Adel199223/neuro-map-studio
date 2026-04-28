# ExecPlan: Review Next Priority Queue

## Goal

Add a lightweight `Review next` workflow that points learners toward the most useful local review cards without introducing spaced-repetition scheduling.

## Desired behavior

- Review priority is derived from existing generated review cards and latest local attempts.
- Priority order is:
  - `Missed`;
  - `Almost`;
  - unreviewed cards.
- Current `Got it` cards are excluded from Stage 4A4 priority. Older `Got it` revisit rules remain future scheduling work.
- The map review panel supports `Review next` alongside normal review and weak-card review.
- `review=next` deep links open a Review next session when priority cards exist, or the launcher with a friendly empty state when none exist.
- Project hub and workspace dashboard show priority counts and Review next launch actions.
- Priority counts are derived, not stored, and backup/export/import behavior continues through existing `pageStates`.

## Constraints

- Do not add SM-2, due dates, interval math, reminders, notifications, AI generation, cloud sync, accounts, collaboration, or relationship endpoint editing.
- Do not add a new IndexedDB store or bump the database version.
- Keep `data.review.version = 1`; only optional session `mode: "next"` is added.
- Preserve Stage 4A1/4A2 answer masking, filters, weak-card queue, undo/history safety, and existing editor behavior.

## Implementation steps

1. Extend shared review-summary helpers with Review next queue derivation, priority counts, and priority-aware summary sorting.
2. Add `next` as a map review session mode with launcher button, deep-link handling, progress/summary wording, and empty states.
3. Surface priority counts and Review next actions in the project hub and root workspace dashboard.
4. Update current-state, roadmap, handoff, and smoke checklist docs.
5. Add Playwright coverage for counts, ordering, deep links, empty states, persistence, dashboard summaries, masking regression, and editor safety.

## Test plan

- Verify priority counts for latest `Missed`, `Almost`, `Got it`, and unreviewed cards.
- Verify Review next ordering: Missed, Almost, unreviewed; current Got it excluded.
- Verify a Missed card rated `Got it` updates counts and leaves weak/priority queues.
- Verify project and workspace Review next deep links.
- Verify `review=next` empty state for no-priority maps.
- Verify existing weak review, filters, dashboard summaries, answer masking, and editor interactions still pass.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`
  - `git diff --check`

## Risks

- Review next counts must remain aligned between map editor and dashboards.
- Deep links must not mutate map content or create map undo history.
- Dashboard wording must stay compact enough for narrow layouts.
