import type {
  CompatibleImportPayload,
} from './workspaceCore';
import { normalizeMap } from './workspaceCore';
import type {
  NeuroMapBlock,
  NeuroMapBlockLayout,
  NeuroMapBlockStyle,
  NeuroMapDocumentRef,
  NeuroMapLayoutState,
  NeuroMapMetadata,
  NeuroMapRelationship,
  NeuroMapRelationshipLayout,
  NeuroMapRelationshipPorts,
  NeuroMapReviewAttempt,
  NeuroMapReviewCard,
  NeuroMapReviewCardType,
  NeuroMapReviewSession,
  NeuroMapReviewState,
  NeuroMapSnapshot,
  NeuroMapSourceRef,
} from './portableContract';
import {
  NEURO_MAP_BLOCK_KINDS,
  NEURO_MAP_PORT_SIDES,
  NEURO_MAP_RELATIONSHIP_ROUTES,
  NEURO_MAP_RELATIONSHIP_TYPES,
  NEURO_MAP_REVIEW_CARD_TYPES,
  NEURO_MAP_REVIEW_FILTERS,
  NEURO_MAP_REVIEW_RATINGS,
  NEURO_MAP_SNAPSHOT_CONTRACT_VERSION,
} from './portableContract';
import type {
  Importance,
  LearningMap,
  LearningNodeType,
  NodeGroup,
  NodeShape,
  RelationshipType,
  ViewState,
} from './types';

export interface PortableDocumentSource {
  id?: unknown;
  documentId?: unknown;
  title?: unknown;
  sourceLabel?: unknown;
  type?: unknown;
  url?: unknown;
  path?: unknown;
  urlOrPath?: unknown;
  tags?: unknown;
  hostSourceDocumentId?: unknown;
  metadata?: unknown;
}

export interface BuildPortableSnapshotInput {
  id?: string;
  title?: string;
  projectId?: string;
  pageId?: string;
  mapViewId?: string;
  map: CompatibleImportPayload;
  documents?: PortableDocumentSource[];
  review?: NeuroMapReviewState;
  createdAt?: string;
  updatedAt?: string;
  metadata?: NeuroMapMetadata;
}

export interface PortableSnapshotSummary {
  id: string;
  title: string;
  blockCount: number;
  relationshipCount: number;
  documentCount: number;
  reviewCardCount: number;
  reviewAttemptCount: number;
  mapViewId?: string;
}

export interface PortableSnapshotValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PortableRelationshipRef {
  relationshipId: string;
  sourceBlockId: string;
  targetBlockId: string;
  type: RelationshipType;
  label?: string;
}

