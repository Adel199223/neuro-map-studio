# NeuroMap And Accessible Reader Compatibility

## Summary

Stage 5A0 is a compatibility audit only. It does not integrate Neuro Map Studio into Accessible Reader, move data into Accessible Reader storage, add backend endpoints, rewrite NeuroMap in React, convert it to TypeScript, split `mindmap.html`, or change product behavior.

The goal is to keep NeuroMap modernization pointed toward a future portable "Map Studio" surface while preserving Accessible Reader as the likely host app if integration is ever approved.

Execution-time gate result:

- Neuro Map Studio `main`, `origin/main`, and branch start were clean at `d5867508897b11fa9041a173e3870c974c165c33`.
- Stage 3B3 is live on Neuro Map Studio `main` through `9b51af1 Add relationship insert block between`.
- Accessible Reader was inspected read-only and was clean at `85b9915`.

## Current Roles And Shape

### Neuro Map Studio

NeuroMap is strongest as a local-first spatial map editor:

- manual canvas layout with user-authored positions and block sizes;
- concept, question, evidence, and document blocks;
- document blocks that preserve `documentId`;
- port-based relationship creation, reconnect, and Insert block between;
- dynamic relationship anchoring as blocks move;
- pageId-scoped map state inside IndexedDB `pageStates`;
- local Review Mode derived from map content, with weak-card and Review next queues;
- workspace JSON backup/import/export with invalid backup rejection.

Important current files:

| Area | Files |
| --- | --- |
| Root dashboard | `src/App.tsx` |
| Local workspace store | `public/prototypes/current/workspace-store.js` |
| Map runtime/editor | `public/prototypes/current/mindmap.html` |
| Review summaries | `public/prototypes/current/review-summary.js` |
| Seed map defaults | `public/prototypes/current/map-defaults.js` |
| Current TypeScript helpers | `src/features/learning-map/types.ts`, `src/features/learning-map/workspaceCore.ts`, `src/features/learning-map/relationshipVisuals.ts` |
| Main e2e harness | `tests/e2e/prototype.spec.ts` |

Size and complexity notes:

| File | Lines | Bytes | Notes |
| --- | ---: | ---: | --- |
| `public/prototypes/current/mindmap.html` | 6,783 | 368,408 | One 457-line inline style block from lines 7-463 and one 6,004-line inline module script from lines 778-6781. |
| `public/prototypes/current/review-summary.js` | 393 | 15,394 | Shared dashboard/project review summaries. |
| `public/prototypes/current/workspace-store.js` | 944 | 31,287 | IndexedDB workspace/project/page/document/pageStates store. |
| `src/features/learning-map/workspaceCore.ts` | 466 | 14,519 | Existing pure map normalization/import/export helpers to reuse in Stage 5A1. |
| `src/features/learning-map/types.ts` | 72 | 1,484 | Current TypeScript map data types. |
| `src/features/learning-map/relationshipVisuals.ts` | 82 | 2,105 | Current relationship labels, colors, routes, and descriptions. |
| `tests/e2e/prototype.spec.ts` | 4,869 | 222,457 | 107 test definitions across Chromium and mobile Chrome projects. |
| `tests/e2e/workspace-core.spec.ts` | 287 | 9,724 | 10 pure workspace-core test definitions across Chromium and mobile Chrome projects. |

### Accessible Reader

Accessible Reader is already a broader Recall workspace with Reader, Graph, Study, notes, collections, import/export, and local backend storage:

- Reader with original, reflowed, simplified, and summary document views;
- Recall notes anchored to source documents, variants, blocks, and sentence/source anchors;
- Knowledge graph concepts and relationships with review decisions;
- Study cards, review events, sessions, answer attempts, progress, and scheduling state;
- SQLite-backed local service with FTS, workspace export/import previews, and additive restore;
- Library collections, collection workspaces, reading queue, imports, and browser companion.

Important current files:

