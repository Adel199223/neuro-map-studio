export const colors = ['blue', 'amber', 'green', 'rose', 'violet'];
export const shapes = ['card', 'round', 'pill', 'note', 'oval'];
export const nodeTypes = ['concept', 'question', 'evidence', 'document'];

export const sizePresets = {
  small: { w: 220, h: 118 },
  normal: { w: 268, h: 145 },
  large: { w: 330, h: 185 },
  wide: { w: 390, h: 145 },
  tall: { w: 260, h: 230 },
};

export const relationStyles = {
  causes: { label: 'causes', color: '#8b6d42', dash: '', base: 2.0, marker: false, note: 'one idea produces another' },
  funds: { label: 'funds', color: '#b68234', dash: '', base: 2.2, marker: false, note: 'money flows into a player' },
  controls: { label: 'controls', color: '#6e5aa8', dash: '', base: 2.1, marker: false, note: 'leverage shapes behavior' },
  benefits: { label: 'benefits', color: '#4f8a52', dash: '', base: 2.1, marker: false, note: 'value flows upward' },
  costs: { label: 'costs', color: '#ad5f58', dash: '', base: 2.1, marker: false, note: 'burden lands on someone' },
  loop: { label: 'loop', color: '#9a7449', dash: '8 7', base: 2.2, marker: false, note: 'feedback cycle' },
  exit: { label: 'exit', color: '#2f7f7a', dash: '2 6', base: 2.2, marker: false, note: 'practical alternative' },
  evidence: { label: 'evidence', color: '#557b88', dash: '6 5', base: 1.7, marker: false, note: 'example or support' },
  contrast: { label: 'contrast', color: '#77736d', dash: '10 4 2 4', base: 1.8, marker: false, note: 'opposite or tension' },
};

export const edgeShapes = ['curve', 'straight', 'elbow', 'arc'];
export const ports = ['auto', 'top', 'right', 'bottom', 'left'];
export const portLabels = { auto: 'auto', top: 'top', right: 'right', bottom: 'bottom', left: 'left' };
export const oppositePort = { top: 'bottom', right: 'left', bottom: 'top', left: 'right', auto: 'auto' };

export const NUDGE_STEP = 12;
export const NUDGE_LARGE_STEP = 48;

export const DEBUG_INPUT_KEY = 'neuro-map-studio:debug-input';
export const REVIEW_STATE_VERSION = 1;
export const REVIEW_RATING_LABELS = { 'got-it': 'Got it', almost: 'Almost', missed: 'Missed' };
export const REVIEW_CARD_TYPE_LABELS = {
  block: 'Block recall',
  relationship: 'Relationship line recall',
  neighbor: 'Connected blocks recall',
  source: 'Source or evidence recall',
};
export const REVIEW_FILTER_LABELS = {
  all: 'All',
  block: 'Blocks',
  relationship: 'Relationships',
  neighbor: 'Connected blocks',
  source: 'Sources/evidence',
};
export const REVIEW_SESSION_MODES = new Set(['normal', 'weak', 'next']);
export const MAP_HISTORY_LIMIT = 100;
export const LONG_PRESS_DELAY = 450;
export const LONG_PRESS_MOVE = 10;
export const MARQUEE_MIN_SIZE = 8;
export const PORT_TAP_MOVE = 14;
export const EDGE_HIT_WIDTH = 32;
export const EDGE_HIT_WIDTH_COARSE = 40;
export const RECENT_LONG_PRESS_MENU_MS = 900;
export const RECENT_DRAG_CONTEXTMENU_MS = 700;
export const PORT_OUTSET = 6;