const VALID_GROUPS = ['blue', 'green', 'amber', 'rose', 'violet'] as const satisfies readonly NodeGroup[];
const VALID_SHAPES = ['card', 'round', 'oval', 'pill', 'note'] as const satisfies readonly NodeShape[];

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

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function optionalPositiveInteger(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function metadata(value: unknown): NeuroMapMetadata | undefined {
  return isRecord(value) ? { ...value } : undefined;
}

function oneOf<T extends string | number>(value: unknown, valid: readonly T[], fallback: T): T {
  return valid.includes(value as T) ? (value as T) : fallback;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.map((item) => clean(item)).filter(Boolean);
  return values.length ? values : undefined;
}

function normalizeView(value: unknown): ViewState {
  const record = isRecord(value) ? value : {};
  return {
    x: finiteNumber(record.x, 0),
    y: finiteNumber(record.y, 0),
    scale: finiteNumber(record.scale, 1),
  };
}

function normalizeBlockLayout(value: unknown, fallback: Partial<NeuroMapBlockLayout> = {}): NeuroMapBlockLayout {
  const record = isRecord(value) ? value : {};
  return {
    x: finiteNumber(record.x, fallback.x ?? 0),
    y: finiteNumber(record.y, fallback.y ?? 0),
    w: finiteNumber(record.w, fallback.w ?? 268),
    h: finiteNumber(record.h, fallback.h ?? 145),
  };
}

function normalizeDocumentRef(value: unknown, fallback?: Partial<NeuroMapDocumentRef>): NeuroMapDocumentRef | undefined {
  const record = isRecord(value) ? value : {};
  const documentId = clean(record.documentId ?? record.id ?? fallback?.documentId);
  if (!documentId) return undefined;
  return {
    documentId,
    title: clean(record.title ?? fallback?.title, documentId),
    sourceLabel: optionalString(record.sourceLabel ?? fallback?.sourceLabel),
    type: optionalString(record.type ?? fallback?.type),
    urlOrPath: optionalString(record.urlOrPath ?? record.url ?? record.path ?? fallback?.urlOrPath),
    tags: stringArray(record.tags ?? fallback?.tags),
    hostSourceDocumentId: optionalString(record.hostSourceDocumentId ?? fallback?.hostSourceDocumentId),
    metadata: metadata(record.metadata ?? fallback?.metadata),
  };
}

function normalizeSourceRefs(value: unknown): NeuroMapSourceRef[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const refs = value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const ref: NeuroMapSourceRef = {
      sourceDocumentId: optionalString(item.sourceDocumentId),
      documentVariantId: optionalString(item.documentVariantId),
      contentChunkId: optionalString(item.contentChunkId),
      recallNoteId: optionalString(item.recallNoteId),
      externalId: optionalString(item.externalId),
      label: optionalString(item.label),
      metadata: metadata(item.metadata),
    };
    return Object.values(ref).some((entry) => entry !== undefined) ? [ref] : [];
  });
  return refs.length ? refs : undefined;
}

function normalizeBlockStyle(value: unknown, fallback?: Partial<NeuroMapBlockStyle>): NeuroMapBlockStyle | undefined {
  const record = isRecord(value) ? value : {};
  const style: NeuroMapBlockStyle = {
    group: oneOf(record.group ?? fallback?.group, VALID_GROUPS, 'blue'),
    shape: oneOf(record.shape ?? fallback?.shape, VALID_SHAPES, 'card'),
    importance: oneOf(record.importance ?? fallback?.importance, [1, 2, 3, 4, 5] as const, 3),
    tag: optionalString(record.tag ?? fallback?.tag),
  };
  return Object.values(style).some((entry) => entry !== undefined) ? style : undefined;
}

function normalizeBlock(value: unknown, index: number): NeuroMapBlock {
  const record = isRecord(value) ? value : {};
  const kind = oneOf(record.kind, NEURO_MAP_BLOCK_KINDS, 'concept');
  const directLayout = normalizeBlockLayout(record.layout, {
    x: optionalFiniteNumber(record.x) ?? index * 40,
    y: optionalFiniteNumber(record.y) ?? index * 40,
    w: optionalFiniteNumber(record.w) ?? 268,
    h: optionalFiniteNumber(record.h) ?? 145,
  });
  const documentRef = normalizeDocumentRef(record.documentRef, {
    documentId: optionalString(record.documentId),
    title: optionalString(record.title),
  });
  return {
    id: clean(record.id, `block-${index}`),
    kind,
    title: clean(record.title, 'Untitled block'),
    body: optionalString(record.body),
    documentRef,
    style: normalizeBlockStyle(record.style, {
      group: record.group as NodeGroup,
      shape: record.shape as NodeShape,
      importance: record.importance as Importance,
      tag: optionalString(record.tag),
    }),
    layout: directLayout,
    sourceRefs: normalizeSourceRefs(record.sourceRefs),
    createdAt: optionalString(record.createdAt),
    updatedAt: optionalString(record.updatedAt),
    metadata: metadata(record.metadata),
  };
}

