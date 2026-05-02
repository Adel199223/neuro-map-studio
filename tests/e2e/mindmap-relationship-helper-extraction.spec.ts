import { expect, test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const helperUrl = pathToFileURL(resolve(root, 'public/prototypes/current/mindmapRelationshipHelpers.js')).href;

async function loadHelpers() {
  return import(`${helperUrl}?cache=${Date.now()}`);
}

const baseEdge = {
  id: 'edge-a-b',
  from: 'node-a',
  to: 'node-b',
  relation: 'supports',
  strength: 4,
  shape: 'straight',
  fromPort: 'right',
  toPort: 'left',
  label: 'supports claim',
  custom: 'keep-me',
};

test.describe('mindmap relationship helper extraction', () => {
  test('detects self-links and same-direction duplicate relationships only', async () => {
    const { findDirectedRelationship, isSelfRelationship } = await loadHelpers();
    const edges = [
      baseEdge,
      { ...baseEdge, id: 'edge-b-a', from: 'node-b', to: 'node-a' },
    ];

    expect(isSelfRelationship('node-a', 'node-a')).toBe(true);
    expect(isSelfRelationship('node-a', 'node-b')).toBe(false);
    expect(findDirectedRelationship(edges, 'node-a', 'node-b')?.id).toBe('edge-a-b');
    expect(findDirectedRelationship(edges, 'node-a', 'node-b', 'edge-a-b')).toBeNull();
    expect(findDirectedRelationship([baseEdge], 'node-b', 'node-a')).toBeNull();
  });

  test('creates relationship drafts with current runtime defaults', async () => {
    const { createRelationshipDraft } = await loadHelpers();

    expect(createRelationshipDraft('node-a', 'node-b', { createId: () => 'edge-new' })).toEqual({
      id: 'edge-new',
      from: 'node-a',
      to: 'node-b',
      relation: 'causes',
      strength: 3,
      shape: 'curve',
      fromPort: 'auto',
      toPort: 'auto',
      label: '',
    });

    expect(
      createRelationshipDraft('node-a', 'node-b', {
        id: 'edge-custom',
        relation: 'evidence',
        strength: 5,
        shape: 'straight',
        fromPort: 'bottom',
        toPort: 'top',
        label: 'evidence for',
      }),
    ).toMatchObject({
      id: 'edge-custom',
      relation: 'evidence',
      strength: 5,
      shape: 'straight',
      fromPort: 'bottom',
      toPort: 'top',
      label: 'evidence for',
    });
  });

  test('reverses relationships without mutating the source edge', async () => {
    const { reverseRelationship } = await loadHelpers();
    const before = JSON.stringify(baseEdge);

    expect(reverseRelationship(baseEdge)).toEqual({
      ...baseEdge,
      from: 'node-b',
      to: 'node-a',
      fromPort: 'left',
      toPort: 'right',
    });
    expect(JSON.stringify(baseEdge)).toBe(before);

    expect(reverseRelationship({ ...baseEdge, fromPort: '', toPort: '' })).toMatchObject({
      from: 'node-b',
      to: 'node-a',
      fromPort: 'auto',
      toPort: 'auto',
    });
  });

  test('changes endpoints while preserving relationship metadata and resetting the changed port', async () => {
    const { changeRelationshipEndpoint } = await loadHelpers();
    const before = JSON.stringify(baseEdge);

    expect(changeRelationshipEndpoint(baseEdge, 'change-source', 'node-c')).toEqual({
      ...baseEdge,
      from: 'node-c',
      fromPort: 'auto',
    });
    expect(changeRelationshipEndpoint(baseEdge, 'change-target', 'node-c')).toEqual({
      ...baseEdge,
      to: 'node-c',
      toPort: 'auto',
    });
    expect(JSON.stringify(baseEdge)).toBe(before);
  });

  test('patches relationship metadata while preserving unrelated fields', async () => {
    const {
      patchRelationshipPort,
      patchRelationshipRelation,
      patchRelationshipShape,
      patchRelationshipStrength,
    } = await loadHelpers();

    expect(patchRelationshipRelation(baseEdge, 'blocks')).toEqual({ ...baseEdge, relation: 'blocks' });
    expect(patchRelationshipStrength(baseEdge, 9)).toEqual({ ...baseEdge, strength: 5 });
    expect(patchRelationshipStrength(baseEdge, 0)).toEqual({ ...baseEdge, strength: 1 });
    expect(patchRelationshipShape(baseEdge, 'arc')).toEqual({ ...baseEdge, shape: 'arc' });
    expect(patchRelationshipPort(baseEdge, 'from', 'bottom')).toEqual({ ...baseEdge, fromPort: 'bottom' });
    expect(patchRelationshipPort(baseEdge, 'target', 'top')).toEqual({ ...baseEdge, toPort: 'top' });
    expect(patchRelationshipPort(baseEdge, 'from', 'diagonal')).toEqual(baseEdge);
  });

  test('builds split and insert-between payloads without mutating source data', async () => {
    const { buildInsertBetweenRelationshipPayload, buildRelationshipInsertNode, buildSplitRelationshipEdge } =
      await loadHelpers();
    const template = {
      title: 'Inserted idea',
      body: 'Inserted body',
      group: 'green',
      shape: 'oval',
      importance: 3,
      nodeType: 'concept',
      tag: 'bridge',
      w: 300,
      h: 160,
    };
    const before = JSON.stringify({ baseEdge, template });
    let edgeId = 0;

    expect(buildSplitRelationshipEdge(baseEdge, 'node-a', 'node-c', { createId: () => 'edge-split' })).toEqual({
      id: 'edge-split',
      from: 'node-a',
      to: 'node-c',
      relation: 'supports',
      strength: 4,
      shape: 'straight',
      fromPort: 'auto',
      toPort: 'auto',
      label: 'supports claim',
    });

    expect(buildRelationshipInsertNode(template, { x: 12.4, y: 25.6 }, { createId: () => 'node-c' })).toEqual({
      id: 'node-c',
      title: 'Inserted idea',
      body: 'Inserted body',
      group: 'green',
      shape: 'oval',
      importance: 3,
      x: 12,
      y: 26,
      w: 300,
      h: 160,
      tag: 'bridge',
      nodeType: 'concept',
      documentId: '',
    });

    const payload = buildInsertBetweenRelationshipPayload({
      originalEdge: baseEdge,
      template,
      placement: { x: 100, y: 200 },
      createNodeId: () => 'node-c',
      createEdgeId: () => `edge-split-${(edgeId += 1)}`,
    });

    expect(payload).toEqual({
      node: {
        id: 'node-c',
        title: 'Inserted idea',
        body: 'Inserted body',
        group: 'green',
        shape: 'oval',
        importance: 3,
        x: 100,
        y: 200,
        w: 300,
        h: 160,
        tag: 'bridge',
        nodeType: 'concept',
        documentId: '',
      },
      firstEdge: {
        id: 'edge-split-1',
        from: 'node-a',
        to: 'node-c',
        relation: 'supports',
        strength: 4,
        shape: 'straight',
        fromPort: 'auto',
        toPort: 'auto',
        label: 'supports claim',
      },
      secondEdge: {
        id: 'edge-split-2',
        from: 'node-c',
        to: 'node-b',
        relation: 'supports',
        strength: 4,
        shape: 'straight',
        fromPort: 'auto',
        toPort: 'auto',
        label: 'supports claim',
      },
    });
    expect(JSON.stringify({ baseEdge, template })).toBe(before);
  });

  test('reports relationship review cleanup card ids for the original relationship', async () => {
    const { relationshipReviewCleanupCardIds } = await loadHelpers();

    expect(relationshipReviewCleanupCardIds('map-main', 'edge-a-b')).toEqual(['map-main:relationship:edge-a-b']);
  });
});