| Area | Files |
| --- | --- |
| Frontend contracts/API | `frontend/src/types.ts`, `frontend/src/api.ts` |
| Large Recall surface | `frontend/src/components/RecallWorkspace.tsx` |
| Reader/source components | `frontend/src/components/ReaderSurface.tsx`, `frontend/src/components/ReaderWorkspace.tsx`, `frontend/src/components/FocusedSourceReaderPane.tsx` |
| Graph components | `frontend/src/components/graph/*`, `frontend/src/lib/graphViewFilters.ts` |
| Backend contracts/storage | `backend/app/models.py`, `backend/app/storage.py`, `backend/app/main.py` |
| Study/recall helpers | `backend/app/study.py`, `backend/app/recall.py` |
| Import/export | `backend/app/bulk_import.py`, workspace export/import methods in `backend/app/storage.py` |

Size and complexity notes:

| File | Lines | Bytes | Notes |
| --- | ---: | ---: | --- |
| `frontend/src/components/RecallWorkspace.tsx` | 25,517 | 1,163,383 | Host workspace surface with Graph, Study, Notebook, Home, and source workflows. |
| `frontend/src/index.css` | 34,305 | 885,773 | Large global stylesheet across Recall surfaces. |
| `backend/app/storage.py` | 9,032 | 385,161 | SQLite storage, graph/study/notes/export/import logic. |
| `backend/app/models.py` | 1,280 | 41,659 | Pydantic contracts for source, graph, notes, study, workspace, and library data. |

## Integration Principle

Future integration should follow these boundaries:

- Accessible Reader remains the host app if integration happens.
- NeuroMap becomes a portable Map Studio surface or mode, not a full second app embedded inside Recall.
- NeuroMap keeps its core value: manual spatial layout, block placement, port/relationship editing, and map-derived recall.
- Accessible Reader keeps host ownership of Reader, Graph, Study, collections, backend storage, import/export, and browser companion workflows.
- The contract must separate semantic graph data from visual map layout. A graph edge is not the same thing as a manually placed relationship line with ports and route style.
- This audit does not choose a final integration path. It only defines compatible boundaries so future refactors do not make integration harder.

## Concept Mapping

### Direct Or Near-Direct Mapping

| NeuroMap concept | Accessible Reader concept | Compatibility rule |
| --- | --- | --- |
| Concept block | `KnowledgeNodeRecord` / `KnowledgeNode` | Safe only as manual or confirmed graph node. Preserve NeuroMap block ID and layout separately. |
| Evidence block | `KnowledgeNodeRecord` or evidence metadata | Safe when treated as user-authored evidence/source-like node, not as inferred fact. |
| Relationship line | `KnowledgeEdgeRecord` / `KnowledgeEdge` | Safe when both endpoints map to nodes. Preserve `label`, `relation`, `strength`, `shape`, and ports in adapter metadata. |
| Relationship type | `relation_type` | Map known types directly where names match or are clear. Keep unknown/custom relation text in metadata. |
| Document block with `documentId` | `SourceDocument` reference | Safe only when the referenced source exists or the user deliberately imports/links it. |
| Review card prompt/answer | `StudyCardRecord` prompt/answer | Safe with explicit provenance and stale-card safeguards. |
| Review attempt timestamp | `ReviewEvent.reviewed_at` or Study progress data | Safe only after rating vocabulary is mapped deliberately. |

### Partial Mapping

| NeuroMap concept | Accessible Reader concept | Gap |
| --- | --- | --- |
| Project | Library collection or workspace grouping | NeuroMap project is a local workspace container; Accessible Reader collections are source groupings with reading/study activity. |
| Page | Source workspace, collection workspace, or host route state | NeuroMap pages include map/lesson/notes/review/glossary runtimes; Accessible Reader does not have a direct page model. |
| Map page state | `KnowledgeGraphSnapshot` plus host metadata | Graph snapshot lacks visual layout, ports, map view, and page-scoped review store. |
| Block coordinates and dimensions | Graph node metadata or external layout state | Accessible Reader graph records do not own manual spatial layout. |
| Ports and auto-anchoring | No direct model | Keep in `NeuroMapLayoutState` or relationship metadata only. |
| Review next / weak-card summary | Study scheduling/progress summaries | Rating vocabulary and scheduling semantics differ. Do not transfer mastery automatically. |
| Backup `pageStates` | Workspace export/import payload | NeuroMap stores page runtime state; Accessible Reader exports table-shaped entities and merge previews. |

