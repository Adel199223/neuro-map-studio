import {
  REVIEW_CARD_TYPE_LABELS,
  REVIEW_FILTER_LABELS,
  REVIEW_RATING_LABELS,
  REVIEW_SESSION_MODES,
  REVIEW_STATE_VERSION,
  relationStyles,
} from './mindmapConstants.js';
import { clean } from './mindmapDomUtils.js';

function defaultNow() {
  return new Date().toISOString();
}

export function reviewId(prefix, options = {}) {
  const nowValue = typeof options.now === 'function' ? options.now() : Date.now();
  const parsedNow = typeof nowValue === 'number' ? nowValue : Date.parse(String(nowValue));
  const time = Number.isFinite(parsedNow) ? parsedNow : Date.now();
  const randomValue = typeof options.random === 'function' ? options.random() : Math.random();
  const randomPart = Number.isFinite(Number(randomValue))
    ? Number(randomValue).toString(36).slice(2, 7)
    : String(randomValue).replace(/^0\./, '').slice(0, 5);
  return `${prefix}-${time.toString(36)}-${randomPart}`;
}

export function normalizeReviewStore(value = {}, options = {}) {
  const now = typeof options.now === 'function' ? options.now : defaultNow;
  const createId = typeof options.createId === 'function' ? options.createId : reviewId;
  const fallbackPageId = String(options.fallbackPageId || '');

  const attempts = Array.isArray(value?.attempts)
    ? value.attempts.flatMap((attempt) => {
      if (!attempt || typeof attempt !== 'object') return [];
      const rating = REVIEW_RATING_LABELS[attempt.rating] ? attempt.rating : '';
      if (!rating) return [];
      return [
        {
          id: String(attempt.id || createId('review-attempt')),
          cardId: String(attempt.cardId || ''),
          pageId: String(attempt.pageId || fallbackPageId),
          mapViewId: String(attempt.mapViewId || ''),
          cardType: String(attempt.cardType || 'block'),
          rating,
          reviewedAt: String(attempt.reviewedAt || now()),
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
          id: String(session.id || createId('review-session')),
          pageId: String(session.pageId || fallbackPageId),
          mapViewId: String(session.mapViewId || ''),
          startedAt: String(session.startedAt || now()),
          completedAt: String(session.completedAt || ''),
          reviewedCount: Math.max(0, Number(session.reviewedCount) || 0),
          gotIt: Math.max(0, Number(session.gotIt) || 0),
          almost: Math.max(0, Number(session.almost) || 0),
          missed: Math.max(0, Number(session.missed) || 0),
          cardIds: Array.isArray(session.cardIds) ? session.cardIds.map(String).filter(Boolean) : [],
          mode: REVIEW_SESSION_MODES.has(session.mode) ? session.mode : 'normal',
          filter: REVIEW_FILTER_LABELS[session.filter] ? session.filter : 'all',
        },
      ];
    })
    : [];

  return { version: REVIEW_STATE_VERSION, attempts, sessions };
}

export function normalizeReviewFilter(filter) {
  return REVIEW_FILTER_LABELS[filter] ? filter : 'all';
}

export function reviewAttemptTime(attempt) {
  const time = Date.parse(attempt?.reviewedAt || '');
  return Number.isFinite(time) ? time : 0;
}

export function reviewAttemptCount(attempt) {
  return Math.max(1, Number(attempt?.attemptCount) || 1);
}

export function latestReviewAttemptsByCard(attempts = [], cardIds = null) {
  const validIds = cardIds ? new Set(cardIds) : null;
  const latest = new Map();
  attempts.forEach((attempt, order) => {
    if (validIds && !validIds.has(attempt.cardId)) return;
    const time = reviewAttemptTime(attempt);
    const attemptCount = reviewAttemptCount(attempt);
    const existing = latest.get(attempt.cardId);
    if (
      !existing ||
      attemptCount > existing.__attemptCount ||
      (attemptCount === existing.__attemptCount &&
        (time > existing.__time || (time === existing.__time && order > existing.__order)))
    ) {
      latest.set(attempt.cardId, { ...attempt, __attemptCount: attemptCount, __time: time, __order: order });
    }
  });
  return latest;
}

export function filterReviewCards(cards, filter = 'all') {
  const selected = normalizeReviewFilter(filter);
  if (selected === 'all') return cards.slice();
  return cards.filter((card) => card.type === selected);
}

