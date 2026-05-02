import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const helperUrl = pathToFileURL(resolve(root, 'public/prototypes/current/mindmapReviewHelpers.js')).href;

async function loadHelpers() {
  return import(`${helperUrl}?cache=${Date.now()}`);
}

const cards = [
  { id: 'card-missed', type: 'block', prompt: 'Missed', answer: 'Missed answer' },
  { id: 'card-almost', type: 'block', prompt: 'Almost', answer: 'Almost answer' },
  { id: 'card-got-it', type: 'block', prompt: 'Got it', answer: 'Got it answer' },
  { id: 'card-new', type: 'block', prompt: 'New', answer: 'New answer' },
];

const attempts = [
  {
    id: 'attempt-old-missed',
    cardId: 'card-missed',
    pageId: 'page-1',
    mapViewId: 'map-1',
    cardType: 'block',
    rating: 'almost',
    reviewedAt: '2026-01-01T09:00:00.000Z',
    attemptCount: 1,
  },
  {
    id: 'attempt-new-missed',
    cardId: 'card-missed',
    pageId: 'page-1',
    mapViewId: 'map-1',
    cardType: 'block',
    rating: 'missed',
    reviewedAt: '2026-01-02T09:00:00.000Z',
    attemptCount: 2,
  },
  {
    id: 'attempt-almost',
    cardId: 'card-almost',
    pageId: 'page-1',
    mapViewId: 'map-1',
    cardType: 'block',
    rating: 'almost',
    reviewedAt: '2026-01-01T08:00:00.000Z',
    attemptCount: 1,
  },
  {
    id: 'attempt-got-it',
    cardId: 'card-got-it',
    pageId: 'page-1',
    mapViewId: 'map-1',
    cardType: 'block',
    rating: 'got-it',
    reviewedAt: '2026-01-03T08:00:00.000Z',
    attemptCount: 1,
  },
];

const reviewFixture = {
  mapViewId: 'view-main',
  documents: [
    {
      id: 'doc-1',
      title: 'Simon Dixon debt-power interview/model',
      sourceLabel: 'Interview',
      description: 'Document description.',
    },
  ],
  nodes: [
    {
      id: 'core',
      title: 'Debt pressure',
      body: 'Debt pressure changes choices.',
      nodeType: 'concept',
    },
    {
      id: 'question',
      title: 'What changes choices?',
      body: 'Debt pressure changes choices.',
      nodeType: 'question',
    },
    {
      id: 'document',
      title: 'Local source title',
      body: 'Local source body.',
      nodeType: 'document',
      documentId: 'doc-1',
      tag: 'source',
    },
    {
      id: 'evidence',
      title: 'Evidence example',
      body: 'Observed support.',
      nodeType: 'evidence',
    },
  ],
  edges: [
    {
      id: 'edge-question',
      from: 'core',
      to: 'question',
      relation: 'causes',
      label: 'shapes choices',
      strength: 4,
    },
    {
      id: 'edge-document',
      from: 'document',
      to: 'core',
      relation: 'evidence',
      label: 'supports claim',
      strength: 3,
    },
    {
      id: 'edge-evidence',
      from: 'evidence',
      to: 'core',
      relation: 'evidence',
      label: 'example',
      strength: 2,
    },
  ],
};