### No Safe Mapping Yet

| NeuroMap concept | Accessible Reader concept | Why unsafe |
| --- | --- | --- |
| Whole workspace JSON backup | Accessible Reader SQLite restore | Different storage models and conflict semantics. No replacement import should be automatic. |
| NeuroMap review mastery | Study scheduling state | `got-it/almost/missed` does not equal FSRS-like `forgot/hard/good/easy` scheduling. |
| Accessible Reader inferred graph | NeuroMap manual spatial map | Inferred graph confidence/provenance is not the same as user-authored spatial organization. |
| Reader generated outputs | NeuroMap blocks | Generated Reader output is frozen unless explicitly reprioritized. |
| Source documents | NeuroMap project documents | Accessible Reader can store content and variants; NeuroMap currently stores metadata only. |
| Import/restore conflicts | NeuroMap merge import | Accessible Reader has preview/apply semantics; NeuroMap only skips existing IDs during merge. |

### Data NeuroMap Has That Accessible Reader Lacks

| Data | Notes |
| --- | --- |
| Manual x/y/w/h block layout | Core Map Studio value; must survive adapters. |
| Relationship ports | `fromPort` and `toPort` affect line anchoring and editing intent. |
| Relationship route shape | `straight`, `curve`, `elbow`, `arc` are visual/editing metadata. |
| Sources & blocks placement workflow state | UI behavior, not graph semantics. |
| PageId-scoped map workspace state | Multiple map pages can exist inside one local workspace. |
| Map-specific review card IDs | IDs combine map view, card kind, and source block/relationship IDs. |
| Weak-card and Review next queues | Derived from NeuroMap latest attempts, not due-date scheduling. |

### Data Accessible Reader Has That NeuroMap Lacks

| Data | Notes |
| --- | --- |
| Full `SourceDocument` content model | Includes stored paths, content hashes, source locators, variants, and chunks. |
| `DocumentVariant` and `ContentChunk` | Reader-specific content surfaces and searchable text slices. |
| Sentence/source anchored `RecallNoteRecord` | More precise source anchoring than NeuroMap document metadata. |
| Graph review status | Suggested/confirmed/rejected review decisions have no NeuroMap equivalent. |
| Graph confidence/provenance | Inferred/manual plus confidence is separate from spatial map editing. |
| Study scheduling state | Due/new/scheduled/unscheduled, knowledge stages, progress, habits, and sessions. |
| Workspace merge previews | Accessible Reader has richer conflict preview/apply machinery. |
| Library collections and reading queue | Host-level source organization and reading-progress flows. |

## Portable NeuroMap Contract Proposal

The contract should be introduced as pure data first, before moving runtime code. It should be versioned and serializable without depending on DOM, IndexedDB, SQLite, React, or Accessible Reader APIs.

Shared defaults:

- `contractVersion`: required string, initially `"neuro-map-snapshot.v1"`.
- IDs: preserve original NeuroMap IDs by default. Adapter-generated IDs must carry a stable prefix and keep `sourceId` references.
- Timestamps: ISO 8601 strings when the source has them; optional otherwise.
- Source references: keep local `documentId` and optional host references separately.
- Metadata: use `metadata` for unknown host fields and provenance, but not for core layout.
- Review state: store separately from graph semantics so stale mastery can be detected.

### Stage 5A1 Helper Baseline

Stage 5A1 introduces pure TypeScript helpers behind this contract without changing product runtime behavior:

