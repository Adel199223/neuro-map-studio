import { expect, test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const helperUrl = pathToFileURL(resolve(root, 'public/prototypes/current/mindmapDocumentHelpers.js')).href;

async function loadHelpers() {
  return import(`${helperUrl}?cache=${Date.now()}`);
}

const documentRecords = [
  {
    id: 'doc-1',
    title: 'Debt power interview',
    type: 'interview',
    sourceLabel: 'Podcast',
    description: 'Interview notes about debt cycles.',
    tags: ['debt', 'macro'],
  },
  {
    id: 'doc-2',
    title: '',
    type: '',
    sourceLabel: '',
    description: '',
    tags: [],
  },
];

test.describe('mindmap document helper extraction', () => {
  test('finds documents by id and formats safe document labels', async () => {
    const {
      documentDescription,
      documentMetaLine,
      documentSourceLabel,
      documentTitle,
      documentTypeLabel,
      documentUsageLabel,
      findDocumentById,
      hasProjectDocuments,
    } = await loadHelpers();

    expect(findDocumentById(documentRecords, 'doc-1')).toBe(documentRecords[0]);
    expect(findDocumentById(documentRecords, 'missing')).toBeNull();
    expect(findDocumentById([], 'doc-1')).toBeNull();
    expect(hasProjectDocuments(documentRecords)).toBe(true);
    expect(hasProjectDocuments([])).toBe(false);

    expect(documentTitle(documentRecords[0], 'Fallback title')).toBe('Debt power interview');
    expect(documentTitle(documentRecords[1], 'Fallback title')).toBe('Fallback title');
    expect(documentTypeLabel(documentRecords[0])).toBe('INTERVIEW');
    expect(documentTypeLabel(documentRecords[1])).toBe('SOURCE');
    expect(documentSourceLabel(documentRecords[0])).toBe('Podcast');
    expect(documentSourceLabel(documentRecords[1])).toBe('Project document');
    expect(documentDescription(documentRecords[0], 'Project document')).toBe('Interview notes about debt cycles.');
    expect(documentDescription(documentRecords[1], 'Project document')).toBe('Project document');
    expect(documentMetaLine(documentRecords[0])).toBe('INTERVIEW · Podcast');
    expect(documentMetaLine(documentRecords[1])).toBe('SOURCE · Project document');
    expect(documentUsageLabel(0)).toBe('Not on this map yet');
    expect(documentUsageLabel(1)).toBe('Referenced on this map');
    expect(documentUsageLabel(3)).toBe('Referenced on this map (3)');
  });

  test('builds picker and workbench descriptors without mutating document records', async () => {
    const { buildDocumentPickerItems, buildWorkbenchDocumentItems, projectDocumentCountLabel } = await loadHelpers();
    const before = JSON.stringify(documentRecords);

    expect(buildDocumentPickerItems(documentRecords)).toEqual([
      {
        id: 'doc-1',
        title: 'Debt power interview',
        typeLabel: 'INTERVIEW',
        sourceLabel: 'Podcast',
        meta: 'INTERVIEW · Podcast',
        description: 'Interview notes about debt cycles.',
      },
      {
        id: 'doc-2',
        title: '',
        typeLabel: 'SOURCE',
        sourceLabel: 'Project document',
        meta: 'SOURCE · Project document',
        description: 'Project document',
      },
    ]);

    expect(buildWorkbenchDocumentItems(documentRecords, { 'doc-1': 2 })).toEqual([
      {
        id: 'doc-1',
        title: 'Debt power interview',
        typeLabel: 'INTERVIEW',
        sourceLabel: 'Podcast',
        meta: 'INTERVIEW · Podcast',
        summary: 'Interview notes about debt cycles.',
        usageCount: 2,
        usageLabel: 'Referenced on this map (2)',
      },
      {
        id: 'doc-2',
        title: '',
        typeLabel: 'SOURCE',
        sourceLabel: 'Project document',
        meta: 'SOURCE · Project document',
        summary: 'Project document',
        usageCount: 0,
        usageLabel: 'Not on this map yet',
      },
    ]);

    expect(projectDocumentCountLabel(0)).toBe('0 project documents available.');
    expect(projectDocumentCountLabel(1)).toBe('1 project document available.');
    expect(projectDocumentCountLabel(2)).toBe('2 project documents available.');
    expect(JSON.stringify(documentRecords)).toBe(before);
  });

  test('builds document block templates and node options with documentId preserved', async () => {
    const {
      buildDocumentBlockTemplate,
      buildDocumentNodeOptions,
      buildDocumentPlacementPending,
      buildRelationshipDocumentInsertTemplate,
    } = await loadHelpers();
    const documentRecord = documentRecords[0];
    const before = JSON.stringify(documentRecord);

    expect(buildDocumentBlockTemplate(documentRecord, { w: 320, h: 180 })).toEqual({
      title: 'Debt power interview',
      body: 'Interview notes about debt cycles.',
      group: 'violet',
      shape: 'note',
      tag: 'interview',
      nodeType: 'document',
      documentId: 'doc-1',
      w: 320,
      h: 180,
    });

    expect(
      buildDocumentNodeOptions(documentRecord, {
        w: 320,
        h: 180,
        linkFrom: 'source-node',
        relation: 'evidence',
        fromPort: 'right',
        toPort: 'left',
        historyLabel: 'Linked document added',
        toast: 'Linked document added. Ctrl+Z to undo.',
        focus: false,
      }),
    ).toEqual({
      title: 'Debt power interview',
      body: 'Interview notes about debt cycles.',
      group: 'violet',
      shape: 'note',
      tag: 'interview',
      w: 320,
      h: 180,
      nodeType: 'document',
      documentId: 'doc-1',
      linkFrom: 'source-node',
      relation: 'evidence',
      fromPort: 'right',
      toPort: 'left',
      historyLabel: 'Linked document added',
      toast: 'Linked document added. Ctrl+Z to undo.',
      focus: false,
    });

    expect(buildDocumentPlacementPending(documentRecord, { w: 245, h: 176 })).toEqual({
      kind: 'document',
      label: 'document block',
      previewTitle: 'Debt power interview',
      w: 245,
      h: 176,
      documentId: 'doc-1',
      toast: 'Document block added',
    });

    expect(buildRelationshipDocumentInsertTemplate(documentRecord, { w: 300, h: 170 })).toMatchObject({
      nodeType: 'document',
      documentId: 'doc-1',
      w: 300,
      h: 170,
    });
    expect(JSON.stringify(documentRecord)).toBe(before);
  });

  test('builds document detail view and extracts document refs from nodes', async () => {
    const { buildDocumentDetailView, extractDocumentRefsFromNodes, isDocumentNode } = await loadHelpers();
    const nodes = [
      {
        id: 'doc-node',
        title: 'Local source title',
        tag: 'source',
        nodeType: 'document',
        documentId: 'doc-1',
      },
      {
        id: 'ghost-doc',
        title: 'Missing document ref',
        tag: 'source',
        nodeType: 'document',
        documentId: '',
      },
      {
        id: 'concept',
        title: 'Concept',
        tag: 'concept',
        nodeType: 'concept',
        documentId: 'doc-2',
      },
    ];
    const before = JSON.stringify(nodes);

    expect(buildDocumentDetailView(documentRecords[0])).toEqual({
      title: 'Debt power interview',
      typeLabel: 'INTERVIEW',
      sourceLabel: 'Podcast',
      meta: 'INTERVIEW · Podcast · debt, macro',
      description: 'Interview notes about debt cycles.',
      tags: ['debt', 'macro'],
    });
    expect(buildDocumentDetailView(documentRecords[1])).toEqual({
      title: '',
      typeLabel: 'SOURCE',
      sourceLabel: 'Project document',
      meta: 'SOURCE · Project document',
      description: 'No description yet.',
      tags: [],
    });

    expect(isDocumentNode(nodes[0])).toBe(true);
    expect(isDocumentNode(nodes[2])).toBe(false);
    expect(extractDocumentRefsFromNodes(nodes)).toEqual([
      {
        nodeId: 'doc-node',
        documentId: 'doc-1',
        title: 'Local source title',
        tag: 'source',
      },
    ]);
    expect(JSON.stringify(nodes)).toBe(before);
  });
});
