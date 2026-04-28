import { DEFAULT_MAP_VIEW_ID, SEED_MAP_PAGE_ID, cloneDefaultMap } from './map-defaults.js';

const REVIEW_RATINGS = new Set(['got-it', 'almost', 'missed']);
const REVIEW_SESSION_MODES = new Set(['normal', 'weak', 'next']);
const REVIEW_FILTERS = new Set(['all', 'block', 'relationship', 'neighbor', 'source']);

const RELATION_STYLES = {
  causes: { label: 'causes' },
  funds: { label: 'funds' },
  controls: { label: 'controls' },
  benefits: { label: 'benefits' },
  costs: { label: 'costs' },
  loop: { label: 'loop' },
  exit: { label: 'exit' },
  evidence: { label: 'evidence' },
  contrast: { label: 'contrast' },
};

function clean(value, fallback = '') {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text || fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseTime(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
}

function nodeById(map, id) {
  return (map?.nodes || []).find((node) => node.id === id) || null;
}

function relationLabel(edge) {
  const style = RELATION_STYLES[edge?.relation] || RELATION_STYLES.causes;
  const label = clean(edge?.label || '');
  if (label && label !== style.label) return `${label} (${style.label})`;
  return style.label;
}

function documentById(documents, documentId) {
  return (documents || []).find((document) => document.id === documentId) || null;
}

function nodeTitle(node, documents = []) {
  if (!node) return 'this block';
  const documentRecord = node.nodeType === 'document' ? documentById(documents, node.documentId) : null;
  return clean(documentRecord?.title || node.title || 'Untitled block', 'this block');
}

function nodeBody(node, documents = []) {
  if (!node) return '';
  const documentRecord = node.nodeType === 'document' ? documentById(documents, node.documentId) : null;
  return clean(node.body || documentRecord?.description || '');
}

function looksLikeQuestionText(value) {
  return /[?？]\s*$/.test(clean(value));
}

function questionReviewPayload(title, body) {
  const cleanTitle = clean(title);
  const cleanBody = clean(body);
  if (!cleanTitle || !cleanBody) return null;
  if (looksLikeQuestionText(cleanTitle)) {
    if (cleanBody.toLowerCase() !== cleanTitle.toLowerCase() && !looksLikeQuestionText(cleanBody)) {
      return { prompt: cleanTitle, answer: cleanBody };
    }
    return null;
  }
  if (looksLikeQuestionText(cleanBody)) return null;
  return { prompt: `Answer from memory: ${cleanTitle}`, answer: cleanBody };
}

function connectionsForNode(map, nodeId) {
  return (map?.edges || []).flatMap((edge) => {
    if (edge.from !== nodeId && edge.to !== nodeId) return [];
    const other = nodeById(map, edge.from === nodeId ? edge.to : edge.from);
    if (!other) return [];
    return [{ edge, other }];
  });
}

function isSupportBlock(node) {
  if (!node) return false;
  const type = clean(node.nodeType || '').toLowerCase();
  const tag = clean(node.tag || '').toLowerCase();
  return type === 'document' || type === 'evidence' || tag === 'document' || tag === 'source' || tag === 'evidence';
}

function mapWorkspaceFromState(page, pageState) {
  const data = pageState?.data;
  if (data?.kind === 'map-workspace' && Array.isArray(data.workspace?.pages)) return clone(data.workspace);
  if (Array.isArray(data?.workspace?.pages)) return clone(data.workspace);
  if (Array.isArray(data?.pages)) return clone(data);
  if (data?.kind === 'seeded-debt-power-map' || page?.id === SEED_MAP_PAGE_ID) {
    return {
      version: 19,
      activePageId: DEFAULT_MAP_VIEW_ID,
      pages: [
        {
          id: DEFAULT_MAP_VIEW_ID,
          title: page?.title || 'Debt-power map',
          map: cloneDefaultMap(),
        },
      ],
    };
  }
  return null;
}

export function activeMapReviewContext(page, pageState) {
  const workspace = mapWorkspaceFromState(page, pageState);
  if (!workspace?.pages?.length) {
    return {
      map: null,
      mapViewId: DEFAULT_MAP_VIEW_ID,
      mapViewTitle: page?.title || 'Untitled map',
    };
  }
  const activePage =
    workspace.pages.find((item) => item.id === workspace.activePageId) ||
    workspace.pages[0];
  return {
    map: activePage?.map || null,
    mapViewId: String(activePage?.id || workspace.activePageId || DEFAULT_MAP_VIEW_ID),
    mapViewTitle: activePage?.title || page?.title || 'Untitled map',
  };
}

export function normalizeReviewStore(value = {}) {
  const attempts = Array.isArray(value?.attempts)
    ? value.attempts.flatMap((attempt) => {
        if (!attempt || typeof attempt !== 'object') return [];
        const rating = REVIEW_RATINGS.has(attempt.rating) ? attempt.rating : '';
        if (!rating) return [];
        return [
          {
            id: String(attempt.id || ''),
            cardId: String(attempt.cardId || ''),
            pageId: String(attempt.pageId || ''),
            mapViewId: String(attempt.mapViewId || ''),
            cardType: String(attempt.cardType || 'block'),
            rating,
            reviewedAt: String(attempt.reviewedAt || ''),
            attemptCount: Math.max(1, Number(attempt.attemptCount) || 1),
          },
        ];
      })
    : [];
  const sessions = Array.isArray(value?.sessions)
    ? value.sessions.flatMap((session) => {
        if (!session || typeof session !== 'object') return [];
        return [
          {
            id: String(session.id || ''),
            pageId: String(session.pageId || ''),
            mapViewId: String(session.mapViewId || ''),
            startedAt: String(session.startedAt || ''),
            completedAt: String(session.completedAt || ''),
            reviewedCount: Math.max(0, Number(session.reviewedCount) || 0),
            gotIt: Math.max(0, Number(session.gotIt) || 0),
            almost: Math.max(0, Number(session.almost) || 0),
            missed: Math.max(0, Number(session.missed) || 0),
            cardIds: Array.isArray(session.cardIds) ? session.cardIds.map(String).filter(Boolean) : [],
            mode: REVIEW_SESSION_MODES.has(session.mode) ? session.mode : 'normal',
            filter: REVIEW_FILTERS.has(session.filter) ? session.filter : 'all',
          },
        ];
      })
    : [];
  return { version: 1, attempts, sessions };
}

export function generateReviewCardDescriptors({ map, mapViewId = DEFAULT_MAP_VIEW_ID, documents = [] } = {}) {
  if (!map || !Array.isArray(map.nodes) || !Array.isArray(map.edges)) return [];
  const cards = [];
  const addCard = (card) => {
    if (card?.id && card?.type && !cards.some((item) => item.id === card.id)) cards.push(card);
  };

  map.nodes.forEach((node) => {
    const title = nodeTitle(node, documents);
    const body = nodeBody(node, documents);
    if (!clean(title) || !body) return;
    const nodeType = clean(node.nodeType || 'concept').toLowerCase();
    if (nodeType === 'question' && !questionReviewPayload(title, body)) return;
    addCard({ id: `${mapViewId}:block:${node.id}`, type: 'block', title });
  });

  map.edges.forEach((edge) => {
    const from = nodeById(map, edge.from);
    const to = nodeById(map, edge.to);
    if (!from || !to) return;
    addCard({
      id: `${mapViewId}:relationship:${edge.id}`,
      type: 'relationship',
      title: `${nodeTitle(from, documents)} to ${nodeTitle(to, documents)}`,
      cue: relationLabel(edge),
    });
  });

  map.nodes.forEach((node) => {
    const connections = connectionsForNode(map, node.id);
    if (connections.length < 2) return;
    addCard({ id: `${mapViewId}:neighbor:${node.id}`, type: 'neighbor', title: nodeTitle(node, documents) });
  });

  const supportByTarget = new Map();
  const supportSeen = new Set();
  function addSupportCandidate(support, target, edge) {
    if (!support || !target || !edge || support.id === target.id) return;
    const key = `${target.id}:${support.id}:${edge.id}`;
    if (supportSeen.has(key)) return;
    supportSeen.add(key);
    if (!supportByTarget.has(target.id)) supportByTarget.set(target.id, { target, supports: [] });
    supportByTarget.get(target.id).supports.push({ support, edge });
  }
  map.edges.forEach((edge) => {
    const from = nodeById(map, edge.from);
    const to = nodeById(map, edge.to);
    if (!from || !to) return;
    if (isSupportBlock(from) || edge.relation === 'evidence') addSupportCandidate(from, to, edge);
    if (isSupportBlock(to)) addSupportCandidate(to, from, edge);
  });
  supportByTarget.forEach(({ target, supports }) => {
    if (!supports.length) return;
    addCard({
      id: `${mapViewId}:source:${target.id}`,
      type: 'source',
      title: nodeTitle(target, documents),
      supportCount: supports.length,
    });
  });

  return cards;
}

export function latestAttemptsByCard(attempts = [], cardIds = []) {
  const validIds = new Set(cardIds);
  const latest = new Map();
  attempts.forEach((attempt, order) => {
    if (validIds.size && !validIds.has(attempt.cardId)) return;
    const time = parseTime(attempt.reviewedAt);
    const existing = latest.get(attempt.cardId);
    if (!existing || time > existing.__time || (time === existing.__time && order > existing.__order)) {
      latest.set(attempt.cardId, { ...attempt, __time: time, __order: order });
    }
  });
  return latest;
}

export function buildWeakQueue(cards = [], latestAttempts = new Map()) {
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority = { missed: 0, almost: 1 };
  return cards
    .filter((card) => {
      const attempt = latestAttempts.get(card.id);
      return attempt?.rating === 'missed' || attempt?.rating === 'almost';
    })
    .sort((a, b) => {
      const aAttempt = latestAttempts.get(a.id);
      const bAttempt = latestAttempts.get(b.id);
      const ratingDiff = priority[aAttempt.rating] - priority[bAttempt.rating];
      if (ratingDiff) return ratingDiff;
      const timeDiff = parseTime(aAttempt.reviewedAt) - parseTime(bAttempt.reviewedAt);
      if (timeDiff) return timeDiff;
      return (order.get(a.id) || 0) - (order.get(b.id) || 0);
    });
}

export function buildReviewNextQueue(cards = [], latestAttempts = new Map()) {
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority = { missed: 0, almost: 1, unreviewed: 2 };
  const priorityMeta = (card) => {
    const attempt = latestAttempts.get(card.id);
    if (attempt?.rating === 'missed' || attempt?.rating === 'almost') {
      return { bucket: attempt.rating, time: parseTime(attempt.reviewedAt) };
    }
    if (!attempt) return { bucket: 'unreviewed', time: 0 };
    return null;
  };
  return cards
    .map((card) => ({ card, meta: priorityMeta(card) }))
    .filter((item) => item.meta)
    .sort((a, b) => {
      const bucketDiff = priority[a.meta.bucket] - priority[b.meta.bucket];
      if (bucketDiff) return bucketDiff;
      if (a.meta.bucket !== 'unreviewed') {
        const timeDiff = a.meta.time - b.meta.time;
        if (timeDiff) return timeDiff;
      }
      return (order.get(a.card.id) || 0) - (order.get(b.card.id) || 0);
    })
    .map((item) => item.card);
}

export function lastReviewedLabel(summary) {
  if (!summary?.lastReviewedAt) return 'Not reviewed yet';
  const date = new Date(summary.lastReviewedAt);
  if (Number.isNaN(date.getTime())) return 'Not reviewed yet';
  return `Last reviewed ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function summarizeMapReviewPage({ page, pageState, documents = [] } = {}) {
  const { map, mapViewId, mapViewTitle } = activeMapReviewContext(page, pageState);
  const cards = generateReviewCardDescriptors({ map, mapViewId, documents });
  const cardIds = cards.map((card) => card.id);
  const review = normalizeReviewStore(pageState?.data?.review);
  const attempts = review.attempts.filter(
    (attempt) => attempt.pageId === page?.id && attempt.mapViewId === mapViewId && cardIds.includes(attempt.cardId),
  );
  const sessions = review.sessions.filter((session) => session.pageId === page?.id && session.mapViewId === mapViewId);
  const latest = latestAttemptsByCard(attempts, cardIds);
  const weakQueue = buildWeakQueue(cards, latest);
  const reviewNextQueue = buildReviewNextQueue(cards, latest);
  const latestValues = Array.from(latest.values());
  const missedCards = latestValues.filter((attempt) => attempt.rating === 'missed').length;
  const almostCards = latestValues.filter((attempt) => attempt.rating === 'almost').length;
  const unreviewedCards = cards.filter((card) => !latest.has(card.id)).length;
  const lastAttemptTime = attempts.reduce((max, attempt) => Math.max(max, parseTime(attempt.reviewedAt)), 0);
  const lastSessionTime = sessions.reduce((max, session) => Math.max(max, parseTime(session.completedAt)), 0);
  const lastReviewedTime = Math.max(lastAttemptTime, lastSessionTime);
  const summary = {
    pageId: String(page?.id || ''),
    projectId: String(page?.projectId || ''),
    title: page?.title || mapViewTitle || 'Untitled map',
    description: page?.description || '',
    mapViewId,
    mapViewTitle,
    totalCards: cards.length,
    reviewedCards: latest.size,
    weakCards: weakQueue.length,
    missedCards,
    almostCards,
    unreviewedCards,
    priorityCards: reviewNextQueue.length,
    lastReviewedAt: lastReviewedTime ? new Date(lastReviewedTime).toISOString() : '',
    cards,
    weakQueue,
    reviewNextQueue,
    latestAttempts: Array.from(latest.values()),
    sessions,
  };
  summary.lastReviewedLabel = lastReviewedLabel(summary);
  return summary;
}

export function sortMapReviewSummaries(summaries = []) {
  return [...summaries].sort((a, b) => {
    const missedDiff = (b.missedCards || 0) - (a.missedCards || 0);
    if (missedDiff) return missedDiff;
    const almostDiff = (b.almostCards || 0) - (a.almostCards || 0);
    if (almostDiff) return almostDiff;
    const unreviewedDiff = (b.unreviewedCards || 0) - (a.unreviewedCards || 0);
    if (unreviewedDiff) return unreviewedDiff;
    const aNever = !a.lastReviewedAt;
    const bNever = !b.lastReviewedAt;
    if (aNever !== bNever) return aNever ? -1 : 1;
    const timeDiff = parseTime(a.lastReviewedAt) - parseTime(b.lastReviewedAt);
    if (timeDiff) return timeDiff;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export function summarizeWorkspaceReview({ pages = [], pageStates = [], documents = [] } = {}) {
  const summaries = sortMapReviewSummaries(
    pages
      .filter((page) => page.type === 'map')
      .map((page) =>
        summarizeMapReviewPage({
          page,
          pageState: pageStates.find((state) => state.pageId === page.id),
          documents,
        }),
      ),
  );
  const weakMaps = summaries.filter((summary) => summary.weakCards > 0);
  const priorityMaps = summaries.filter((summary) => summary.priorityCards > 0);
  const recentlyReviewed = [...summaries]
    .filter((summary) => summary.lastReviewedAt)
    .sort((a, b) => parseTime(b.lastReviewedAt) - parseTime(a.lastReviewedAt));
  const notReviewed = summaries.filter((summary) => !summary.lastReviewedAt);
  return { summaries, weakMaps, priorityMaps, recentlyReviewed, notReviewed };
}
