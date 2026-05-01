import type {
  NeuroMapBlockLayout,
  NeuroMapMetadata,
  NeuroMapRelationshipLayout,
} from './portableContract';
import { normalizePortableSnapshot, validatePortableSnapshotShape } from './portableSnapshot';

export interface AccessibleReaderGraphPreviewNode {
  id: string;
  label: string;
  node_type: string;
  description?: string | null;
  confidence: number;
  mention_count: number;
  document_count: number;
  status: 'confirmed';
  aliases: string[];
  source_document_ids: string[];
}

export interface AccessibleReaderGraphPreviewEdge {
  id: string;
  source_id: string;
  source_label: string;
  target_id: string;
  target_label: string;
  relation_type: string;
  provenance: 'manual';
  confidence: number;
  status: 'confirmed';
  evidence_count: number;
  source_document_ids: string[];
  excerpt?: string | null;
}

export interface AccessibleReaderGraphPreviewSnapshot {
  nodes: AccessibleReaderGraphPreviewNode[];
  edges: AccessibleReaderGraphPreviewEdge[];
  document_count: number;
  pending_nodes: number;
  pending_edges: number;
  confirmed_nodes: number;
  confirmed_edges: number;
}

export interface AccessibleReaderGraphPreview {
  graph: AccessibleReaderGraphPreviewSnapshot;
  layoutByBlockId: Record<string, NeuroMapBlockLayout>;
  relationshipMetadataById: Record<
    string,
    {
      sourceRelationshipId: string;
      label?: string;
      type: string;
      strength?: number;
      layout?: NeuroMapRelationshipLayout;
      metadata?: NeuroMapMetadata;
    }
  >;
  warnings: string[];
}

function unique(values: readonly (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function previewAccessibleReaderGraphFromSnapshot(input: unknown): AccessibleReaderGraphPreview {
  const snapshot = normalizePortableSnapshot(input);
  const validation = validatePortableSnapshotShape(snapshot);
  const blockById = new Map(snapshot.blocks.map((block) => [block.id, block]));
  const layoutByBlockId = Object.fromEntries(
    snapshot.blocks.map((block) => [block.id, block.layout]),
  );
  const nodes: AccessibleReaderGraphPreviewNode[] = snapshot.blocks.map((block) => {
    const sourceDocumentIds = unique([
      block.documentRef?.hostSourceDocumentId,
      block.documentRef?.documentId,
      ...(block.sourceRefs ?? []).map((ref) => ref.sourceDocumentId),
    ]);
    return {
      id: block.id,
      label: block.title,
      node_type: block.kind,
      description: block.body ?? null,
      confidence: 1,
      mention_count: 0,
      document_count: sourceDocumentIds.length,
      status: 'confirmed',
      aliases: [],
      source_document_ids: sourceDocumentIds,
    };
  });

  const relationshipMetadataById: AccessibleReaderGraphPreview['relationshipMetadataById'] = {};
  const edges = snapshot.relationships.flatMap((relationship) => {
    const source = blockById.get(relationship.sourceBlockId);
    const target = blockById.get(relationship.targetBlockId);
    relationshipMetadataById[relationship.id] = {
      sourceRelationshipId: relationship.id,
      label: relationship.label,
      type: relationship.type,
      strength: relationship.strength,
      layout: snapshot.layout.relationshipLayouts?.[relationship.id],
      metadata: relationship.metadata,
    };
    if (!source || !target) return [];
    const sourceDocumentIds = unique([
      ...(relationship.sourceRefs ?? []).map((ref) => ref.sourceDocumentId),
      source.documentRef?.hostSourceDocumentId,
      target.documentRef?.hostSourceDocumentId,
      source.documentRef?.documentId,
      target.documentRef?.documentId,
    ]);
    return [
      {
        id: relationship.id,
        source_id: relationship.sourceBlockId,
        source_label: source.title,
        target_id: relationship.targetBlockId,
        target_label: target.title,
        relation_type: relationship.type,
        provenance: 'manual' as const,
        confidence: 1,
        status: 'confirmed' as const,
        evidence_count: sourceDocumentIds.length,
        source_document_ids: sourceDocumentIds,
        excerpt: relationship.label ?? null,
      },
    ];
  });

  return {
    graph: {
      nodes,
      edges,
      document_count: new Set(nodes.flatMap((node) => node.source_document_ids)).size,
      pending_nodes: 0,
      pending_edges: 0,
      confirmed_nodes: nodes.length,
      confirmed_edges: edges.length,
    },
    layoutByBlockId,
    relationshipMetadataById,
    warnings: [...validation.errors, ...validation.warnings],
  };
}