test.describe('mindmap review helper extraction', () => {
  test('normalizes review stores with deterministic ids and current fallback behavior', async () => {
    const { normalizeReviewStore } = await loadHelpers();
    let idIndex = 0;

    const store = normalizeReviewStore(
      {
        attempts: [
          {
            cardId: 'card-1',
            cardType: 'source',
            rating: 'missed',
          },
          {
            id: 'attempt-valid',
            cardId: 'card-2',
            pageId: 'page-existing',
            mapViewId: 'map-existing',
            cardType: 'relationship',
            rating: 'almost',
            reviewedAt: '2026-01-03T09:00:00.000Z',
            attemptCount: 4,
          },
          {
            id: 'attempt-invalid',
            cardId: 'card-3',
            rating: 'easy',
          },
        ],
        sessions: [
          {
            cardIds: ['card-1', '', 'card-2'],
            mode: 'later',
            filter: 'source',
          },
        ],
      },
      {
        fallbackPageId: 'page-fallback',
        now: () => '2026-01-02T12:00:00.000Z',
        createId: (prefix: string) => `${prefix}-${(idIndex += 1)}`,
      },
    );

    expect(store).toEqual({
      version: 1,
      attempts: [
        {
          id: 'review-attempt-1',
          cardId: 'card-1',
          pageId: 'page-fallback',
          mapViewId: '',
          cardType: 'source',
          rating: 'missed',
          reviewedAt: '2026-01-02T12:00:00.000Z',
          attemptCount: 1,
        },
        {
          id: 'attempt-valid',
          cardId: 'card-2',
          pageId: 'page-existing',
          mapViewId: 'map-existing',
          cardType: 'relationship',
          rating: 'almost',
          reviewedAt: '2026-01-03T09:00:00.000Z',
          attemptCount: 4,
        },
      ],
      sessions: [
        {
          id: 'review-session-2',
          pageId: 'page-fallback',
          mapViewId: '',
          startedAt: '2026-01-02T12:00:00.000Z',
          completedAt: '',
          reviewedCount: 0,
          gotIt: 0,
          almost: 0,
          missed: 0,
          cardIds: ['card-1', 'card-2'],
          mode: 'normal',
          filter: 'source',
        },
      ],
    });
  });

  test('orders latest attempts, weak cards, and Review Next cards like the runtime', async () => {
    const { buildReviewNextCards, buildWeakReviewCards, latestReviewAttemptsByCard } = await loadHelpers();

    const latest = latestReviewAttemptsByCard(attempts, cards.map((card) => card.id));
    expect(latest.get('card-missed')?.id).toBe('attempt-new-missed');
    expect(latest.get('card-missed')?.rating).toBe('missed');

    expect(buildWeakReviewCards(cards, attempts).map((card: { id: string }) => card.id)).toEqual([
      'card-missed',
      'card-almost',
    ]);
    expect(buildReviewNextCards(cards, attempts).map((card: { id: string }) => card.id)).toEqual([
      'card-missed',
      'card-almost',
      'card-new',
    ]);
  });

  test('reports review stats and history text from cards attempts and sessions', async () => {
    const { reviewHistoryText, reviewStats } = await loadHelpers();
    const sessions = [
      {
        id: 'session-1',
        pageId: 'page-1',
        mapViewId: 'map-1',
        startedAt: '2026-01-01T07:00:00.000Z',
        completedAt: '2026-01-01T07:05:00.000Z',
        reviewedCount: 3,
        gotIt: 1,
        almost: 1,
        missed: 1,
        cardIds: ['card-missed', 'card-almost', 'card-got-it'],
        mode: 'next',
        filter: 'all',
      },
    ];

    const stats = reviewStats(cards, attempts, sessions);
    expect(stats.totalCards).toBe(4);
    expect(stats.reviewedCards).toBe(3);
    expect(stats.weakCards).toBe(2);
    expect(stats.missedCards).toBe(1);
    expect(stats.almostCards).toBe(1);
    expect(stats.unreviewedCards).toBe(1);
    expect(stats.priorityCards).toBe(3);
    expect(stats.lastAttempt?.id).toBe('attempt-got-it');
    expect(stats.lastSession?.id).toBe('session-1');
    expect(reviewHistoryText(cards, attempts, sessions)).toContain(
      '4 cards · 3 reviewed · 2 weak · 1 missed · 1 almost · 1 new. Last Review next: 3 reviewed, Got it 1, Almost 1, Missed 1.',
    );
  });

  test('generates block relationship neighbor and source review cards without DOM access', async () => {
    const { createMapReviewCards } = await loadHelpers();

    const generatedCards = createMapReviewCards(reviewFixture);
    const blockCard = generatedCards.find((card: { id: string }) => card.id === 'view-main:block:core');
    const questionCard = generatedCards.find((card: { id: string }) => card.id === 'view-main:block:question');
    const relationshipCard = generatedCards.find(
      (card: { id: string }) => card.id === 'view-main:relationship:edge-question',
    );
    const neighborCard = generatedCards.find((card: { id: string }) => card.id === 'view-main:neighbor:core');
    const sourceCard = generatedCards.find((card: { id: string }) => card.id === 'view-main:source:core');

    expect(blockCard).toMatchObject({
      type: 'block',
      prompt: 'Explain: Debt pressure',
      answer: 'Debt pressure changes choices.',
    });
    expect(questionCard).toMatchObject({
      type: 'block',
      prompt: 'What changes choices?',
      answer: 'Debt pressure changes choices.',
    });
    expect(relationshipCard).toMatchObject({
      type: 'relationship',
      prompt: 'What connects Debt pressure to What changes choices??',
      answer: expect.stringContaining('Label: shapes choices'),
    });
    expect(neighborCard).toMatchObject({
      type: 'neighbor',
      prompt: 'What is connected to Debt pressure, and why?',
      answer: expect.stringContaining('Simon Dixon debt-power interview/model'),
    });
    expect(sourceCard).toMatchObject({
      type: 'source',
      prompt: 'What source or evidence supports Debt pressure?',
      answer: expect.stringContaining('Connection: supports claim (evidence)'),
    });
    expect(sourceCard?.answer).toContain('Interview');
    expect(sourceCard?.preReveal.mask.nodeAllContent).toEqual(['document', 'evidence']);
  });

  test('normalizes review visual state with injected node and edge validators', async () => {
    const { normalizeReviewVisualState } = await loadHelpers();

    expect(
      normalizeReviewVisualState(
        {
          highlight: { nodes: ['core', 'missing', 'core'], edges: ['edge-1', 'missing-edge'] },
          mask: {
            nodeBodies: ['core', 'missing'],
            nodeAllContent: ['document', 'ghost'],
            edgeLabels: ['edge-1', 'ghost-edge'],
          },
        },
        {
          hasNode: (nodeId: string) => ['core', 'document'].includes(nodeId),
          hasEdge: (edgeId: string) => edgeId === 'edge-1',
        },
      ),
    ).toEqual({
      highlight: { nodes: ['core'], edges: ['edge-1'] },
      mask: { nodeBodies: ['core'], nodeAllContent: ['document'], edgeLabels: ['edge-1'] },
    });
  });
});
