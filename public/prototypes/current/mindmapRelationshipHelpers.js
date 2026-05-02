import { edgeShapes, nodeTypes, ports } from './mindmapConstants.js';
import { clamp } from './mindmapGeometry.js';

export function isSelfRelationship(from, to) {
  return Boolean(from && to && from === to);
}

export function findDirectedRelationship(edges = [], from, to, excludeEdgeId = '') {
  return edges.find((edge) => edge.id !== excludeEdgeId && edge.from === from && edge.to === to) || null;
}

export function createRelationshipDraft(from, to, options = {}) {
  const createId = typeof options.createId === 'function' ? options.createId : () => options.id || '';
  return {
    id: String(options.id || createId()),
    from,
    to,
    relation: options.relation || 'causes',
    strength: options.strength || 3,
    shape: options.shape || 'curve',
    fromPort: options.fromPort || 'auto',
    toPort: options.toPort || 'auto',
    label: options.label || '',
  };
}

export function reverseRelationship(edge) {
  return {
    ...edge,
    from: edge.to,
    to: edge.from,
    fromPort: edge.toPort || 'auto',
    toPort: edge.fromPort || 'auto',
  };
}

export function changeRelationshipEndpoint(edge, mode, targetNodeId) {
  if (mode === 'change-source') {
    return {
      ...edge,
      from: targetNodeId,
      fromPort: 'auto',
    };
  }
  return {
    ...edge,
    to: targetNodeId,
    toPort: 'auto',
  };
}

export function patchRelationshipRelation(edge, relation) {
  return { ...edge, relation };
}

export function patchRelationshipStrength(edge, strength) {
  return { ...edge, strength: clamp(Number(strength), 1, 5) };
}

export function patchRelationshipShape(edge, shape) {
  return { ...edge, shape };
}

export function patchRelationshipPort(edge, end, port) {
  if (!ports.includes(port)) return { ...edge };
  return end === 'from' ? { ...edge, fromPort: port } : { ...edge, toPort: port };
}

export function buildSplitRelationshipEdge(original, from, to, options = {}) {
  const createId = typeof options.createId === 'function' ? options.createId : () => options.id || '';
  return {
    id: String(options.id || createId()),
    from,
    to,
    relation: original.relation || 'causes',
    strength: Number(original.strength) || 3,
    shape: edgeShapes.includes(original.shape) ? original.shape : 'curve',
    fromPort: 'auto',
    toPort: 'auto',
    label: String(original.label || ''),
  };
}

export function buildRelationshipInsertNode(template, placement, options = {}) {
  const createId = typeof options.createId === 'function' ? options.createId : () => options.id || '';
  const nodeType = nodeTypes.includes(template.nodeType) ? template.nodeType : 'concept';
  return {
    id: String(options.id || createId()),
    title: template.title || 'New block',
    body: template.body || 'Rewrite this in your own words.',
    group: template.group || 'blue',
    shape: template.shape || 'card',
    importance: Number(template.importance) || 2,
    x: Math.round(placement.x),
    y: Math.round(placement.y),
    w: template.w || 268,
    h: template.h || 145,
    tag: String(template.tag || (nodeType === 'document' ? 'document' : 'custom')),
    nodeType,
    documentId: nodeType === 'document' ? String(template.documentId || '') : '',
  };
}

export function buildInsertBetweenRelationshipPayload({ originalEdge, template, placement, createNodeId, createEdgeId }) {
  const node = buildRelationshipInsertNode(template, placement, { createId: createNodeId });
  return {
    node,
    firstEdge: buildSplitRelationshipEdge(originalEdge, originalEdge.from, node.id, { createId: createEdgeId }),
    secondEdge: buildSplitRelationshipEdge(originalEdge, node.id, originalEdge.to, { createId: createEdgeId }),
  };
}

export function relationshipReviewCleanupCardIds(mapViewId, edgeId) {
  return [`${mapViewId}:relationship:${edgeId}`];
}