export const defaultMap = {
  version: 20,
  view: { x: 0, y: 0, scale: 1 },
  nodes: [
    { id: 'core', title: 'Core claim', body: 'Modern politics sits underneath debt, cheap capital, assets, institutions, and attention.', group: 'blue', shape: 'card', importance: 3, x: -120, y: -40, w: 310, h: 168, tag: 'anchor' },
    { id: 'money', title: 'Money starts as debt', body: 'Loans, deficits, bonds, and refinancing create new claims that must be serviced.', group: 'blue', shape: 'round', importance: 3, x: -620, y: -40, w: 285, h: 162, tag: 'money' },
    { id: 'dependence', title: 'Debt creates dependence', body: 'Households, firms, and states need lenders, income, buyers, and rollover.', group: 'amber', shape: 'card', importance: 3, x: -380, y: 190, w: 285, h: 162, tag: 'loop' },
    { id: 'cheap', title: 'Cheap capital buys assets', body: 'Best-connected institutions can buy property, companies, infrastructure, and securities first.', group: 'green', shape: 'card', importance: 3, x: -50, y: 190, w: 305, h: 174, tag: 'capital' },
    { id: 'assets', title: 'Assets become leverage', body: 'Ownership brings cash flow, collateral, board influence, votes, lobbying power, and reach.', group: 'green', shape: 'card', importance: 3, x: 310, y: 120, w: 305, h: 178, tag: 'assets' },
    { id: 'policy', title: 'Policy follows leverage', body: 'Spending, regulation, bailouts, military budgets, and crisis design favor capital networks.', group: 'amber', shape: 'note', importance: 3, x: 310, y: -170, w: 315, h: 174, tag: 'policy' },
    { id: 'public', title: 'The public pays', body: 'Inflation, taxes, rent, wage pressure, debt service, and insecurity land on ordinary people.', group: 'rose', shape: 'round', importance: 2, x: -50, y: -315, w: 310, h: 168, tag: 'costs' },
    { id: 'assetmgr', title: 'Asset managers allocate flows', body: 'Pensions, ETFs, insurance pools, and proxy votes concentrate influence over companies.', group: 'green', shape: 'pill', importance: 2, x: -50, y: 475, w: 320, h: 160, tag: 'players' },
    { id: 'government', title: 'Government is the visible tool', body: 'It borrows, spends, regulates, bails out, funds war, collects tax, and absorbs blame.', group: 'amber', shape: 'note', importance: 2, x: -625, y: -315, w: 305, h: 168, tag: 'state' },
    { id: 'crises', title: 'Crises speed up transfer', body: 'Wars, bailouts, and reconstruction move public debt into private contracts and assets.', group: 'rose', shape: 'card', importance: 2, x: -925, y: -110, w: 300, h: 166, tag: 'crisis' },
    { id: 'media', title: 'Narrative manages attention', body: 'Media and algorithms shape what people fear, hate, support, or ignore.', group: 'blue', shape: 'oval', importance: 1, x: -760, y: 275, w: 340, h: 170, tag: 'attention' },
    { id: 'bitcoin', title: 'Scarce assets support exit', body: 'Gold or self-custodied Bitcoin can reduce dependence on bank custody and fiat debt.', group: 'green', shape: 'pill', importance: 2, x: 310, y: 460, w: 315, h: 154, tag: 'exit' },
    { id: 'exit', title: 'Practical exit path', body: 'Reduce bad debt. Own useful assets. Self-custody where possible. Buy local. Build community.', group: 'green', shape: 'round', importance: 3, x: -380, y: 675, w: 345, h: 165, tag: 'action' },
  ],
  edges: [
    { id: 'e1', from: 'core', to: 'money', relation: 'evidence', strength: 3, shape: 'curve', label: 'start here' },
    { id: 'e2', from: 'money', to: 'dependence', relation: 'causes', strength: 5, shape: 'curve', label: 'creates' },
    { id: 'e3', from: 'dependence', to: 'cheap', relation: 'causes', strength: 4, shape: 'curve', label: 'enables' },
    { id: 'e4', from: 'cheap', to: 'assets', relation: 'benefits', strength: 5, shape: 'curve', label: 'buys' },
    { id: 'e5', from: 'assets', to: 'policy', relation: 'controls', strength: 5, shape: 'curve', label: 'shapes' },
    { id: 'e6', from: 'policy', to: 'money', relation: 'loop', strength: 5, shape: 'curve', label: 'more debt' },
    { id: 'e7', from: 'policy', to: 'public', relation: 'costs', strength: 4, shape: 'curve', label: 'cost shifts' },
    { id: 'e8', from: 'assetmgr', to: 'cheap', relation: 'controls', strength: 4, shape: 'curve', label: 'allocates' },
    { id: 'e9', from: 'government', to: 'policy', relation: 'funds', strength: 4, shape: 'curve', label: 'spends' },
    { id: 'e10', from: 'crises', to: 'government', relation: 'causes', strength: 4, shape: 'curve', label: 'justifies' },
    { id: 'e11', from: 'crises', to: 'public', relation: 'costs', strength: 4, shape: 'curve', label: 'burden' },
    { id: 'e12', from: 'media', to: 'policy', relation: 'controls', strength: 3, shape: 'curve', label: 'attention' },
    { id: 'e13', from: 'dependence', to: 'exit', relation: 'exit', strength: 4, shape: 'arc', label: 'respond' },
    { id: 'e14', from: 'bitcoin', to: 'exit', relation: 'exit', strength: 3, shape: 'curve', label: 'tool' },
  ],
};
