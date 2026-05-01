import type {
  NeuroMapImportExportBundle,
  NeuroMapDocumentRef,
  NeuroMapMetadata,
  NeuroMapReviewAttempt,
  NeuroMapReviewCard,
  NeuroMapReviewCardType,
  NeuroMapReviewFilter,
  NeuroMapReviewSession,
  NeuroMapReviewState,
  NeuroMapSnapshot,
} from './portableContract';
import {
  NEURO_MAP_BUNDLE_VERSION,
  NEURO_MAP_REVIEW_CARD_TYPES,
  NEURO_MAP_REVIEW_FILTERS,
  NEURO_MAP_REVIEW_RATINGS,
} from './portableContract';
import type { PortableDocumentSource, PortableSnapshotSummary } from './portableSnapshot';
import {
  buildPortableSnapshotFromMapState,
  getPortableSnapshotSummary,
  validatePortableSnapshotShape,
} from './portableSnapshot';
import type { CompatibleImportPayload } from './workspaceCore';

const DEFAULT_RUNTIME_MAP_VIEW_ID = 'page-main';

export interface RuntimeMapViewRef {
  id: string;
  title: string;
  active: boolean;
  index: number;
  map: CompatibleImportPayload;
}

export interface RuntimePageRecordLike {
  id?: unknown;
  projectId?: unknown;
  title?: unknown;
  type?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RuntimePageDocumentLinkLike {
  pageId?: unknown;
  documentId?: unknown;
  relationship?: unknown;
}

export interface RuntimePageStateRecordLike {
  id?: unknown;
  pageId?: unknown;
  pageType?: unknown;
  stateVersion?: unknown;
  data?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  metadata?: unknown;
}

export interface NormalizeRuntimeReviewStateInput {
  review: unknown;
  pageId?: string;
  mapViewId?: string;
  cards?: readonly NeuroMapReviewCard[];
  metadata?: NeuroMapMetadata;
}

export interface BuildRuntimePortableSnapshotInput {
  pageState: unknown;
  page?: RuntimePageRecordLike;
  pageId?: string;
  projectId?: string;
  title?: string;
  mapViewId?: string;
  documents?: readonly PortableDocumentSource[];
  reviewCards?: readonly NeuroMapReviewCard[];
  metadata?: NeuroMapMetadata;
}

export interface BuildRuntimePortableBundleInput {
  exportedAt: string;
  pageStates: readonly unknown[];
  pages?: readonly RuntimePageRecordLike[];
  documents?: readonly PortableDocumentSource[];
  pageDocumentLinks?: readonly RuntimePageDocumentLinkLike[];
  source?: NeuroMapImportExportBundle['source'];
  metadata?: NeuroMapMetadata;
}

export interface RuntimePortableParitySummary extends PortableSnapshotSummary {
  valid: boolean;
  errors: string[];
  warnings: string[];
  mapViewCount: number;
  activeMapViewId?: string;
  droppedRelationshipIds: string[];
  reviewSessionCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function clean(value: unknown, fallback = ''): string {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function optionalString(value: unknown): string | undefined {
  const text = clean(value);
  return text || undefined;
}

function metadata(value: unknown): NeuroMapMetadata | undefined {
  return isRecord(value) ? { ...value } : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  const numeric = Math.max(1, Math.floor(Number(value) || 0));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map((item) => clean(item)).filter(Boolean);
  return items.length ? items : undefined;
}

function recordFromPageState(pageState: unknown): RuntimePageStateRecordLike {
  return isRecord(pageState) ? pageState : {};
}

function dataFromPageState(pageState: unknown): unknown {
  const record = recordFromPageState(pageState);
  return isRecord(record.data) ? record.data : pageState;
}

function workspaceFromPageState(pageState: unknown): Record<string, unknown> {
  const data = dataFromPageState(pageState);
  if (isRecord(data) && isRecord(data.workspace)) return data.workspace;
  return isRecord(data) ? data : {};
}

function mapPageDataKind(pageState: unknown): string | undefined {
  const data = dataFromPageState(pageState);
  return isRecord(data) ? optionalString(data.kind) : undefined;
}

function isMapLike(value: unknown): boolean {
  return isRecord(value) && Array.isArray(value.nodes);
}

function pageMapSource(page: unknown): CompatibleImportPayload {
  if (!isRecord(page)) return undefined;
  return (isRecord(page.map) ? page.map : page) as CompatibleImportPayload;
}

function activeMapViewId(pageState: unknown): string | undefined {
  const workspace = workspaceFromPageState(pageState);
  return optionalString(workspace.activePageId);
}

function rawRuntimeRelationshipIds(map: unknown): string[] {
  if (!isRecord(map) || !Array.isArray(map.nodes) || !Array.isArray(map.edges)) return [];
  const nodeIds = new Set(
    map.nodes.flatMap((node) => {
      if (!isRecord(node)) return [];
      const id = clean(node.id);
      return id ? [id] : [];
    }),
  );
  return map.edges.flatMap((edge, index) => {
    if (!isRecord(edge)) return [];
    const from = clean(edge.from);
    const to = clean(edge.to);
    if (nodeIds.has(from) && nodeIds.has(to)) return [];
    return [clean(edge.id, `edge-${index}`)];
  });
}

function pageDocumentId(document: PortableDocumentSource): string {
  return clean(document.documentId ?? document.id);
}

function documentRefFromSource(document: PortableDocumentSource): NeuroMapDocumentRef | null {
  const documentId = pageDocumentId(document);
  if (!documentId) return null;
  return {
    documentId,
    title: clean(document.title, documentId),
    sourceLabel: optionalString(document.sourceLabel),
    type: optionalString(document.type),
    urlOrPath: optionalString(document.urlOrPath ?? document.url ?? document.path),
    tags: Array.isArray(document.tags) ? document.tags.map((tag) => clean(tag)).filter(Boolean) : undefined,
    hostSourceDocumentId: optionalString(document.hostSourceDocumentId),
    metadata: metadata(document.metadata),
  };
}

function documentsForPage(
  documents: readonly PortableDocumentSource[] = [],
  links: readonly RuntimePageDocumentLinkLike[] | undefined,
  pageId: string,
): PortableDocumentSource[] {
  if (!links?.length || !pageId) return [...documents];
  const linkedDocumentIds = new Set(
    links.flatMap((link) => {
      if (clean(link.pageId) !== pageId) return [];
      const documentId = clean(link.documentId);
      return documentId ? [documentId] : [];
    }),
  );
  if (!linkedDocumentIds.size) return [...documents];
  return documents.filter((document) => linkedDocumentIds.has(pageDocumentId(document)));
}

function mergeRuntimeMetadata(
  base: NeuroMapMetadata | undefined,
  runtime: NeuroMapMetadata,
  extra?: NeuroMapMetadata,
): NeuroMapMetadata {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
    runtime: {
      ...(isRecord(base?.runtime) ? base.runtime : {}),
      ...(isRecord(extra?.runtime) ? extra.runtime : {}),
      ...runtime,
    },
  };
}

function runtimeMetadataForSnapshot(
  pageState: unknown,
  selectedView: RuntimeMapViewRef,
  inputMetadata?: NeuroMapMetadata,
): NeuroMapMetadata {
  const pageStateRecord = recordFromPageState(pageState);
  const data = dataFromPageState(pageState);
  const workspace = workspaceFromPageState(pageState);
  const droppedRelationshipIds = rawRuntimeRelationshipIds(selectedView.map);
  return mergeRuntimeMetadata(inputMetadata, {
    source: 'runtime-page-state',
    pageStateId: optionalString(pageStateRecord.id),
    pageType: optionalString(pageStateRecord.pageType),
    pageStateVersion: optionalNumber(pageStateRecord.stateVersion),
    pageStateKind: mapPageDataKind(pageState),
    workspaceVersion: optionalNumber(workspace.version),
    activeMapViewId: activeMapViewId(pageState),
    selectedMapViewId: selectedView.id,
    selectedMapViewTitle: selectedView.title,
    starterHidden: isRecord(data) && typeof data.starterHidden === 'boolean' ? data.starterHidden : undefined,
    droppedRelationshipIds,
    pageStateMetadata: metadata(pageStateRecord.metadata),
    dataMetadata: isRecord(data) ? metadata(data.metadata) : undefined,
    workspaceMetadata: metadata(workspace.metadata),
  });
}

function normalizeReviewCardType(value: unknown): NeuroMapReviewCardType | undefined {
  return NEURO_MAP_REVIEW_CARD_TYPES.includes(value as NeuroMapReviewCardType)
    ? (value as NeuroMapReviewCardType)
    : undefined;
}

function normalizeReviewFilter(value: unknown): NeuroMapReviewFilter | undefined {
  return NEURO_MAP_REVIEW_FILTERS.includes(value as NeuroMapReviewFilter)
    ? (value as NeuroMapReviewFilter)
    : undefined;
}

function runtimeReviewMetadata(
  originalMetadata: unknown,
  runtime: NeuroMapMetadata,
): NeuroMapMetadata | undefined {
  const preserved = metadata(originalMetadata);
  if (!Object.values(runtime).some((value) => value !== undefined)) return preserved;
  return mergeRuntimeMetadata(preserved, runtime);
}

function matchesRuntimeScope(value: unknown, pageId?: string, mapViewId?: string): boolean {
  if (!isRecord(value)) return false;
  const scopedPageId = optionalString(value.pageId) ?? pageId;
  const scopedMapViewId = optionalString(value.mapViewId) ?? mapViewId;
  if (pageId && scopedPageId !== pageId) return false;
  if (mapViewId && scopedMapViewId !== mapViewId) return false;
  return true;
}

function normalizeRuntimeAttempt(
  value: unknown,
  index: number,
  pageId?: string,
  mapViewId?: string,
): NeuroMapReviewAttempt | null {
  if (!isRecord(value) || !matchesRuntimeScope(value, pageId, mapViewId)) return null;
  if (!NEURO_MAP_REVIEW_RATINGS.includes(value.rating as NeuroMapReviewAttempt['rating'])) return null;
  const scopedPageId = optionalString(value.pageId) ?? pageId;
  const scopedMapViewId = optionalString(value.mapViewId) ?? mapViewId;
  return {
    id: clean(value.id, `runtime-review-attempt-${index}`),
    cardId: clean(value.cardId),
    rating: value.rating as NeuroMapReviewAttempt['rating'],
    reviewedAt: clean(value.reviewedAt),
    attemptCount: positiveInteger(value.attemptCount),
    sessionId: optionalString(value.sessionId),
    cardType: normalizeReviewCardType(value.cardType),
    pageId: scopedPageId,
    mapViewId: scopedMapViewId,
    metadata: runtimeReviewMetadata(value.metadata, {
      source: 'runtime-review-attempt',
      pageId: scopedPageId,
      mapViewId: scopedMapViewId,
    }),
  };
}

function normalizeRuntimeSession(
  value: unknown,
  index: number,
  pageId?: string,
  mapViewId?: string,
): NeuroMapReviewSession | null {
  if (!isRecord(value) || !matchesRuntimeScope(value, pageId, mapViewId)) return null;
  const scopedPageId = optionalString(value.pageId) ?? pageId;
  const scopedMapViewId = optionalString(value.mapViewId) ?? mapViewId;
  return {
    id: clean(value.id, `runtime-review-session-${index}`),
    startedAt: optionalString(value.startedAt),
    completedAt: optionalString(value.completedAt),
    mode: value.mode === 'weak' || value.mode === 'next' ? value.mode : 'normal',
    filter: normalizeReviewFilter(value.filter) ?? 'all',
    reviewedCount: optionalNumber(value.reviewedCount),
    gotIt: optionalNumber(value.gotIt),
    almost: optionalNumber(value.almost),
    missed: optionalNumber(value.missed),
    cardIds: stringArray(value.cardIds),
    metadata: runtimeReviewMetadata(value.metadata, {
      source: 'runtime-review-session',
      pageId: scopedPageId,
      mapViewId: scopedMapViewId,
    }),
  };
}

export function listRuntimeMapViewsFromPageState(pageState: unknown): RuntimeMapViewRef[] {
  const workspace = workspaceFromPageState(pageState);
  const pages = Array.isArray(workspace.pages)
    ? workspace.pages
    : isMapLike(workspace)
      ? [{ id: DEFAULT_RUNTIME_MAP_VIEW_ID, title: 'Map view', map: workspace }]
      : [];
  const activeId = optionalString(workspace.activePageId) ?? clean(isRecord(pages[0]) ? pages[0].id : undefined);
  return pages.flatMap((page, index) => {
    if (!isRecord(page)) return [];
    const id = clean(page.id, `page-${index}`);
    return [
      {
        id,
        title: clean(page.title, `Map view ${index + 1}`),
        active: id === activeId,
        index,
        map: pageMapSource(page),
      },
    ];
  });
}

export function selectRuntimeMapViewFromPageState(
  pageState: unknown,
  mapViewId?: string,
): RuntimeMapViewRef | null {
  const views = listRuntimeMapViewsFromPageState(pageState);
  if (!views.length) return null;
  if (mapViewId) return views.find((view) => view.id === mapViewId) ?? null;
  return views.find((view) => view.active) ?? views[0];
}

export function normalizeRuntimeReviewState(input: NormalizeRuntimeReviewStateInput): NeuroMapReviewState | undefined {
  const review = isRecord(input.review) ? input.review : {};
  const attempts = Array.isArray(review.attempts)
    ? review.attempts.flatMap((attempt, index) =>
        normalizeRuntimeAttempt(attempt, index, input.pageId, input.mapViewId) ?? [],
      )
    : [];
  const sessions = Array.isArray(review.sessions)
    ? review.sessions.flatMap((session, index) =>
        normalizeRuntimeSession(session, index, input.pageId, input.mapViewId) ?? [],
      )
    : [];
  const cards = input.cards?.length ? [...input.cards] : undefined;
  if (!cards?.length && !attempts.length && !sessions.length && !isRecord(review.metadata) && !input.metadata) {
    return undefined;
  }
  return {
    cards,
    attempts: attempts.length ? attempts : undefined,
    sessions: sessions.length ? sessions : undefined,
    metadata: mergeRuntimeMetadata(input.metadata, {
      source: 'runtime-review-store',
      version: optionalNumber(review.version),
      pageId: input.pageId,
      mapViewId: input.mapViewId,
      reviewMetadata: metadata(review.metadata),
    }),
  };
}

export function buildPortableSnapshotFromRuntimePageState(
  input: BuildRuntimePortableSnapshotInput,
): NeuroMapSnapshot {
  const selectedView = selectRuntimeMapViewFromPageState(input.pageState, input.mapViewId);
  if (!selectedView) {
    throw new Error('Runtime page state does not contain a map view.');
  }
  const pageStateRecord = recordFromPageState(input.pageState);
  const data = dataFromPageState(input.pageState);
  const pageId = clean(input.pageId ?? pageStateRecord.pageId ?? input.page?.id);
  const projectId = optionalString(input.projectId ?? input.page?.projectId);
  const title = clean(input.title ?? selectedView.title, 'Untitled map');
  const reviewSource = isRecord(data) ? data.review : undefined;
  return buildPortableSnapshotFromMapState({
    id: [pageId, selectedView.id].filter(Boolean).join(':') || selectedView.id,
    title,
    projectId,
    pageId: optionalString(pageId),
    mapViewId: selectedView.id,
    map: selectedView.map,
    documents: input.documents ? [...input.documents] : undefined,
    review: normalizeRuntimeReviewState({
      review: reviewSource,
      pageId: optionalString(pageId),
      mapViewId: selectedView.id,
      cards: input.reviewCards,
    }),
    createdAt: optionalString(input.page?.createdAt ?? pageStateRecord.createdAt),
    updatedAt: optionalString(input.page?.updatedAt ?? pageStateRecord.updatedAt),
    metadata: runtimeMetadataForSnapshot(input.pageState, selectedView, input.metadata),
  });
}

export function buildPortableSnapshotsFromRuntimePageState(
  input: BuildRuntimePortableSnapshotInput,
): NeuroMapSnapshot[] {
  return listRuntimeMapViewsFromPageState(input.pageState).map((view) =>
    buildPortableSnapshotFromRuntimePageState({ ...input, mapViewId: view.id }),
  );
}

export function buildPortableBundleFromRuntimePageStates(
  input: BuildRuntimePortableBundleInput,
): NeuroMapImportExportBundle {
  const pagesById = new Map(
    (input.pages ?? []).flatMap((page) => {
      const id = clean(page.id);
      return id ? [[id, page] as const] : [];
    }),
  );
  const snapshots = input.pageStates.flatMap((pageState) => {
    const pageStateRecord = recordFromPageState(pageState);
    const pageId = clean(pageStateRecord.pageId);
    const page = pagesById.get(pageId);
    if (pageStateRecord.pageType && clean(pageStateRecord.pageType) !== 'map') return [];
    if (!listRuntimeMapViewsFromPageState(pageState).length) return [];
    return buildPortableSnapshotsFromRuntimePageState({
      pageState,
      page,
      pageId,
      projectId: optionalString(page?.projectId),
      documents: documentsForPage(input.documents, input.pageDocumentLinks, pageId),
    });
  });
  return {
    bundleVersion: NEURO_MAP_BUNDLE_VERSION,
    exportedAt: clean(input.exportedAt),
    snapshots,
    documents: input.documents?.length
      ? Array.from(
          new Map(
            input.documents.flatMap((document) => {
              const ref = documentRefFromSource(document);
              return ref ? [[ref.documentId, ref] as const] : [];
            }),
          ).values(),
        )
      : undefined,
    source: input.source,
    metadata: input.metadata,
  };
}

export function getRuntimePortableParitySummary(
  input: BuildRuntimePortableSnapshotInput,
): RuntimePortableParitySummary {
  const snapshot = buildPortableSnapshotFromRuntimePageState(input);
  const summary = getPortableSnapshotSummary(snapshot);
  const validation = validatePortableSnapshotShape(snapshot);
  const runtime = isRecord(snapshot.metadata?.runtime) ? snapshot.metadata.runtime : {};
  const droppedRelationshipIds = Array.isArray(runtime.droppedRelationshipIds)
    ? runtime.droppedRelationshipIds.map((value) => clean(value)).filter(Boolean)
    : [];
  return {
    ...summary,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    mapViewCount: listRuntimeMapViewsFromPageState(input.pageState).length,
    activeMapViewId: optionalString(runtime.activeMapViewId),
    droppedRelationshipIds,
    reviewSessionCount: snapshot.review?.sessions?.length ?? 0,
  };
}