| File | Purpose |
| --- | --- |
| `src/features/learning-map/portableContract.ts` | Serializable contract types, version constants, review rating/filter unions, and shared metadata shapes. |
| `src/features/learning-map/portableSnapshot.ts` | Pure snapshot normalization, map-state snapshot building through `workspaceCore.normalizeMap`, validation, summaries, document refs, and valid relationship refs. |
| `src/features/learning-map/portableReview.ts` | Pure review helpers for latest-attempt selection, weak-card queues, Review next ordering, card-type filters, summary counts, and rating vocabulary preview mapping. |
| `src/features/learning-map/portableAdapters.ts` | Preview-only Accessible Reader-shaped graph data from a NeuroMap snapshot, with layout and relationship route/port metadata kept outside graph semantics. |

This helper baseline has no DOM, IndexedDB, localStorage, fetch, backend, or Accessible Reader imports. `mindmap.html`, `review-summary.js`, storage keys, backup/import behavior, routes, and UI remain the runtime sources of truth until a later approved slice wires modules into the product.

### Stage 5A3 Runtime Parity Fixtures

Stage 5A3 adds pure runtime-shape adapters and fixtures so the current saved map page-state data can be represented by the portable contract before the monolithic runtime is modularized.

| File | Purpose |
| --- | --- |
| `src/features/learning-map/runtimePortableSnapshot.ts` | Pure helpers that read current runtime page-state envelopes, select inner map views, preserve review attempts/sessions, and build portable snapshots or bundles. |
| `tests/fixtures/learning-map/runtimePortableFixtures.ts` | Representative saved runtime page-state, multi-map page-state, backup-like, document-link, review, and invalid-relationship fixtures. |
| `tests/e2e/runtime-portable-snapshot-parity.spec.ts` | Pure Playwright-runner tests proving runtime data can reach the portable contract without layout, relationship, document, review, or metadata loss. |

The runtime source shape remains `{ kind: "map-workspace", workspace, starterHidden, review }`, with inner map views in `workspace.pages[]` and active view selection through `workspace.activePageId`. Stage 5A3 does not generate review cards from `mindmap.js`; it preserves persisted review attempts and sessions, and accepts materialized cards only as explicit input for fixtures or future adapters.

The Stage 5A3 hardening pass covers runtime-converted review summary and Review Next ordering, safe invalid-attempt filtering, and input immutability without wiring the helpers into the browser runtime.

`mindmap.js` remains plain browser JavaScript and is not wired to these helpers. Accessible Reader remains read-only, and the adapter boundary remains preview/test-only.

### `NeuroMapSnapshot`

| Field | Required | Notes |
| --- | --- | --- |
| `contractVersion` | yes | Versioned contract name. |
| `id` | yes | Stable snapshot/map ID, usually page ID plus map view ID. |
| `title` | yes | Map view title. |
| `projectId` | no | NeuroMap project ID if available. |
| `pageId` | no | NeuroMap page ID if available. |
| `mapViewId` | no | Current inner map view ID such as `page-main`. |
| `blocks` | yes | Array of `NeuroMapBlock`. |
| `relationships` | yes | Array of `NeuroMapRelationship`. |
| `layout` | yes | `NeuroMapLayoutState`. |
| `documents` | no | Referenced `NeuroMapDocumentRef` records. |
| `review` | no | Cards, attempts, and sessions related to this snapshot. |
| `createdAt`, `updatedAt` | no | Preserve source timestamps when available. |
| `metadata` | no | Provenance, host hints, and adapter notes. |

### `NeuroMapBlock`

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Original block ID. |
| `kind` | yes | `concept`, `question`, `evidence`, or `document`. |
| `title` | yes | User-visible title. |
| `body` | no | User-authored body or document description. |
| `documentRef` | no | Required when `kind` is `document`. |
| `style` | no | `group`, `shape`, `importance`, `tag`. |
| `layout` | yes | x/y/w/h in map world coordinates. |
| `sourceRefs` | no | Optional references to Accessible Reader source/chunk/note IDs. |
| `metadata` | no | Adapter provenance and non-core fields. |

