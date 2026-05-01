import type {
  AccessibleReaderStudyRatingPreview,
  NeuroMapReviewAttempt,
  NeuroMapReviewCard,
  NeuroMapReviewCardType,
  NeuroMapReviewFilter,
  NeuroMapReviewRating,
} from './portableContract';
import { NEURO_MAP_REVIEW_CARD_TYPES, NEURO_MAP_REVIEW_FILTERS } from './portableContract';

export interface PortableReviewSummary {
  totalCards: number;
  reviewedCards: number;
  weakCards: number;
  missedCards: number;
  almostCards: number;
  newCards: number;
  unreviewedCards: number;
  priorityCards: number;
}

interface LatestAttemptEntry {
  attempt: NeuroMapReviewAttempt;
  attemptCount: number;
  time: number;
  order: number;
}

function parseTime(value: string | undefined): number {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function attemptCount(attempt: NeuroMapReviewAttempt): number {
  return Math.max(1, Number(attempt.attemptCount) || 1);
}

function normalizeFilter(filter: NeuroMapReviewFilter): NeuroMapReviewFilter {
  return NEURO_MAP_REVIEW_FILTERS.includes(filter) ? filter : 'all';
}

function latestAttemptEntriesByCard(
  attempts: readonly NeuroMapReviewAttempt[],
  cardIds: readonly string[] = [],
): Map<string, LatestAttemptEntry> {
  const validIds = new Set(cardIds);
  const latest = new Map<string, LatestAttemptEntry>();
  attempts.forEach((attempt, order) => {
    if (validIds.size && !validIds.has(attempt.cardId)) return;
    const entry: LatestAttemptEntry = {
      attempt,
      attemptCount: attemptCount(attempt),
      time: parseTime(attempt.reviewedAt),
      order,
    };
    const existing = latest.get(attempt.cardId);
    if (
      !existing ||
      entry.attemptCount > existing.attemptCount ||
      (entry.attemptCount === existing.attemptCount &&
        (entry.time > existing.time || (entry.time === existing.time && entry.order > existing.order)))
    ) {
      latest.set(attempt.cardId, entry);
    }
  });
  return latest;
}

export function latestPortableReviewAttemptsByCard(
  attempts: readonly NeuroMapReviewAttempt[],
  cardIds: readonly string[] = [],
): Map<string, NeuroMapReviewAttempt> {
  return new Map(
    Array.from(latestAttemptEntriesByCard(attempts, cardIds)).map(([cardId, entry]) => [
      cardId,
      entry.attempt,
    ]),
  );
}

export function filterPortableReviewCards(
  cards: readonly NeuroMapReviewCard[],
  filter: NeuroMapReviewFilter,
): NeuroMapReviewCard[] {
  const selected = normalizeFilter(filter);
  if (selected === 'all') return [...cards];
  return cards.filter((card) => card.type === selected);
}

export function buildPortableWeakQueue(
  cards: readonly NeuroMapReviewCard[],
  attempts: readonly NeuroMapReviewAttempt[],
): NeuroMapReviewCard[] {
  const cardIds = cards.map((card) => card.id);
  const latest = latestAttemptEntriesByCard(attempts, cardIds);
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority: Record<'missed' | 'almost', number> = { missed: 0, almost: 1 };
  return cards
    .filter((card) => {
      const rating = latest.get(card.id)?.attempt.rating;
      return rating === 'missed' || rating === 'almost';
    })
    .sort((a, b) => {
      const aEntry = latest.get(a.id);
      const bEntry = latest.get(b.id);
      if (!aEntry || !bEntry) return 0;
      const ratingDiff =
        priority[aEntry.attempt.rating as 'missed' | 'almost'] -
        priority[bEntry.attempt.rating as 'missed' | 'almost'];
      if (ratingDiff) return ratingDiff;
      const timeDiff = aEntry.time - bEntry.time;
      if (timeDiff) return timeDiff;
      return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
    });
}

export function buildPortableReviewNextQueue(
  cards: readonly NeuroMapReviewCard[],
  attempts: readonly NeuroMapReviewAttempt[],
): NeuroMapReviewCard[] {
  const cardIds = cards.map((card) => card.id);
  const latest = latestAttemptEntriesByCard(attempts, cardIds);
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority = { missed: 0, almost: 1, unreviewed: 2 } as const;
  function priorityMeta(card: NeuroMapReviewCard): { bucket: keyof typeof priority; time: number } | null {
    const entry = latest.get(card.id);
    if (entry?.attempt.rating === 'missed' || entry?.attempt.rating === 'almost') {
      return { bucket: entry.attempt.rating, time: entry.time };
    }
    if (!entry) return { bucket: 'unreviewed', time: 0 };
    return null;
  }
  return cards
    .map((card) => ({ card, meta: priorityMeta(card) }))
    .filter((item): item is { card: NeuroMapReviewCard; meta: { bucket: keyof typeof priority; time: number } } =>
      Boolean(item.meta),
    )
    .sort((a, b) => {
      const bucketDiff = priority[a.meta.bucket] - priority[b.meta.bucket];
      if (bucketDiff) return bucketDiff;
      if (a.meta.bucket !== 'unreviewed') {
        const timeDiff = a.meta.time - b.meta.time;
        if (timeDiff) return timeDiff;
      }
      return (order.get(a.card.id) ?? 0) - (order.get(b.card.id) ?? 0);
    })
    .map((item) => item.card);
}

export function getPortableReviewSummary(
  cards: readonly NeuroMapReviewCard[],
  attempts: readonly NeuroMapReviewAttempt[],
): PortableReviewSummary {
  const latest = latestPortableReviewAttemptsByCard(
    attempts,
    cards.map((card) => card.id),
  );
  const latestValues = Array.from(latest.values());
  const missedCards = latestValues.filter((attempt) => attempt.rating === 'missed').length;
  const almostCards = latestValues.filter((attempt) => attempt.rating === 'almost').length;
  const unreviewedCards = cards.filter((card) => !latest.has(card.id)).length;
  const weakCards = missedCards + almostCards;
  return {
    totalCards: cards.length,
    reviewedCards: latest.size,
    weakCards,
    missedCards,
    almostCards,
    newCards: unreviewedCards,
    unreviewedCards,
    priorityCards: weakCards + unreviewedCards,
  };
}

export function isPortableReviewCardType(value: string): value is NeuroMapReviewCardType {
  return NEURO_MAP_REVIEW_CARD_TYPES.includes(value as NeuroMapReviewCardType);
}

export function mapNeuroMapRatingToAccessibleReaderStudyRating(
  rating: NeuroMapReviewRating,
): AccessibleReaderStudyRatingPreview {
  if (rating === 'missed') return 'forgot';
  if (rating === 'almost') return 'hard';
  return 'good';
}
