const documentBodyFallback = 'Add a note about why this document matters here.';

export function findDocumentById(documents = [], documentId = '') {
  return documents.find((documentRecord) => documentRecord?.id === documentId) || null;
}

export function hasProjectDocuments(documents = []) {
  return Array.isArray(documents) && documents.length > 0;
}

export function documentTitle(documentRecord, fallback = '') {
  return String(documentRecord?.title || fallback);
}

export function documentTypeLabel(documentRecord, fallback = 'source') {
  return String(documentRecord?.type || fallback).toUpperCase();
}

export function documentSourceLabel(documentRecord, fallback = 'Project document') {
  return String(documentRecord?.sourceLabel || fallback);
}

export function documentDescription(documentRecord, fallback = 'Project document') {
  return String(documentRecord?.description || fallback);
}

export function documentMetaLine(documentRecord) {
  return `${documentTypeLabel(documentRecord)} · ${documentSourceLabel(documentRecord)}`;
}

export function documentUsageLabel(count = 0) {
  const safeCount = Math.max(0, Number(count) || 0);
  if (!safeCount) return 'Not on this map yet';
  return safeCount === 1 ? 'Referenced on this map' : `Referenced on this map (${safeCount})`;
}

export function buildDocumentPickerItems(documents = []) {
  return documents.map((documentRecord) => ({
    id: documentRecord.id,
    title: documentTitle(documentRecord),
    typeLabel: documentTypeLabel(documentRecord),
    sourceLabel: documentSourceLabel(documentRecord),
    meta: documentMetaLine(documentRecord),
    description: documentDescription(documentRecord, 'Project document'),
  }));
}

function documentUsageCount(usageCounts, documentId) {
  if (!usageCounts || !documentId) return 0;
  if (usageCounts instanceof Map) return Number(usageCounts.get(documentId)) || 0;
  return Number(usageCounts[documentId]) || 0;
}

export function buildWorkbenchDocumentItems(documents = [], usageCounts = {}) {
  return documents.map((documentRecord) => ({
    id: documentRecord.id,
    title: documentTitle(documentRecord),
    typeLabel: documentTypeLabel(documentRecord),
    sourceLabel: documentSourceLabel(documentRecord),
    meta: documentMetaLine(documentRecord),
    summary: documentDescription(documentRecord, documentSourceLabel(documentRecord)),
    usageCount: documentUsageCount(usageCounts, documentRecord.id),
    usageLabel: documentUsageLabel(documentUsageCount(usageCounts, documentRecord.id)),
  }));
}

export function projectDocumentCountLabel(count) {
  const safeCount = Number(count) || 0;
  return `${safeCount} project ${safeCount === 1 ? 'document' : 'documents'} available.`;
}

export function buildDocumentBlockTemplate(documentRecord, size = {}) {
  return {
    title: documentTitle(documentRecord),
    body: documentDescription(documentRecord, documentBodyFallback),
    group: 'violet',
    shape: 'note',
    tag: String(documentRecord?.type || 'source'),
    nodeType: 'document',
    documentId: String(documentRecord?.id || ''),
    w: size.w,
    h: size.h,
  };
}

export function buildDocumentNodeOptions(documentRecord, options = {}) {
  return {
    ...buildDocumentBlockTemplate(documentRecord, { w: options.w, h: options.h }),
    linkFrom: options.linkFrom || '',
    relation: options.relation || 'causes',
    fromPort: options.fromPort || 'auto',
    toPort: options.toPort || 'auto',
    historyLabel: options.historyLabel || 'Added document block',
    toast: options.toast || 'Document block added',
    focus: options.focus !== false,
  };
}

export function buildDocumentPlacementPending(documentRecord, size = {}) {
  return {
    kind: 'document',
    label: 'document block',
    previewTitle: documentTitle(documentRecord, 'Document block'),
    w: size.w,
    h: size.h,
    documentId: String(documentRecord?.id || ''),
    toast: 'Document block added',
  };
}

export function buildRelationshipDocumentInsertTemplate(documentRecord, size = {}) {
  return buildDocumentBlockTemplate(documentRecord, size);
}

export function buildDocumentDetailView(documentRecord) {
  const tags = Array.isArray(documentRecord?.tags) ? documentRecord.tags : [];
  const tagSuffix = tags.length ? ` · ${tags.join(', ')}` : '';
  return {
    title: documentTitle(documentRecord),
    typeLabel: documentTypeLabel(documentRecord),
    sourceLabel: documentSourceLabel(documentRecord),
    meta: `${documentTypeLabel(documentRecord)} · ${documentSourceLabel(documentRecord)}${tagSuffix}`,
    description: documentDescription(documentRecord, 'No description yet.'),
    tags,
  };
}

export function isDocumentNode(node) {
  return node?.nodeType === 'document';
}

export function extractDocumentRefsFromNodes(nodes = []) {
  return nodes
    .filter((node) => isDocumentNode(node) && node.documentId)
    .map((node) => ({
      nodeId: node.id,
      documentId: String(node.documentId),
      title: String(node.title || ''),
      tag: String(node.tag || ''),
    }));
}