function normalizePorts(value: unknown, fallback?: NeuroMapRelationshipPorts): NeuroMapRelationshipPorts | undefined {
  const record = isRecord(value) ? value : {};
  const ports: NeuroMapRelationshipPorts = {
    source: oneOf(record.source ?? fallback?.source, NEURO_MAP_PORT_SIDES, 'auto'),
    target: oneOf(record.target ?? fallback?.target, NEURO_MAP_PORT_SIDES, 'auto'),
  };
  return ports.source || ports.target ? ports : undefined;
}

function normalizeRelationship(value: unknown, index: number): NeuroMapRelationship {
  const record = isRecord(value) ? value : {};
  const fallbackPorts: NeuroMapRelationshipPorts = {
    source: oneOf(record.fromPort, NEURO_MAP_PORT_SIDES, 'auto'),
    target: oneOf(record.toPort, NEURO_MAP_PORT_SIDES, 'auto'),
  };
  return {
    id: clean(record.id, `relationship-${index}`),
    sourceBlockId: clean(record.sourceBlockId ?? record.from),
    targetBlockId: clean(record.targetBlockId ?? record.to),
    type: oneOf(record.type ?? record.relation, NEURO_MAP_RELATIONSHIP_TYPES, 'custom'),
    label: optionalString(record.label),
    strength: oneOf(record.strength, [1, 2, 3, 4, 5] as const, 3),
    route: oneOf(record.route ?? record.shape, NEURO_MAP_RELATIONSHIP_ROUTES, 'curve'),
    ports: normalizePorts(record.ports, fallbackPorts),
    sourceRefs: normalizeSourceRefs(record.sourceRefs),
    createdAt: optionalString(record.createdAt),
    updatedAt: optionalString(record.updatedAt),
    metadata: metadata(record.metadata),
  };
}

function normalizeReviewCard(value: unknown, index: number): NeuroMapReviewCard {
  const record = isRecord(value) ? value : {};
  return {
    id: clean(record.id, `review-card-${index}`),
    type: oneOf(record.type, NEURO_MAP_REVIEW_CARD_TYPES, 'block'),
    prompt: clean(record.prompt, 'Recall this map item.'),
    answer: clean(record.answer, ''),
    sourceBlockIds: stringArray(record.sourceBlockIds),
    sourceRelationshipIds: stringArray(record.sourceRelationshipIds),
    derivedAt: optionalString(record.derivedAt),
    metadata: metadata(record.metadata),
  };
}

function normalizeReviewAttempt(value: unknown, index: number): NeuroMapReviewAttempt | null {
  const record = isRecord(value) ? value : {};
  const rating = record.rating;
  if (!NEURO_MAP_REVIEW_RATINGS.includes(rating as NeuroMapReviewAttempt['rating'])) return null;
  const cardType = NEURO_MAP_REVIEW_CARD_TYPES.includes(record.cardType as NeuroMapReviewCardType)
    ? (record.cardType as NeuroMapReviewCardType)
    : undefined;
  return {
    id: clean(record.id, `review-attempt-${index}`),
    cardId: clean(record.cardId),
    rating: rating as NeuroMapReviewAttempt['rating'],
    reviewedAt: clean(record.reviewedAt),
    attemptCount: optionalPositiveInteger(record.attemptCount),
    sessionId: optionalString(record.sessionId),
    cardType,
    pageId: optionalString(record.pageId),
    mapViewId: optionalString(record.mapViewId),
    metadata: metadata(record.metadata),
  };
}

function normalizeReviewSession(value: unknown, index: number): NeuroMapReviewSession {
  const record = isRecord(value) ? value : {};
  return {
    id: clean(record.id, `review-session-${index}`),
    startedAt: optionalString(record.startedAt),
    completedAt: optionalString(record.completedAt),
    mode: oneOf(record.mode, ['normal', 'weak', 'next'] as const, 'normal'),
    filter: oneOf(record.filter, NEURO_MAP_REVIEW_FILTERS, 'all'),
    reviewedCount: optionalFiniteNumber(record.reviewedCount),
    gotIt: optionalFiniteNumber(record.gotIt),
    almost: optionalFiniteNumber(record.almost),
    missed: optionalFiniteNumber(record.missed),
    cardIds: stringArray(record.cardIds),
    metadata: metadata(record.metadata),
  };
}

