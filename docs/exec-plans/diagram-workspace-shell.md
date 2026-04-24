# Diagram Workspace Shell

## Goal

Make Neuro Map Studio feel like a diagram workspace application rather than a cleaner webpage. The first screen and project screen should prioritize maps, pages, projects, recent work, and quick creation, while backup/help/developer utilities stay secondary.

## Current behavior

- `src/App.tsx` now has a compact app header and collapsed utilities, but the layout is still a centered stack of sections.
- Root projects are visible, but there is no persistent app frame, recent work area, or diagram-first object board.
- `public/prototypes/current/project.html` uses a compact project header, but pages/documents still read as stacked sections with forms below them.
- Page cards are mostly text records; map pages do not yet feel visually distinct as diagram objects.
- `page.html`, `lesson.html`, and `mindmap.html` already preserve runtime behavior and should only receive shell/chrome alignment where safe.

## Desired behavior

- Root uses a workspace frame: left rail, compact top bar, and a main board.
- The first viewport shows Continue Working, quick actions, Recent pages/diagrams, and Projects without a hero or explainer block.
- Root quick actions include `New map`, `New page`, and `New project`; map/page creation uses the current project and opens the runtime immediately when appropriate.
- Project page uses the same app-frame language with a compact project bar and a board with `Pages`, `Documents`, and `Utilities` views.
- Page cards use type badges, compact metadata, real links, and lightweight visual previews. Map cards use a small schematic node/link motif.
- Backup/restore, help/about, developer tools, and large forms live in secondary dialogs/panels, not in the main board.

## Constraints

- Do not change IndexedDB schema, backup format, dynamic page routing, pageId map persistence, or map canvas interaction logic.
- Preserve backup/export/import, invalid backup rejection, guided starters, document blocks, lesson read-aloud/glossary, and all map/tablet regression behavior.
- Keep the Comic Sans/dyslexia-friendly type stack, large touch targets, visible focus states, reduced clutter, and progressive disclosure.
- Do not run package review/verify, create a zip, push, merge, rebase, or force-push.

## Implementation steps

1. Create `diagram-workspace-shell` from the clean app-shell cleanup commit.
2. Expand the root workspace snapshot types in `src/App.tsx` to include existing projects, documents, pages, page-document links, and page states.
3. Add UI-only helpers for project stats, recent pages, page URLs, page type labels, map node/edge counts, and schematic preview metadata.
4. Refactor root into an app frame with left rail, top bar, Continue Working, Quick Create, Recent diagrams/pages, Projects, and secondary utility panels.
5. Implement root quick-create flows using existing store helpers. `New map` creates a map page in the current project and opens it; `New page` uses a compact dialog; `New project` persists locally.
6. Refactor `project.html` into a project hub frame with left rail, top project bar, segmented `Pages`, `Documents`, and `Utilities` views.
7. Replace project stacked sections with object boards and compact dialogs for New Page, Add Document, and Attach Document.
8. Add type-aware page cards and map schematic previews on root and project pages.
9. Lightly align `page.html` shell spacing/copy if needed; avoid map canvas changes in `mindmap.html`.
10. Update Playwright tests for the app frame, object boards, quick create, project tabs, and preserved regressions.
11. Run the full non-packaging check set.
12. If checks pass, commit locally and write handoff/checklist/status files to Downloads.

## Test plan

- Root app rail/sidebar, top bar, primary actions, Continue Working, Recent pages/diagrams, and Projects are visible near the first viewport.
- Old hero/explainer phrasing is not visible as primary UI.
- New Project dialog creates a project that persists after reload.
- New Map from root or project creates a map page, opens map runtime, and keeps the starter panel working.
- Project hub loads with Pages as the default board, Documents and Utilities views available, and no large permanent forms.
- Page cards have real title/open hrefs, type-specific labels, related document counts, and map-oriented visual treatment.
- Backup export/import and invalid backup rejection still work from secondary utilities.
- Existing regression coverage remains green for dynamic runtime, legacy page recovery, guided starters, document blocks, map interactions, touch/S Pen behavior, context menus, lesson glossary/read-aloud, and debug mode.

## Risks and rollback

- Risk: root store typing changes could drift from `workspace-store.js`. Mitigation: use only existing exported data and helpers; no schema changes.
- Risk: dialogs could make creation less discoverable. Mitigation: keep visible top-bar buttons and clear dialog titles.
- Risk: project tab switching could hide existing forms from tests. Mitigation: use accessible buttons and keep forms in the DOM only inside active panels.
- Rollback: revert the local branch commit; no migrations or persistent data mutations are introduced beyond normal user-created records.

## Completion checklist

- `npm run doctor`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `GITHUB_PAGES=true npm run build`
- `npm run test:e2e`
- `npm run check`
- Local commit created on `diagram-workspace-shell`.
- Downloads handoff, QA checklist, and status file written.