export function buildWeakReviewCards(cards, attempts = []) {
  const cardIds = cards.map((card) => card.id);
  const latest = latestReviewAttemptsByCard(attempts, cardIds);
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority = { missed: 0, almost: 1 };
  return cards
    .filter((card) => {
      const attempt = latest.get(card.id);
      return attempt?.rating === 'missed' || attempt?.rating === 'almost';
    })
    .sort((a, b) => {
      const aAttempt = latest.get(a.id);
      const bAttempt = latest.get(b.id);
      const ratingDiff = priority[aAttempt.rating] - priority[bAttempt.rating];
      if (ratingDiff) return ratingDiff;
      const timeDiff = reviewAttemptTime(aAttempt) - reviewAttemptTime(bAttempt);
      if (timeDiff) return timeDiff;
      return (order.get(a.id) || 0) - (order.get(b.id) || 0);
    });
}

export function buildReviewNextCards(cards, attempts = []) {
  const cardIds = cards.map((card) => card.id);
  const latest = latestReviewAttemptsByCard(attempts, cardIds);
  const order = new Map(cards.map((card, index) => [card.id, index]));
  const priority = { missed: 0, almost: 1, unreviewed: 2 };
  const priorityMeta = (card) => {
    const attempt = latest.get(card.id);
    if (attempt?.rating === 'missed' || attempt?.rating === 'almost') {
      return { bucket: attempt.rating, time: reviewAttemptTime(attempt) };
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

export function reviewStats(cards = [], attempts = [], sessions = []) {
  const cardIds = cards.map((card) => card.id);
  const latest = latestReviewAttemptsByCard(attempts, cardIds);
  const scopedAttempts = attempts.filter((attempt) => cardIds.includes(attempt.cardId));
  const completedSessions = sessions.filter((session) => session.completedAt);
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
    unreviewedCards,
    priorityCards: missedCards + almostCards + unreviewedCards,
    attempts: scopedAttempts,
    latest,
    lastAttempt: scopedAttempts[scopedAttempts.length - 1] || null,
    lastSession: completedSessions[completedSessions.length - 1] || null,
  };
}

export function reviewCardCountLabel(count) {
  return `${count} card${count === 1 ? '' : 's'}`;
}

export function reviewHistoryText(cards = [], attempts = [], sessions = []) {
  const stats = reviewStats(cards, attempts, sessions);
  const base = `${reviewCardCountLabel(stats.totalCards)} · ${stats.reviewedCards} reviewed · ${stats.weakCards} weak · ${stats.missedCards} missed · ${stats.almostCards} almost · ${stats.unreviewedCards} new`;
  if (!stats.totalCards) return 'No review cards yet.';
  if (stats.lastSession) {
    const label =
      stats.lastSession.mode === 'weak'
        ? 'Last weak review'
        : stats.lastSession.mode === 'next'
          ? 'Last Review next'
          : 'Last review';
    return `${base}. ${label}: ${stats.lastSession.reviewedCount} reviewed, Got it ${stats.lastSession.gotIt}, Almost ${stats.lastSession.almost}, Missed ${stats.lastSession.missed}.`;
  }
  if (stats.lastAttempt) {
    const lastLabel = REVIEW_RATING_LABELS[stats.lastAttempt.rating] || stats.lastAttempt.rating;
    return `${base}. Latest rating: ${lastLabel}.`;
  }
  return `${base}. No review attempts yet.`;
}

export function relationshipReviewCardId(mapViewId, edgeId) {
  return `${mapViewId}:relationship:${edgeId}`;
}

export function filterOutRelationshipReviewAttempts(attempts = [], { pageId, mapViewId, edgeId }) {
  const cardId = relationshipReviewCardId(mapViewId, edgeId);
  return attempts.filter((attempt) => !(attempt.pageId === pageId && attempt.mapViewId === mapViewId && attempt.cardId === cardId));
}

function documentById(documentsById, documentId) {
  return documentsById.get(documentId) || null;
}

function nodeReviewTitle(node, documentsById) {
  if (!node) return 'this block';
  const documentRecord = node.nodeType === 'document' ? documentById(documentsById, node.documentId) : null;
  return clean(documentRecord?.title || node.title || 'Untitled block') || 'this block';
}

function nodeReviewBody(node, documentsById) {
  if (!node) return '';
  const documentRecord = node.nodeType === 'document' ? documentById(documentsById, node.documentId) : null;
  return clean(node.body || documentRecord?.description || '');
}

function edgeReviewCue(edge) {
  const style = relationStyles[edge?.relation] || relationStyles.causes;
  const label = clean(edge?.label || '');
  if (label && label !== style.label) return `${label} (${style.label})`;
  return style.label;
}

function edgeReviewAnswer(edge) {
  const style = relationStyles[edge?.relation] || relationStyles.causes;
  const lines = [];
  if (clean(edge?.label)) lines.push(`Label: ${clean(edge.label)}`);
  lines.push(`Relationship type: ${style.label}`);
  if (style.note) lines.push(`Meaning cue: ${style.note}`);
  if (edge?.strength) lines.push(`Importance: ${edge.strength} of 5`);
  return lines.join('\n');
}

function connectionsForNode(nodeId, edges, nodesById) {
  return edges.flatMap((edge) => {
    if (edge.from !== nodeId && edge.to !== nodeId) return [];
    const otherId = edge.from === nodeId ? edge.to : edge.from;
    const other = nodesById.get(otherId);
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

function supportBlockMetadata(node, documentsById) {
  if (!node) return '';
  const documentRecord = node.nodeType === 'document' ? documentById(documentsById, node.documentId) : null;
  const parts = [];
  parts.push(nodeReviewTitle(node, documentsById));
  if (documentRecord?.sourceLabel || documentRecord?.type) {
    parts.push(`${documentRecord.sourceLabel || documentRecord.type}`);
  }
  const description = clean(documentRecord?.description || node.body || '');
  if (description) parts.push(description);
  return parts.join('\n');
}

function conciseConnectionAnswer(connections, documentsById, limit = 5) {
  const listed = connections
    .slice(0, limit)
    .map(({ edge, other }) => `${nodeReviewTitle(other, documentsById)} — ${edgeReviewCue(edge)}`);
  if (connections.length > limit) {
    listed.push(`Plus ${connections.length - limit} more connection${connections.length - limit === 1 ? '' : 's'}.`);
  }
  return listed.join('\n');
}

export function normalizeReviewVisualState(state = {}, options = {}) {
  const hasNode = typeof options.hasNode === 'function' ? options.hasNode : () => true;
  const hasEdge = typeof options.hasEdge === 'function' ? options.hasEdge : () => true;
  const highlight = state.highlight || {};
  const mask = state.mask || {};
  return {
    highlight: {
      nodes: Array.from(new Set(highlight.nodes || [])).filter((nodeId) => hasNode(nodeId)),
      edges: Array.from(new Set(highlight.edges || [])).filter((edgeId) => hasEdge(edgeId)),
    },
    mask: {
      nodeBodies: Array.from(new Set(mask.nodeBodies || [])).filter((nodeId) => hasNode(nodeId)),
      nodeAllContent: Array.from(new Set(mask.nodeAllContent || [])).filter((nodeId) => hasNode(nodeId)),
      edgeLabels: Array.from(new Set(mask.edgeLabels || [])).filter((edgeId) => hasEdge(edgeId)),
    },
  };
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
      return { prompt: cleanTitle, answer: cleanBody, maskBody: true };
    }
    return null;
  }
  if (looksLikeQuestionText(cleanBody)) return null;
  return { prompt: `Answer from memory: ${cleanTitle}`, answer: cleanBody, maskBody: true };
}

function makeReviewCard(card, visualOptions) {
  const preReveal = normalizeReviewVisualState(card.preReveal || { highlight: card.highlight, mask: card.mask }, visualOptions);
  const postReveal = normalizeReviewVisualState(card.postReveal || { highlight: card.highlight }, visualOptions);
  return {
    id: card.id,
    type: card.type,
    prompt: card.prompt,
    answer: card.answer,
    preReveal,
    postReveal,
    highlight: postReveal.highlight,
  };
}

export function createMapReviewCards(options = {}) {
  const mapViewId = String(options.mapViewId || 'page-main');
  const nodes = Array.isArray(options.nodes) ? options.nodes : [];
  const edges = Array.isArray(options.edges) ? options.edges : [];
  const documents = Array.isArray(options.documents) ? options.documents : [];
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const edgesById = new Map(edges.map((edge) => [edge.id, edge]));
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const visualOptions = {
    hasNode: typeof options.hasNode === 'function' ? options.hasNode : (nodeId) => nodesById.has(nodeId),
    hasEdge: typeof options.hasEdge === 'function' ? options.hasEdge : (edgeId) => edgesById.has(edgeId),
  };
  const cards = [];

  nodes.forEach((node) => {
    const title = nodeReviewTitle(node, documentsById);
    const body = nodeReviewBody(node, documentsById);
    if (!clean(title) || !body) return;
    const connections = connectionsForNode(node.id, edges, nodesById);
    const nodeType = clean(node.nodeType || 'concept').toLowerCase();
    let prompt = `Explain: ${title}`;
    let answer = body;
    let maskBody = true;
    if (nodeType === 'question') {
      const questionPayload = questionReviewPayload(title, body);
      if (!questionPayload) return;
      prompt = questionPayload.prompt;
      answer = questionPayload.answer;
      maskBody = questionPayload.maskBody;
    }
    if ((nodeType === 'document' || nodeType === 'evidence') && connections.length) {
      prompt = `What does this source or evidence support: ${title}?`;
      answer = `${body}\n\nConnected to:\n${conciseConnectionAnswer(connections, documentsById, 4)}`;
      maskBody = true;
    }
    cards.push(
      makeReviewCard(
        {
          id: `${mapViewId}:block:${node.id}`,
          type: 'block',
          prompt,
          answer,
          preReveal: { highlight: { nodes: [node.id], edges: [] }, mask: { nodeBodies: maskBody ? [node.id] : [] } },
          postReveal: { highlight: { nodes: [node.id], edges: [] } },
        },
        visualOptions,
      ),
    );
  });

  edges.forEach((edge) => {
    const from = nodesById.get(edge.from);
    const to = nodesById.get(edge.to);
    if (!from || !to) return;
    cards.push(
      makeReviewCard(
        {
          id: relationshipReviewCardId(mapViewId, edge.id),
          type: 'relationship',
          prompt: `What connects ${nodeReviewTitle(from, documentsById)} to ${nodeReviewTitle(to, documentsById)}?`,
          answer: edgeReviewAnswer(edge),
          preReveal: { highlight: { nodes: [from.id, to.id], edges: [edge.id] }, mask: { edgeLabels: [edge.id] } },
          postReveal: { highlight: { nodes: [from.id, to.id], edges: [edge.id] } },
        },
        visualOptions,
      ),
    );
  });

  nodes.forEach((node) => {
    const connections = connectionsForNode(node.id, edges, nodesById);
    if (connections.length < 2) return;
    cards.push(
      makeReviewCard(
        {
          id: `${mapViewId}:neighbor:${node.id}`,
          type: 'neighbor',
          prompt: `What is connected to ${nodeReviewTitle(node, documentsById)}, and why?`,
          answer: conciseConnectionAnswer(connections, documentsById, 6),
          preReveal: {
            highlight: { nodes: [node.id], edges: [] },
            mask: { nodeAllContent: connections.map((item) => item.other.id), edgeLabels: connections.map((item) => item.edge.id) },
          },
          postReveal: { highlight: { nodes: [node.id, ...connections.map((item) => item.other.id)], edges: connections.map((item) => item.edge.id) } },
        },
        visualOptions,
      ),
    );
  });

  const supportByTarget = new Map();
  const supportSeen = new Set();
  const addSupportReviewCandidate = (support, target, edge) => {
    if (!support || !target || !edge || support.id === target.id) return;
    const key = `${target.id}:${support.id}:${edge.id}`;
    if (supportSeen.has(key)) return;
    supportSeen.add(key);
    if (!supportByTarget.has(target.id)) supportByTarget.set(target.id, { target, supports: [] });
    supportByTarget.get(target.id).supports.push({ support, edge });
  };
  edges.forEach((edge) => {
    const from = nodesById.get(edge.from);
    const to = nodesById.get(edge.to);
    if (!from || !to) return;
    const evidenceRelation = edge.relation === 'evidence';
    if (isSupportBlock(from) || evidenceRelation) addSupportReviewCandidate(from, to, edge);
    if (isSupportBlock(to)) addSupportReviewCandidate(to, from, edge);
  });
  supportByTarget.forEach(({ target, supports }) => {
    if (!supports.length) return;
    cards.push(
      makeReviewCard(
        {
          id: `${mapViewId}:source:${target.id}`,
          type: 'source',
          prompt: `What source or evidence supports ${nodeReviewTitle(target, documentsById)}?`,
          answer: supports
            .map(({ support, edge }) => `${supportBlockMetadata(support, documentsById)}\nConnection: ${edgeReviewCue(edge)}`)
            .join('\n\n'),
          preReveal: {
            highlight: { nodes: [target.id], edges: [] },
            mask: { nodeAllContent: supports.map((item) => item.support.id), edgeLabels: supports.map((item) => item.edge.id) },
          },
          postReveal: {
            highlight: { nodes: [target.id, ...supports.map((item) => item.support.id)], edges: supports.map((item) => item.edge.id) },
          },
        },
        visualOptions,
      ),
    );
  });

  const seen = new Set();
  return cards.filter((card) => {
    if (!card.prompt || !card.answer || seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

export { REVIEW_CARD_TYPE_LABELS, REVIEW_FILTER_LABELS, REVIEW_RATING_LABELS };