function normalizeReviewState(value: unknown): NeuroMapReviewState | undefined {
  if (!isRecord(value)) return undefined;
  const cards = Array.isArray(value.cards) ? value.cards.map(normalizeReviewCard) : undefined;
  const attempts = Array.isArray(value.attempts)
    ? value.attempts.flatMap((attempt, index) => normalizeReviewAttempt(attempt, index) ?? [])
    : undefined;
  const sessions = Array.isArray(value.sessions) ? value.sessions.map(normalizeReviewSession) : undefined;
  if (!cards?.length && !attempts?.length && !sessions?.length && !isRecord(value.metadata)) return undefined;
  return {
    cards,
    attempts,
    sessions,
    metadata: metadata(value.metadata),
  };
}

function normalizeRelationshipLayout(
  value: unknown,
  relationship: NeuroMapRelationship,
): NeuroMapRelationshipLayout {
  const record = isRecord(value) ? value : {};
  return {
    ports: normalizePorts(record.ports, relationship.ports),
    route: oneOf(record.route ?? relationship.route, NEURO_MAP_RELATIONSHIP_ROUTES, relationship.route ?? 'curve'),
    label: optionalString(record.label ?? relationship.label),
    metadata: metadata(record.metadata),
  };
}

function normalizeLayoutState(
  value: unknown,
  blocks: NeuroMapBlock[],
  relationships: NeuroMapRelationship[],
): NeuroMapLayoutState {
  const record = isRecord(value) ? value : {};
  const blockLayoutsSource = isRecord(record.blockLayouts) ? record.blockLayouts : {};
  const blockLayouts: Record<string, NeuroMapBlockLayout> = {};
  blocks.forEach((block) => {
    blockLayouts[block.id] = normalizeBlockLayout(blockLayoutsSource[block.id], block.layout);
  });
  const relationshipLayoutsSource = isRecord(record.relationshipLayouts) ? record.relationshipLayouts : {};
  const relationshipLayouts = relationships.reduce<Record<string, NeuroMapRelationshipLayout>>((layouts, relationship) => {
    layouts[relationship.id] = normalizeRelationshipLayout(relationshipLayoutsSource[relationship.id], relationship);
    return layouts;
  }, {});
  const viewportHintsSource = isRecord(record.viewportHints) ? record.viewportHints : {};
  return {
    view: normalizeView(record.view),
    blockLayouts,
    relationshipLayouts: Object.keys(relationshipLayouts).length ? relationshipLayouts : undefined,
    viewportHints: isRecord(record.viewportHints)
      ? {
          width: optionalFiniteNumber(viewportHintsSource.width),
          height: optionalFiniteNumber(viewportHintsSource.height),
          density: optionalString(viewportHintsSource.density),
          metadata: metadata(viewportHintsSource.metadata),
        }
      : undefined,
    metadata: metadata(record.metadata),
  };
}

export function normalizePortableSnapshot(input: unknown): NeuroMapSnapshot {
  const record = isRecord(input) ? input : {};
  const blocks = Array.isArray(record.blocks) ? record.blocks.map(normalizeBlock) : [];
  const relationships = Array.isArray(record.relationships)
    ? record.relationships.map(normalizeRelationship)
    : [];
  const documents = Array.isArray(record.documents)
    ? record.documents.flatMap((document) => normalizeDocumentRef(document) ?? [])
    : undefined;
  return {
    contractVersion: NEURO_MAP_SNAPSHOT_CONTRACT_VERSION,
    id: clean(record.id, 'portable-map'),
    title: clean(record.title, 'Untitled map'),
    projectId: optionalString(record.projectId),
    pageId: optionalString(record.pageId),
    mapViewId: optionalString(record.mapViewId),
    blocks,
    relationships,
    layout: normalizeLayoutState(record.layout, blocks, relationships),
    documents,
    review: normalizeReviewState(record.review),
    createdAt: optionalString(record.createdAt),
    updatedAt: optionalString(record.updatedAt),
    metadata: metadata(record.metadata),
  };
}

