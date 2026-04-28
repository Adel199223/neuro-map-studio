# ExecPlan: Map Review Weak Cards Queue

## Goal

Make embedded map review more useful by letting learners see weak cards, filter review cards by type, and start a focused weak-card review session.

## Desired behavior

- `Review this map` opens a compact review launcher instead of immediately starting a session.
- The launcher shows total generated cards, reviewed cards, weak cards, and the latest session result.
- Filters are available for All, Blocks, Relationships, Connected blocks, and Sources/evidence.
- `Start review` starts a normal session using the selected filter.
- `Review weak cards` starts a session containing only filtered cards whose latest rating is `Missed` or `Almost`.
- Weak cards are ordered with `Missed` before `Almost`, then oldest reviewed card first.
- Rating a weak card `Got it` graduates it out of the next weak-card queue.
- Existing answer masking, highlighting, review persistence, backup preservation, and map undo/history safety remain intact.

## Constraints

- Do not add spaced-repetition scheduling, due dates, intervals, SM-2, AI generation, cloud sync, accounts, collaboration, or relationship endpoint editing.
- Do not add a new IndexedDB store or bump the database version.
- Keep `data.review.version = 1`; weak-card status is derived from attempts.
- Preserve standalone map-content export compatibility.

## Implementation steps

1. Extend the review panel markup/CSS with launcher controls, filter buttons, weak-card action, and summary wording.
2. Add helper functions for card filtering, latest-attempt lookup, weak-card derivation, counts, and weak queue ordering.
3. Extend review sessions with optional backward-compatible `mode` and `filter` fields.
4. Update review rendering so launcher, card session, empty state, and summary are separate states.
5. Wire launcher, filter, start, weak start, restart, exit, and Escape behavior.
6. Update docs and Playwright coverage for weak queue, filters, persistence, backup, masking, and undo/history safety.

## Test plan

- Add Playwright tests for empty weak state, creating weak cards, weak queue ordering, graduation, filters, persistence after reload, backup/import, masking regression, and undo/history safety.
- Run:
  - `npm run doctor`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `GITHUB_PAGES=true npm run build`
  - `npm run test:e2e`
  - `npm run check`

## Risks

- Weak-card counts must be derived only from the current map page and map view.
- Filtered empty states must not look like data loss.
- The launcher must not create map undo/redo entries.
- Stage 4A1 pre-reveal answer masking must not regress.
