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

export function buildDocumentPickerItems(documents = []) {
  return documents.map((documentRecord) => ({
    id: documentRecord.id,
    title: documentTitle(documentRecord),
    typeLabel: documentTypeLabel(documentRecord),
    description: documentDescription(documentRecord, 'Project document'),
  }));
}

export function buildWorkbenchDocumentItems(documents = []) {
  return documents.map((documentRecord) => ({
    id: documentRecord.id,
    title: documentTitle(documentRecord),
    typeLabel: documentTypeLabel(documentRecord),
    summary: documentDescription(documentRecord, documentSourceLabel(documentRecord)),
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
    meta: `${documentTypeLabel(documentRecord)} · ${documentSourceLabel(documentRecord)}${tagSuffix}`,
    description: documentDescription(documentRecord, 'No description yet.'),
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