function documentById(documents: readonly PortableDocumentSource[] = [], documentId?: string): NeuroMapDocumentRef | undefined {
  if (!documentId) return undefined;
  const match = documents.find((document) => clean(document.documentId ?? document.id) === documentId);
  return normalizeDocumentRef(match, { documentId, title: documentId });
}

function blockFromNode(node: LearningMap['nodes'][number], documents: readonly PortableDocumentSource[]): NeuroMapBlock {
  const kind: LearningNodeType = node.nodeType ?? (node.documentId ? 'document' : 'concept');
  const documentRef =
    kind === 'document'
      ? documentById(documents, node.documentId) ??
        normalizeDocumentRef({ documentId: node.documentId, title: node.title })
      : undefined;
  return {
    id: node.id,
    kind,
    title: node.title,
    body: node.body || undefined,
    documentRef,
    style: {
      group: node.group,
      shape: node.shape,
      importance: node.importance,
      tag: node.tag,
    },
    layout: { x: node.x, y: node.y, w: node.w, h: node.h },
  };
}

function relationshipFromEdge(edge: LearningMap['edges'][number]): NeuroMapRelationship {
  return {
    id: edge.id,
    sourceBlockId: edge.from,
    targetBlockId: edge.to,
    type: edge.relation,
    label: edge.label || undefined,
    strength: edge.strength,
    route: edge.shape,
    ports: {
      source: edge.fromPort ?? 'auto',
      target: edge.toPort ?? 'auto',
    },
  };
}

export function buildPortableSnapshotFromMapState(input: BuildPortableSnapshotInput): NeuroMapSnapshot {
  const map = normalizeMap(input.map);
  const mapViewId = clean(input.mapViewId, 'page-main');
  const pageId = optionalString(input.pageId);
  const blocks = map.nodes.map((node) => blockFromNode(node, input.documents ?? []));
  const relationships = map.edges.map(relationshipFromEdge);
  const documentRefs = [
    ...(input.documents ?? []).flatMap((document) => normalizeDocumentRef(document) ?? []),
    ...blocks.flatMap((block) => block.documentRef ?? []),
  ];
  const dedupedDocuments = Array.from(
    new Map(documentRefs.map((document) => [document.documentId, document])).values(),
  );
  return normalizePortableSnapshot({
    contractVersion: NEURO_MAP_SNAPSHOT_CONTRACT_VERSION,
    id: input.id ?? ([pageId, mapViewId].filter(Boolean).join(':') || mapViewId),
    title: input.title ?? 'Untitled map',
    projectId: input.projectId,
    pageId,
    mapViewId,
    blocks,
    relationships,
    layout: {
      view: map.view,
      blockLayouts: Object.fromEntries(blocks.map((block) => [block.id, block.layout])),
      relationshipLayouts: Object.fromEntries(
        relationships.map((relationship) => [
          relationship.id,
          {
            ports: relationship.ports,
            route: relationship.route,
            label: relationship.label,
          },
        ]),
      ),
    },
    documents: dedupedDocuments.length ? dedupedDocuments : undefined,
    review: input.review,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    metadata: input.metadata,
  });
}