### `NeuroMapRelationship`

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Original relationship ID. |
| `sourceBlockId` | yes | Original `from` block ID. |
| `targetBlockId` | yes | Original `to` block ID. |
| `type` | yes | NeuroMap relationship type. |
| `label` | no | User label, distinct from type. |
| `strength` | no | Current line thickness/importance. |
| `route` | no | `straight`, `curve`, `elbow`, or `arc`. |
| `ports` | no | `{ source, target }`, each `auto/top/right/bottom/left`. |
| `sourceRefs` | no | Evidence/source references if any. |
| `metadata` | no | Host graph edge ID, confidence, provenance, or warnings. |

### `NeuroMapDocumentRef`

| Field | Required | Notes |
| --- | --- | --- |
| `documentId` | yes | NeuroMap document ID. |
| `title` | yes | Source/document title. |
| `sourceLabel` | no | NeuroMap source label. |
| `type` | no | NeuroMap document type. |
| `urlOrPath` | no | Metadata only; not parsed content. |
| `tags` | no | Existing NeuroMap tags. |
| `hostSourceDocumentId` | no | Accessible Reader source ID if linked. |
| `metadata` | no | Import/link provenance. |

### `NeuroMapReviewCard`

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable card ID, derived from map view and block/relationship ID. |
| `type` | yes | `block`, `relationship`, `neighbor`, or `source`. |
| `prompt` | yes | Recall prompt. |
| `answer` | yes | Expected answer. |
| `sourceBlockIds` | no | Blocks highlighted or masked by the card. |
| `sourceRelationshipIds` | no | Relationships highlighted or masked by the card. |
| `derivedAt` | no | Timestamp if materialized. |
| `metadata` | no | Generation source and adapter warnings. |

### `NeuroMapReviewAttempt`

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Attempt ID. |
| `cardId` | yes | `NeuroMapReviewCard.id`. |
| `rating` | yes | `got-it`, `almost`, or `missed`. |
| `reviewedAt` | yes | ISO timestamp. |
| `attemptCount` | no | Preserve current NeuroMap value. |
| `sessionId` | no | Optional review session link. |
| `metadata` | no | Host review-event ID or stale-card notes. |

### `NeuroMapLayoutState`

| Field | Required | Notes |
| --- | --- | --- |
| `view` | yes | `{ x, y, scale }`. |
| `blockLayouts` | yes | Per-block x/y/w/h. |
| `relationshipLayouts` | no | Ports, route shape, cached label hints if needed. |
| `viewportHints` | no | Optional host sizing hints; not required for data integrity. |

### `NeuroMapImportExportBundle`

| Field | Required | Notes |
| --- | --- | --- |
| `bundleVersion` | yes | Bundle-level version. |
| `exportedAt` | yes | ISO timestamp. |
| `snapshots` | yes | One or more `NeuroMapSnapshot` records. |
| `documents` | no | Shared document refs. |
| `source` | no | App/version/provenance. |
| `warnings` | no | Lossy adapter notes. |

## Adapter Strategy

Future adapters should be pure, fixture-tested, and opt-in:

| Adapter | Direction | Rule |
| --- | --- | --- |
| Map snapshot to graph snapshot | NeuroMap -> Accessible Reader | Emit manual graph nodes/edges with layout in metadata or sidecar layout state. Do not create backend records by default. |
| Graph snapshot to map snapshot | Accessible Reader -> NeuroMap | Create suggested/imported blocks and relationships with deterministic layout, marked as imported. Do not imply user-authored spatial intent. |
| Map review cards to Study cards | NeuroMap -> Accessible Reader | Create or preview Study cards only with explicit provenance and stale-card safeguards. Map `missed` -> `forgot`, `almost` -> `hard`, `got-it` -> `good`; never infer `easy`. |
| Notes/documents to map blocks | Accessible Reader -> NeuroMap | Allow source/document blocks or source-note evidence blocks only when the source exists and the user chooses the transfer. |
| NeuroMap backup to workspace import | NeuroMap -> Accessible Reader | Future preview-only import path at first. No destructive restore or automatic SQLite replacement. |

