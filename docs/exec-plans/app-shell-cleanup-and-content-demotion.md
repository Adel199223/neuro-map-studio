# App Shell Cleanup And Content Demotion

## Goal

Make Neuro Map Studio feel like a compact local-first workspace app rather than a document, landing page, or explainer page. The main surfaces should prioritize projects, pages, documents, and clear app actions while moving explanatory text into collapsed Help/About areas.

## Current behavior

- `src/App.tsx` opens with a large `hero-card`, the heading "Build calm learning projects from documents, lessons, maps, and review pages", a long lede, and a prominent "Workspace ready" status.
- The root project list exists, but the marketing-sized hero and permanent create-project section make projects feel secondary.
- `public/prototypes/current/project.html` already supports real page links, context-aware page shortcuts, collapsed page/document creation, and page-document references, but the `hero` section, large `h1`, long description, and document-style spacing still make the project page feel article-like.
- `public/prototypes/current/page.html` correctly opens real runtime pages, but the shell/context and starter content can be tightened so page work feels primary.
- `tests/e2e/prototype.spec.ts` still expects the root to expose the old giant explainer heading and visible development links.

## Desired behavior

- The root screen uses a compact app bar with `Neuro Map Studio`, a small local-first status chip, and visible primary actions: open current project, new project, backup/restore, and help.
- Projects appear early in the first viewport on desktop/tablet, with cards and clear open actions.
- The old root explainer copy is removed from the main flow and, if retained, lives only in collapsed Help/About content.
- Create-project, backup/restore, and development utilities are collapsed by default.
- The project page uses a dashboard-style header with project title, page/document counts, and actions. Pages and documents are the main visible objects.
- Page and document creation remain accessible but collapsed; empty states are short and action-oriented.
- Runtime pages keep breadcrumbs and related document context, but the surrounding shell stays visually quiet and compact.

## Constraints

- Do not change storage schema, persistence behavior, dynamic page routing, backup/import logic, map state ownership, document block behavior, or map interaction internals.
- Preserve Comic Sans/dyslexia-friendly typography, generous touch targets, readable spacing, reduced clutter, and keyboard focus visibility.
- Preserve current compatibility routes: `lesson.html`, `mindmap.html`, and `mindmap.html?debugInput=1`.
- Do not run package review/verify, create a zip, push, merge, rebase, or force-push in this slice.

## Implementation steps

1. Create `app-shell-cleanup-and-content-demotion` from clean `guided-page-start-and-local-backup`.
2. Refactor `src/App.tsx` so the root uses a compact app dashboard: app bar, action rail, projects-first layout, collapsed New Project, collapsed Backup & Restore, collapsed Help/About, and collapsed Developer tools.
3. Update `src/styles/global.css` with compact dashboard sizing: smaller root `h1`, reduced hero spacing, action chips, summary panels, project-first grid, and mobile-friendly stacking.
4. Refactor the top chrome in `public/prototypes/current/project.html`: compact header, page/document counts, shorter status/copy, pages/documents as dashboard sections, and concise empty states.
5. Lightly tighten `public/prototypes/current/page.html` shell styles/copy for compact breadcrumbs, compact related documents, and collapsible guidance where safe.
6. Avoid map canvas changes. Only adjust `mindmap.html` or `lesson.html` if a safe shell-only copy/spacing issue is discovered.
7. Update Playwright expectations to validate the new app-shell hierarchy and preserve backup, starter, runtime, and map regressions.
8. Run the full non-packaging check set and make only narrow fixes if necessary.
9. If all checks pass, stage intended files and commit locally.
10. Write the handoff and screenshot QA checklist to Downloads, falling back to `docs/reports/` only if Downloads is unavailable.

## Test plan

- Root dashboard no longer shows the old giant explainer heading as primary visible UI.
- Root dashboard shows projects and primary actions near the top.
- New Project, Backup & Restore, Help/About, and Developer tools are collapsed but usable.
- Creating a project from the collapsed panel still persists after reload.
- Backup export/import and invalid-backup rejection still work.
- Project page shows pages and documents as dashboard sections.
- New Page and Add Document panels are collapsed by default and still work.
- Empty projects show create prompts instead of dead Open Lesson/Open Map shortcuts.
- Runtime pages still open and persist.
- Existing guided map starter, document block starter, page-card hrefs, legacy page recovery, pan/zoom, edge anchoring, selection shelf, touch-style drag, context menu suppression, and debug mode tests still pass.

## Risks and rollback

- Risk: tests relying on old root copy fail. Mitigation: update assertions to app-shell behavior instead of implementation details.
- Risk: collapsed forms become harder to reach. Mitigation: expose clear top-level buttons and use accessible `<details>` summaries.
- Risk: compacting project header could accidentally hide important context. Mitigation: keep project title, counts, actions, and concise status visible.
- Rollback: revert this branch commit only; no data migrations or schema changes are introduced.

## Completion checklist

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `GITHUB_PAGES=true npm run build`
- `npm run test:e2e`
- `npm run check`
- Local commit created on `app-shell-cleanup-and-content-demotion`.
- Handoff and QA checklist written outside the repo when possible.
