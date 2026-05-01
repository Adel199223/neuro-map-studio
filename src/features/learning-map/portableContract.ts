import type {
  Importance,
  LearningNodeType,
  LinkRoute,
  NodeGroup,
  NodeShape,
  PortSide,
  RelationshipType,
  ViewState,
} from './types';

export const NEURO_MAP_SNAPSHOT_CONTRACT_VERSION = 'neuro-map-snapshot.v1' as const;
export const NEURO_MAP_BUNDLE_VERSION = 'neuro-map-bundle.v1' as const;

export const NEURO_MAP_BLOCK_KINDS = [
  'concept',
  'question',
  'evidence',
  'document',
] as const satisfies readonly LearningNodeType[];
export const NEURO_MAP_RELATIONSHIP_TYPES = [
  'causes',
  'funds',
  'controls',
  'benefits',
  'costs',
  'loop',
  'exit',
  'evidence',
  'contrast',
  'custom',
] as const satisfies readonly RelationshipType[];
export const NEURO_MAP_RELATIONSHIP_ROUTES = [
  'straight',
  'curve',
  'elbow',
  'arc',
] as const satisfies readonly LinkRoute[];
export const NEURO_MAP_PORT_SIDES = [
  'auto',
  'top',
  'right',
  'bottom',
  'left',
] as const satisfies readonly PortSide[];
export const NEURO_MAP_REVIEW_RATINGS = ['got-it', 'almost', 'missed'] as const;
export const NEURO_MAP_REVIEW_CARD_TYPES = [
  'block',
  'relationship',
  'neighbor',
  'source',
] as const;
export const NEURO_MAP_REVIEW_FILTERS = [
  'all',
  ...NEURO_MAP_REVIEW_CARD_TYPES,
] as const;

export type NeuroMapSnapshotContractVersion =
  typeof NEURO_MAP_SNAPSHOT_CONTRACT_VERSION;
export type NeuroMapBundleVersion = typeof NEURO_MAP_BUNDLE_VERSION;
export type NeuroMapMetadata = Record<string, unknown>;
export type NeuroMapBlockKind = LearningNodeType;
export type NeuroMapRelationshipType = RelationshipType;
export type NeuroMapRelationshipRoute = LinkRoute;
export type NeuroMapPortSide = PortSide;
export type NeuroMapReviewRating = (typeof NEURO_MAP_REVIEW_RATINGS)[number];
export type NeuroMapReviewCardType = (typeof NEURO_MAP_REVIEW_CARD_TYPES)[number];
export type NeuroMapReviewFilter = (typeof NEURO_MAP_REVIEW_FILTERS)[number];
export type AccessibleReaderStudyRatingPreview = 'forgot' | 'hard' | 'good';

export interface NeuroMapSourceRef {
  sourceDocumentId?: string;
  documentVariantId?: string;
  contentChunkId?: string;
  recallNoteId?: string;
  externalId?: string;
  label?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapDocumentRef {
  documentId: string;
  title: string;
  sourceLabel?: string;
  type?: string;
  urlOrPath?: string;
  tags?: string[];
  hostSourceDocumentId?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapBlockLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface NeuroMapBlockStyle {
  group?: NodeGroup;
  shape?: NodeShape;
  importance?: Importance;
  tag?: string;
}

export interface NeuroMapBlock {
  id: string;
  kind: NeuroMapBlockKind;
  title: string;
  body?: string;
  documentRef?: NeuroMapDocumentRef;
  style?: NeuroMapBlockStyle;
  layout: NeuroMapBlockLayout;
  sourceRefs?: NeuroMapSourceRef[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapRelationshipPorts {
  source?: NeuroMapPortSide;
  target?: NeuroMapPortSide;
}

export interface NeuroMapRelationship {
  id: string;
  sourceBlockId: string;
  targetBlockId: string;
  type: NeuroMapRelationshipType;
  label?: string;
  strength?: Importance;
  route?: NeuroMapRelationshipRoute;
  ports?: NeuroMapRelationshipPorts;
  sourceRefs?: NeuroMapSourceRef[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapRelationshipLayout {
  ports?: NeuroMapRelationshipPorts;
  route?: NeuroMapRelationshipRoute;
  label?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapLayoutState {
  view: ViewState;
  blockLayouts: Record<string, NeuroMapBlockLayout>;
  relationshipLayouts?: Record<string, NeuroMapRelationshipLayout>;
  viewportHints?: {
    width?: number;
    height?: number;
    density?: string;
    metadata?: NeuroMapMetadata;
  };
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapReviewCard {
  id: string;
  type: NeuroMapReviewCardType;
  prompt: string;
  answer: string;
  sourceBlockIds?: string[];
  sourceRelationshipIds?: string[];
  derivedAt?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapReviewAttempt {
  id: string;
  cardId: string;
  rating: NeuroMapReviewRating;
  reviewedAt: string;
  attemptCount?: number;
  sessionId?: string;
  cardType?: NeuroMapReviewCardType;
  pageId?: string;
  mapViewId?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapReviewSession {
  id: string;
  startedAt?: string;
  completedAt?: string;
  mode?: 'normal' | 'weak' | 'next';
  filter?: NeuroMapReviewFilter;
  reviewedCount?: number;
  gotIt?: number;
  almost?: number;
  missed?: number;
  cardIds?: string[];
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapReviewState {
  cards?: NeuroMapReviewCard[];
  attempts?: NeuroMapReviewAttempt[];
  sessions?: NeuroMapReviewSession[];
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapSnapshot {
  contractVersion: NeuroMapSnapshotContractVersion;
  id: string;
  title: string;
  projectId?: string;
  pageId?: string;
  mapViewId?: string;
  blocks: NeuroMapBlock[];
  relationships: NeuroMapRelationship[];
  layout: NeuroMapLayoutState;
  documents?: NeuroMapDocumentRef[];
  review?: NeuroMapReviewState;
  createdAt?: string;
  updatedAt?: string;
  metadata?: NeuroMapMetadata;
}

export interface NeuroMapImportExportBundle {
  bundleVersion: NeuroMapBundleVersion;
  exportedAt: string;
  snapshots: NeuroMapSnapshot[];
  documents?: NeuroMapDocumentRef[];
  source?: {
    app?: string;
    version?: string;
    exportedBy?: string;
    metadata?: NeuroMapMetadata;
  };
  warnings?: string[];
  metadata?: NeuroMapMetadata;
}
