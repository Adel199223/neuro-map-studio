import { expect, test } from '@playwright/test';
import {
  previewAccessibleReaderGraphFromSnapshot,
} from '../../src/features/learning-map/portableAdapters';
import {
  buildPortableSnapshotFromMapState,
  getPortableSnapshotSummary,
  listPortableDocumentRefs,
  listPortableRelationshipRefs,
  normalizePortableSnapshot,
  validatePortableSnapshotShape,
} from '../../src/features/learning-map/portableSnapshot';
import {
  buildPortableReviewNextQueue,
  buildPortableWeakQueue,
  filterPortableReviewCards,
  getPortableReviewSummary,
  latestPortableReviewAttemptsByCard,
  mapNeuroMapRatingToAccessibleReaderStudyRating,
} from '../../src/features/learning-map/portableReview';
import {
  portableDocuments,
  portableMapState,
  portableReviewAttempts,
  portableReviewCards,
  portableSnapshot,
  portableSnapshotWithInvalidRelationship,
} from '../fixtures/learning-map/portableFixtures';

test.describe('learning-map portable contract helpers', () => {
  test('snapshot normalization preserves ids layout relationship metadata ports document refs and unknown metadata', () => {
    const normalized = normalizePortableSnapshot(portableSnapshot);

    expect(normalized.id).toBe('map-page:page-main');
    expect(normalized.blocks.find((block) => block.id === 'concept-core')?.layout).toEqual({
      x: 0,
      y: 0,
      w: 280,
      h: 150,
    });
    expect(normalized.blocks.find((block) => block.id === 'document-block')?.documentRef?.documentId).toBe(
      'doc-central-bank',
    );
    expect(normalized.relationships.find((relationship) => relationship.id === 'rel-core-question')).toMatchObject({
      label: 'raises',
      type: 'causes',
      route: 'curve',
      ports: { source: 'right', target: 'left' },
      metadata: { unknownRelationshipField: 'preserved' },
    });
    expect(normalized.metadata).toEqual({ unknownSnapshotField: 'preserved' });
    expect(normalized.review?.metadata).toEqual({ unknownReviewField: 'preserved' });
  });

  test('missing optional fields normalize without invented timestamps', () => {
    const normalized = normalizePortableSnapshot({
      id: 'minimal',
      title: 'Minimal map',
      blocks: [
        {
          id: 'block-1',
          kind: 'concept',
          title: 'Only block',
          layout: { x: 1, y: 2, w: 200, h: 120 },
        },
      ],
      relationships: [],
      layout: { view: { x: 0, y: 0, scale: 1 }, blockLayouts: {} },
      review: {
        attempts: [
          {
            id: 'missing-count',
            cardId: 'card-without-count',
            rating: 'got-it',
            reviewedAt: '2026-01-05T10:00:00.000Z',
          },
          {
            id: 'valid-count',
            cardId: 'card-with-count',
            rating: 'almost',
            reviewedAt: '2026-01-05T10:05:00.000Z',
            attemptCount: '2',
          },
        ],
      },
    });

    expect(normalized.createdAt).toBeUndefined();
    expect(normalized.updatedAt).toBeUndefined();
    expect(normalized.blocks[0].createdAt).toBeUndefined();
    expect(normalized.review?.attempts?.find((attempt) => attempt.id === 'missing-count')?.attemptCount)
      .toBeUndefined();
    expect(normalized.review?.attempts?.find((attempt) => attempt.id === 'valid-count')?.attemptCount).toBe(2);
  });

  test('invalid relationship endpoints are reported and excluded from valid relationship refs', () => {
    const validation = validatePortableSnapshotShape(portableSnapshotWithInvalidRelationship);
    const relationshipRefs = listPortableRelationshipRefs(portableSnapshotWithInvalidRelationship);

    expect(validation.valid).toBe(false);
    expect(validation.errors.join('\n')).toContain('missing target block missing-block');
    expect(relationshipRefs.map((ref) => ref.relationshipId)).toEqual([
      'rel-core-question',
      'rel-evidence-core',
    ]);
  });

  test('map-state builder wraps normalized maps and lists document refs', () => {
    const snapshot = buildPortableSnapshotFromMapState({
      pageId: 'map-page',
      mapViewId: 'page-main',
      title: 'Built from map state',
      map: portableMapState,
      documents: portableDocuments,
      review: { cards: portableReviewCards, attempts: portableReviewAttempts },
    });
    const summary = getPortableSnapshotSummary(snapshot);

    expect(summary).toMatchObject({
      id: 'map-page:page-main',
      title: 'Built from map state',
      blockCount: 4,
      relationshipCount: 3,
      documentCount: 1,
      reviewCardCount: 4,
      reviewAttemptCount: 4,
    });
    expect(listPortableDocumentRefs(snapshot).map((document) => document.documentId)).toEqual([
      'doc-central-bank',
    ]);
    expect(snapshot.relationships.find((relationship) => relationship.id === 'rel-core-question')?.ports).toEqual({
      source: 'right',
      target: 'left',
    });
  });

  test('review summary counts total reviewed weak missed almost and new cards', () => {
    expect(getPortableReviewSummary(portableReviewCards, portableReviewAttempts)).toEqual({
      totalCards: 4,
      reviewedCards: 3,
      weakCards: 2,
      missedCards: 1,
      almostCards: 1,
      newCards: 1,
      unreviewedCards: 1,
      priorityCards: 3,
    });
  });

  test('Review next orders Missed Almost then unreviewed and excludes latest got-it', () => {
    const queue = buildPortableReviewNextQueue(portableReviewCards, portableReviewAttempts);

    expect(queue.map((card) => card.id)).toEqual([
      'page-main:block:concept-core',
      'page-main:relationship:rel-core-question',
      'page-main:source:concept-core',
    ]);
  });

  test('latest got-it graduates a weak card', () => {
    const weakQueue = buildPortableWeakQueue(portableReviewCards, portableReviewAttempts);

    expect(weakQueue.map((card) => card.id)).not.toContain('page-main:neighbor:concept-core');
    expect(weakQueue.map((card) => card.id)).toEqual([
      'page-main:block:concept-core',
      'page-main:relationship:rel-core-question',
    ]);
  });

  test('card-type filters work for all block relationship neighbor and source', () => {
    expect(filterPortableReviewCards(portableReviewCards, 'all')).toHaveLength(4);
    expect(filterPortableReviewCards(portableReviewCards, 'block').map((card) => card.type)).toEqual(['block']);
    expect(filterPortableReviewCards(portableReviewCards, 'relationship').map((card) => card.type)).toEqual([
      'relationship',
    ]);
    expect(filterPortableReviewCards(portableReviewCards, 'neighbor').map((card) => card.type)).toEqual(['neighbor']);
    expect(filterPortableReviewCards(portableReviewCards, 'source').map((card) => card.type)).toEqual(['source']);
  });

  test('latest attempt selection uses attempt count then timestamp then input order', () => {
    const latest = latestPortableReviewAttemptsByCard([
      {
        id: 'first',
        cardId: 'tie-card',
        rating: 'missed',
        reviewedAt: '2026-01-01T00:00:00.000Z',
        attemptCount: 1,
      },
      {
        id: 'higher-count',
        cardId: 'tie-card',
        rating: 'almost',
        reviewedAt: '2026-01-01T00:00:00.000Z',
        attemptCount: 2,
      },
      {
        id: 'same-count-later-time',
        cardId: 'tie-card',
        rating: 'got-it',
        reviewedAt: '2026-01-02T00:00:00.000Z',
        attemptCount: 2,
      },
      {
        id: 'same-count-same-time-later-order',
        cardId: 'tie-card',
        rating: 'missed',
        reviewedAt: '2026-01-02T00:00:00.000Z',
        attemptCount: 2,
      },
    ]);

    expect(latest.get('tie-card')?.id).toBe('same-count-same-time-later-order');
  });

  test('rating preview mapping never infers Accessible Reader easy', () => {
    const mapped = [
      mapNeuroMapRatingToAccessibleReaderStudyRating('missed'),
      mapNeuroMapRatingToAccessibleReaderStudyRating('almost'),
      mapNeuroMapRatingToAccessibleReaderStudyRating('got-it'),
    ];

    expect(mapped).toEqual(['forgot', 'hard', 'good']);
    expect(mapped).not.toContain('easy');
  });

  test('adapter preview keeps layout separate from graph semantics', () => {
    const preview = previewAccessibleReaderGraphFromSnapshot(portableSnapshot);

    expect(preview.graph.nodes[0]).toMatchObject({
      id: 'concept-core',
      label: 'Debt creates leverage',
      status: 'confirmed',
    });
    expect(preview.graph.nodes[0]).not.toHaveProperty('provenance');
    expect(preview.graph.edges[0]).toMatchObject({
      id: 'rel-core-question',
      provenance: 'manual',
      status: 'confirmed',
      relation_type: 'causes',
    });
    expect(preview.layoutByBlockId['concept-core']).toEqual({ x: 0, y: 0, w: 280, h: 150 });
    expect(preview.graph.nodes[0]).not.toHaveProperty('layout');
    expect(preview.relationshipMetadataById['rel-core-question']).toMatchObject({
      label: 'raises',
      type: 'causes',
      layout: { ports: { source: 'right', target: 'left' }, route: 'curve', label: 'raises' },
    });
  });
});