export function validatePortableSnapshotShape(input: unknown): PortableSnapshotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['Snapshot must be an object.'], warnings };
  }
  if (input.contractVersion !== NEURO_MAP_SNAPSHOT_CONTRACT_VERSION) {
    errors.push(`Unsupported contractVersion: ${String(input.contractVersion ?? 'missing')}.`);
  }
  if (!clean(input.id)) errors.push('Snapshot is missing id.');
  if (!clean(input.title)) warnings.push('Snapshot title is blank.');
  if (!Array.isArray(input.blocks)) errors.push('Snapshot blocks must be an array.');
  if (!Array.isArray(input.relationships)) errors.push('Snapshot relationships must be an array.');

  const blockIds = new Set<string>();
  if (Array.isArray(input.blocks)) {
    input.blocks.forEach((block, index) => {
      const record = isRecord(block) ? block : {};
      const id = clean(record.id);
      if (!id) errors.push(`Block at index ${index} is missing id.`);
      else blockIds.add(id);
      if (!isRecord(record.layout)) errors.push(`Block ${id || index} is missing layout.`);
      const kind = record.kind;
      if (kind === 'document' && !isRecord(record.documentRef)) {
        errors.push(`Document block ${id || index} is missing documentRef.`);
      }
      if (kind === 'document' && isRecord(record.documentRef) && !clean(record.documentRef.documentId)) {
        errors.push(`Document block ${id || index} has an invalid documentRef.`);
      }
    });
  }

  if (Array.isArray(input.relationships)) {
    input.relationships.forEach((relationship, index) => {
      const record = isRecord(relationship) ? relationship : {};
      const id = clean(record.id);
      const sourceBlockId = clean(record.sourceBlockId);
      const targetBlockId = clean(record.targetBlockId);
      if (!id) errors.push(`Relationship at index ${index} is missing id.`);
      if (!sourceBlockId) errors.push(`Relationship ${id || index} is missing sourceBlockId.`);
      if (!targetBlockId) errors.push(`Relationship ${id || index} is missing targetBlockId.`);
      if (sourceBlockId && !blockIds.has(sourceBlockId)) {
        errors.push(`Relationship ${id || index} references missing source block ${sourceBlockId}.`);
      }
      if (targetBlockId && !blockIds.has(targetBlockId)) {
        errors.push(`Relationship ${id || index} references missing target block ${targetBlockId}.`);
      }
    });
  }

  const runtimeMetadata = isRecord(input.metadata) && isRecord(input.metadata.runtime)
    ? input.metadata.runtime
    : {};
  if (Array.isArray(runtimeMetadata.droppedRelationshipIds) && runtimeMetadata.droppedRelationshipIds.length) {
    const ids = runtimeMetadata.droppedRelationshipIds.map((id) => clean(id)).filter(Boolean);
    if (ids.length) {
      warnings.push(`Runtime normalization dropped relationship(s) with invalid endpoints: ${ids.join(', ')}.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function listPortableDocumentRefs(input: unknown): NeuroMapDocumentRef[] {
  const snapshot = normalizePortableSnapshot(input);
  const refs = [...(snapshot.documents ?? []), ...snapshot.blocks.flatMap((block) => block.documentRef ?? [])];
  return Array.from(new Map(refs.map((document) => [document.documentId, document])).values());
}

export function listPortableRelationshipRefs(input: unknown): PortableRelationshipRef[] {
  const snapshot = normalizePortableSnapshot(input);
  const blockIds = new Set(snapshot.blocks.map((block) => block.id));
  return snapshot.relationships.flatMap((relationship) => {
    if (!blockIds.has(relationship.sourceBlockId) || !blockIds.has(relationship.targetBlockId)) return [];
    return [
      {
        relationshipId: relationship.id,
        sourceBlockId: relationship.sourceBlockId,
        targetBlockId: relationship.targetBlockId,
        type: relationship.type,
        label: relationship.label,
      },
    ];
  });
}

export function getPortableSnapshotSummary(input: unknown): PortableSnapshotSummary {
  const snapshot = normalizePortableSnapshot(input);
  return {
    id: snapshot.id,
    title: snapshot.title,
    blockCount: snapshot.blocks.length,
    relationshipCount: snapshot.relationships.length,
    documentCount: listPortableDocumentRefs(snapshot).length,
    reviewCardCount: snapshot.review?.cards?.length ?? 0,
    reviewAttemptCount: snapshot.review?.attempts?.length ?? 0,
    mapViewId: snapshot.mapViewId,
  };
}
