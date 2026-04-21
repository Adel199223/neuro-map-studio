import { seedWorkspace } from '../../data/simonDixonSeed';
import { relationshipVisuals } from './relationshipVisuals';
import type {
  LearningEdge,
  LearningMap,
  LearningPage,
  LearningWorkspace,
  LinkRoute,
  NodeGroup,
  NodeShape,
  PortSide,
  RelationshipType,
  ViewState,
} from './types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CompatibleLearningNode {
  id?: unknown;
  title?: unknown;
  body?: unknown;
  group?: unknown;
  shape?: unknown;
  importance?: unknown;
  x?: unknown;
  y?: unknown;
  w?: unknown;
  h?: unknown;
  tag?: unknown;
}

export interface CompatibleLearningEdge {
  id?: unknown;
  from?: unknown;
  to?: unknown;
  relation?: unknown;
  type?: unknown;
  strength?: unknown;
  shape?: unknown;
  fromPort?: unknown;
  toPort?: unknown;
  label?: unknown;
}

export interface CompatibleLearningMap {
  version?: unknown;
  view?: unknown;
  nodes?: unknown;
  edges?: unknown;
}

export interface CompatibleLearningPage extends CompatibleLearningMap {
  id?: unknown;
  title?: unknown;
  map?: unknown;
}

export interface CompatibleStoredWorkspace {
  version: number;
  activePageId: string;
  pages: CompatibleLearningPage[];
}

export interface CompatibleWorkspaceExport extends CompatibleStoredWorkspace {
  exportedAt: string;
}

export type CompatibleImportPayload =
  | LearningMap
  | LearningPage
  | LearningWorkspace
  | CompatibleLearningMap
  | CompatibleLearningPage
  | CompatibleStoredWorkspace
  | CompatibleWorkspaceExport
  | Record<string, unknown>
  | null
  | undefined;

export type ParsedImportedWorkspace =
  | { kind: 'workspace'; workspace: LearningWorkspace }
  | { kind: 'page'; page: LearningPage };

export const CURRENT_WORKSPACE_STORAGE_KEY =
  'simon-dixon-debt-power-learning-workspace-v20-clean-connectors';
export const LEGACY_WORKSPACE_STORAGE_KEYS = [
  'simon-dixon-debt-power-learning-workspace-v18-fixed-visibility',
  'simon-dixon-debt-power-learning-workspace-v17',
  'simon-dixon-debt-power-learning-workspace-v16',
  'simon-dixon-debt-power-learning-workspace-v15',
  'simon-dixon-debt-power-learning-map-v14',
  'simon-dixon-debt-power-learning-map-v13',
] as const;
export const WORKSPACE_AUTOSAVE_VERSION = 19;
export const WORKSPACE_EXPORT_VERSION = 20;