Do not convert automatically:

- manual layout into graph semantics;
- graph confidence into NeuroMap importance;
- review mastery into due dates or FSRS scheduling;
- Reader generated outputs into blocks;
- Accessible Reader source documents into NeuroMap metadata-only documents without user confirmation;
- unknown relationship labels into canonical relation types without keeping the original label;
- backup imports that would overwrite existing host data.

## Modernization Sequence

Recommended next code slices:

1. Stage 5A1: extract pure NeuroMap data, review, and model helpers behind this contract. This baseline now lives in `src/features/learning-map/portable*.ts` with fixture coverage and no runtime wiring.
2. Stage 5A2: externalize `mindmap.html` CSS and the existing browser runtime into `mindmap.css` and `mindmap.js`. Keep behavior unchanged and leave `mindmap.js` monolithic.
3. Stage 5A3: harden runtime-to-portable snapshot parity fixtures using representative saved page-state and backup-like data. Keep adapters pure and no-op with respect to storage.
4. Stage 5A4: optionally refactor Accessible Reader graph/workspace boundaries if integration becomes likely. Keep Accessible Reader behavior intact.
5. Later only: actual integration, host UI decisions, backend persistence, and migration plans.

Do not add a standalone Vite step. Neuro Map Studio already uses Vite. Do not recommend or start a React rewrite.

## Accessible Reader Future Cleanup

Accessible Reader should remain read-only for now. If integration becomes likely, do only targeted preparation:

- split Map Studio host boundary concerns out of the largest Recall workspace areas;
- split large CSS into feature-scoped files or tokens around Graph/Study/Map-host surfaces;
- isolate graph/study data hooks so adapters can be tested without rendering `RecallWorkspace.tsx`;
- keep Reader, Recall Home, Graph, Study, Notebook, collections, import/export, and browser companion behavior stable.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Local IndexedDB vs backend SQLite | Direct storage migration could lose data or bypass merge previews. | Keep Stage 5A adapters pure; use preview/apply only after explicit future approval. |
| Rating vocabulary mismatch | Review mastery could become stale or overconfident. | Store NeuroMap attempts separately; map ratings only for explicit Study-card creation and never infer `easy`. |
| Manual map vs inferred graph semantics | User spatial intent can be misread as graph truth. | Mark imported/inferred data clearly; keep layout sidecar separate from graph records. |
| Layout metadata missing in Accessible Reader | Round-tripping graph data can lose positions, dimensions, and ports. | Contract requires explicit `NeuroMapLayoutState`. |
| Source/document reference mismatch | NeuroMap metadata-only documents are not Accessible Reader source content. | Use `NeuroMapDocumentRef` with optional `hostSourceDocumentId`; require user choice for new source creation. |
| Review card identity and stale mastery | Topology edits can make previous attempts invalid. | Preserve card IDs, provenance, and changed-topology warnings; keep Stage 3B3 stale relationship attempt clearing. |
| Accessibility/theme differences | Host style could erase NeuroMap touch/ADHD/dyslexia affordances. | Treat Map Studio as a hosted surface with its own interaction contract and host tokens only at boundaries. |
| Import/export conflicts | NeuroMap merge-skip differs from Accessible Reader preview/apply. | Future imports start as dry-run previews with conflict reporting. |

## Recommendation

After Stage 5A3, keep Accessible Reader read-only and use the parity fixtures as the guardrail for any later `mindmap.js` modularization. The next implementation slice should either close review gaps found in the runtime parity fixtures or begin a behavior-preserving runtime module split; actual integration, backend persistence, and host UI decisions remain later-only work.