const DEFAULT_PAGE_ID = 'page-main';
const DEFAULT_PAGE_TITLE = 'Debt-power map';
const DEFAULT_NEW_PAGE_TITLE = 'New page';
const DEFAULT_IMPORTED_PAGE_TITLE = 'Imported page';
const DEFAULT_BLANK_NODE = {
  id: 'core',
  title: 'Main idea',
  body: 'Write the central idea here, then add linked blocks around it.',
  group: 'blue',
  shape: 'card',
  importance: 3,
  x: -120,
  y: -40,
  w: 310,
  h: 168,
  tag: 'anchor',
} as const;
const DEFAULT_VIEW: ViewState = { x: 0, y: 0, scale: 1 };
const VALID_NODE_GROUPS = ['blue', 'amber', 'green', 'rose', 'violet'] as const satisfies readonly NodeGroup[];
const VALID_NODE_SHAPES = ['card', 'round', 'pill', 'note', 'oval'] as const satisfies readonly NodeShape[];
const VALID_EDGE_SHAPES = ['curve', 'straight', 'elbow', 'arc'] as const satisfies readonly LinkRoute[];
const VALID_PORTS = ['auto', 'top', 'right', 'bottom', 'left'] as const satisfies readonly PortSide[];
const VALID_RELATIONS = new Set<RelationshipType>(
  Object.keys(relationshipVisuals) as RelationshipType[],
);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clean(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function hasPages(
  payload: CompatibleImportPayload,
): payload is LearningWorkspace | CompatibleStoredWorkspace | CompatibleWorkspaceExport {
  return isRecord(payload) && Array.isArray(payload.pages);
}

function currentDefaultWorkspace(): LearningWorkspace {
  return deepClone(seedWorkspace);
}

function currentDefaultMap(): CompatibleLearningMap {
  return deepClone(currentDefaultWorkspace().pages[0]?.map);
}

function defaultView(): ViewState {
  return { ...DEFAULT_VIEW };
}

function pageId(): string {
  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankMap(): LearningMap {
  return normalizeMap({
    version: WORKSPACE_AUTOSAVE_VERSION,
    view: defaultView(),
    nodes: [DEFAULT_BLANK_NODE],
    edges: [],
  });
}

function makePage(title: unknown, map?: CompatibleImportPayload): LearningPage {
  return {
    id: pageId(),
    title: clean(title || DEFAULT_NEW_PAGE_TITLE) || DEFAULT_NEW_PAGE_TITLE,
    map: normalizeMap(map),
  };
}

function resetWorkspaceViews(workspace: LearningWorkspace): LearningWorkspace {
  return {
    schemaVersion: 1,
    activePageId: workspace.activePageId,
    pages: workspace.pages.map((page) => ({
      ...page,
      map: {
        ...page.map,
        view: defaultView(),
      },
    })),
  };
}

function normalizePage(page: CompatibleImportPayload, index: number): LearningPage {
  const payload = isRecord(page) ? page : {};
  const rawMap = payload.map ?? payload;
  return {
    id: clean(payload.id || `page-${index}`) || `page-${index}`,
    title: clean(payload.title || `Page ${index + 1}`) || `Page ${index + 1}`,
    map: normalizeMap(rawMap),
  };
}

function activePage(workspace: LearningWorkspace, pageIdToFind: string): LearningPage | null {
  return workspace.pages.find((page) => page.id === pageIdToFind) ?? null;
}

function importedPageTitle(fileName?: string): string {
  const title = clean(fileName ? fileName.replace(/\.json$/i, '') : DEFAULT_IMPORTED_PAGE_TITLE);
  return title || DEFAULT_IMPORTED_PAGE_TITLE;
}

export function normalizeMap(input: CompatibleImportPayload): LearningMap {
  const source =
    isRecord(input) && Array.isArray(input.nodes) && input.nodes.length > 0 ? input : currentDefaultMap();
  const viewSource = isRecord(source.view) ? source.view : {};
  const normalizedNodes = (Array.isArray(source.nodes) ? source.nodes : []).map((node, index) => {
    const rawNode = isRecord(node) ? node : {};
    const shape = VALID_NODE_SHAPES.includes(rawNode.shape as NodeShape)
      ? (rawNode.shape as NodeShape)
      : 'card';
    let width = clamp(toFiniteNumber(rawNode.w) ?? 268, 160, 640);
    let height = clamp(toFiniteNumber(rawNode.h) ?? 145, 95, 520);
    if (shape === 'oval') {
      width = Math.max(width, 340);
      height = Math.max(height, 172);
    }
    return {
      id: clean(rawNode.id || `node-${index}`) || `node-${index}`,
      title: String(rawNode.title || 'Untitled block'),
      body: String(rawNode.body || 'Rewrite this in your own words.'),
      group: VALID_NODE_GROUPS.includes(rawNode.group as NodeGroup)
        ? (rawNode.group as NodeGroup)
        : 'blue',
      shape,
      importance: clamp(toFiniteNumber(rawNode.importance) ?? 2, 1, 3) as 1 | 2 | 3,
      x: toFiniteNumber(rawNode.x) ?? index * 40,
      y: toFiniteNumber(rawNode.y) ?? index * 40,
      w: width,
      h: height,
      tag: String(rawNode.tag || 'custom'),
    };
  });
  const nodeIds = new Set(normalizedNodes.map((node) => node.id));
  const normalizedEdges = (Array.isArray(source.edges) ? source.edges : [])
    .map((edge, index) => {
      const rawEdge = isRecord(edge) ? edge : {};
      const shape = VALID_EDGE_SHAPES.includes(rawEdge.shape as LinkRoute)
        ? (rawEdge.shape as LinkRoute)
        : 'curve';
      const relation = VALID_RELATIONS.has(rawEdge.relation as RelationshipType)
        ? (rawEdge.relation as RelationshipType)
        : rawEdge.type === 'loop'
          ? 'loop'
          : 'causes';
      return {
        id: clean(rawEdge.id || `edge-${index}`) || `edge-${index}`,
        from: clean(rawEdge.from),
        to: clean(rawEdge.to),
        relation,
        strength: clamp(toFiniteNumber(rawEdge.strength) ?? 3, 1, 5) as LearningEdge['strength'],
        shape,
        fromPort: VALID_PORTS.includes(rawEdge.fromPort as PortSide)
          ? (rawEdge.fromPort as PortSide)
          : 'auto',
        toPort: VALID_PORTS.includes(rawEdge.toPort as PortSide)
          ? (rawEdge.toPort as PortSide)
          : 'auto',
        label: String(rawEdge.label || ''),
      };
    })
    .filter((edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to));

  return {
    version: WORKSPACE_AUTOSAVE_VERSION,
    view: {
      x: toFiniteNumber(viewSource.x) ?? DEFAULT_VIEW.x,
      y: toFiniteNumber(viewSource.y) ?? DEFAULT_VIEW.y,
      scale: toFiniteNumber(viewSource.scale) ?? DEFAULT_VIEW.scale,
    },
    nodes: normalizedNodes,
    edges: normalizedEdges,
  };
}

export function normalizeWorkspace(input: CompatibleImportPayload): LearningWorkspace {
  if (!hasPages(input) || input.pages.length === 0) {
    const fallback = currentDefaultWorkspace();
    return {
      schemaVersion: 1,
      activePageId: fallback.activePageId,
      pages: fallback.pages.map((page, index) => normalizePage(page, index)),
    };
  }

  const pages = input.pages.map((page, index) => normalizePage(page, index));
  const activePageId = pages.some((page) => page.id === input.activePageId)
    ? input.activePageId
    : pages[0].id;

  return {
    schemaVersion: 1,
    activePageId,
    pages,
  };
}

export function loadWorkspace(storage: StorageLike): LearningWorkspace {
  try {
    const savedWorkspace = storage.getItem(CURRENT_WORKSPACE_STORAGE_KEY);
    if (savedWorkspace !== null) {
      return normalizeWorkspace(JSON.parse(savedWorkspace) as CompatibleImportPayload);
    }

    for (const key of LEGACY_WORKSPACE_STORAGE_KEYS) {
      const legacyWorkspace = storage.getItem(key);
      if (legacyWorkspace === null) {
        continue;
      }
      const parsed = JSON.parse(legacyWorkspace) as CompatibleImportPayload;
      if (hasPages(parsed)) {
        return resetWorkspaceViews(normalizeWorkspace(parsed));
      }
      const migratedMap = normalizeMap(parsed);
      migratedMap.view = defaultView();
      return normalizeWorkspace({
        version: WORKSPACE_AUTOSAVE_VERSION,
        activePageId: DEFAULT_PAGE_ID,
        pages: [{ id: DEFAULT_PAGE_ID, title: DEFAULT_PAGE_TITLE, map: migratedMap }],
      });
    }
  } catch {
    return normalizeWorkspace(currentDefaultWorkspace());
  }

  return normalizeWorkspace(currentDefaultWorkspace());
}

export function saveWorkspace(
  storage: StorageLike,
  workspace: LearningWorkspace,
): CompatibleStoredWorkspace {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const payload: CompatibleStoredWorkspace = {
    version: WORKSPACE_AUTOSAVE_VERSION,
    activePageId: normalizedWorkspace.activePageId,
    pages: deepClone(normalizedWorkspace.pages),
  };
  storage.setItem(CURRENT_WORKSPACE_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function createPage(workspace: LearningWorkspace, title: string): LearningWorkspace {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const page = makePage(title, blankMap());
  return {
    schemaVersion: 1,
    activePageId: page.id,
    pages: [...normalizedWorkspace.pages, page],
  };
}

export function duplicatePage(workspace: LearningWorkspace, pageIdToDuplicate: string): LearningWorkspace {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const page = activePage(normalizedWorkspace, pageIdToDuplicate);
  if (!page) {
    return normalizedWorkspace;
  }

  const duplicate = makePage(`${page.title || 'Page'} copy`, deepClone(page.map));
  return {
    schemaVersion: 1,
    activePageId: duplicate.id,
    pages: [...normalizedWorkspace.pages, duplicate],
  };
}

export function renamePage(
  workspace: LearningWorkspace,
  pageIdToRename: string,
  title: string,
): LearningWorkspace {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const page = activePage(normalizedWorkspace, pageIdToRename);
  if (!page) {
    return normalizedWorkspace;
  }

  return {
    schemaVersion: 1,
    activePageId: normalizedWorkspace.activePageId,
    pages: normalizedWorkspace.pages.map((existingPage) =>
      existingPage.id === pageIdToRename
        ? {
            ...existingPage,
            title: clean(title) || existingPage.title || 'Untitled page',
          }
        : existingPage,
    ),
  };
}

export function deletePage(workspace: LearningWorkspace, pageIdToDelete: string): LearningWorkspace {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (normalizedWorkspace.pages.length <= 1) {
    return normalizedWorkspace;
  }

  const pageIndex = normalizedWorkspace.pages.findIndex((page) => page.id === pageIdToDelete);
  if (pageIndex === -1) {
    return normalizedWorkspace;
  }

  const pages = normalizedWorkspace.pages.filter((page) => page.id !== pageIdToDelete);
  const nextActivePage = pages[Math.max(0, pageIndex - 1)] ?? pages[0];

  return {
    schemaVersion: 1,
    activePageId: nextActivePage.id,
    pages,
  };
}

export function parseImportedWorkspace(
  json: CompatibleImportPayload,
  fileName?: string,
): ParsedImportedWorkspace {
  if (hasPages(json)) {
    return {
      kind: 'workspace',
      workspace: normalizeWorkspace(json),
    };
  }

  return {
    kind: 'page',
    page: makePage(importedPageTitle(fileName), json),
  };
}

export function serializeWorkspaceExport(workspace: LearningWorkspace): CompatibleWorkspaceExport {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  return {
    version: WORKSPACE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    activePageId: normalizedWorkspace.activePageId,
    pages: deepClone(normalizedWorkspace.pages),
  };
}
