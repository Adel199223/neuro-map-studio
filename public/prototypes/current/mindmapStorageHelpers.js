import {
  CURRENT_MAP_WORKSPACE_STORAGE_KEY,
  LEGACY_MAP_WORKSPACE_STORAGE_KEYS,
} from './workspace-store.js';
import {
  colors,
  defaultMap,
  edgeShapes,
  nodeTypes,
  ports,
  relationStyles,
  shapes,
} from './mindmapConstants.js';
import { clean, cloneJson } from './mindmapDomUtils.js';
import { clamp } from './mindmapGeometry.js';

export function cloneDefault() {
  return cloneJson(defaultMap);
}

export function normalizeMap(map) {
  const base = cloneDefault();
  if (!map || !Array.isArray(map.nodes) || map.nodes.length === 0) return base;
  if (!Array.isArray(map.edges)) map.edges = [];
  map.version = 19;
  map.view = Object.assign({ x: 0, y: 0, scale: 1 }, map.view || {});
  map.nodes = map.nodes.map((node, index) => {
    const shape = shapes.includes(node.shape) ? node.shape : 'card';
    let width = clamp(Number(node.w) || 268, 160, 640);
    let height = clamp(Number(node.h) || 145, 95, 520);
    if (shape === 'oval') {
      width = Math.max(width, 340);
      height = Math.max(height, 172);
    }
    const nodeType = nodeTypes.includes(node.nodeType) ? node.nodeType : (node.documentId ? 'document' : 'concept');
    return {
      id: String(node.id || (`node-${index}`)),
      title: String(node.title || 'Untitled block'),
      body: String(node.body || 'Rewrite this in your own words.'),
      group: colors.includes(node.group) ? node.group : 'blue',
      shape,
      importance: clamp(Number(node.importance) || 2, 1, 3),
      x: Number.isFinite(+node.x) ? +node.x : index * 40,
      y: Number.isFinite(+node.y) ? +node.y : index * 40,
      w: width,
      h: height,
      tag: String(node.tag || (nodeType === 'document' ? 'document' : 'custom')),
      nodeType,
      documentId: nodeType === 'document' ? String(node.documentId || '') : '',
    };
  });
  const ids = new Set(map.nodes.map((node) => node.id));
  map.edges = map.edges
    .filter((edge) => ids.has(edge.from) && ids.has(edge.to))
    .map((edge, index) => {
      let shape = edgeShapes.includes(edge.shape) ? edge.shape : 'curve';
      if (shape === 'loop') shape = 'curve';
      return {
        id: String(edge.id || (`edge-${index}`)),
        from: edge.from,
        to: edge.to,
        relation: relationStyles[edge.relation] ? edge.relation : (edge.type === 'loop' ? 'loop' : 'causes'),
        strength: clamp(Number(edge.strength) || 3, 1, 5),
        shape,
        fromPort: ports.includes(edge.fromPort) ? edge.fromPort : 'auto',
        toPort: ports.includes(edge.toPort) ? edge.toPort : 'auto',
        label: String(edge.label || ''),
      };
    });
  return map;
}

export function createMapPageId(options = {}) {
  const nowValue = typeof options.now === 'function' ? options.now() : Date.now();
  const randomValue = typeof options.random === 'function' ? options.random() : Math.random();
  return `page-${Number(nowValue).toString(36)}-${Number(randomValue).toString(36).slice(2, 7)}`;
}

export function blankMap() {
  return normalizeMap({
    version: 19,
    view: { x: 0, y: 0, scale: 1 },
    nodes: [
      {
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
      },
    ],
    edges: [],
  });
}

export function makePage(title, map, options = {}) {
  const createId = typeof options.createId === 'function' ? options.createId : () => createMapPageId(options);
  return {
    id: createId(),
    title: clean(title || 'New page') || 'New page',
    map: normalizeMap(map || blankMap()),
  };
}

export function normalizeWorkspace(workspace) {
  if (!workspace || !Array.isArray(workspace.pages) || !workspace.pages.length) {
    return { version: 19, activePageId: 'page-main', pages: [{ id: 'page-main', title: 'Debt-power map', map: cloneDefault() }] };
  }
  const pages = workspace.pages.map((page, index) => ({
    id: String(page.id || (`page-${index}`)),
    title: clean(page.title || (`Page ${index + 1}`)) || (`Page ${index + 1}`),
    map: normalizeMap(page.map || page),
  }));
  const activePageId = pages.some((page) => page.id === workspace.activePageId) ? workspace.activePageId : pages[0].id;
  return { version: 19, activePageId, pages };
}

export function resetViewsForLegacyWorkspace(workspace) {
  const normalized = normalizeWorkspace(workspace);
  normalized.pages.forEach((page) => {
    if (page?.map) page.map.view = { x: 0, y: 0, scale: 1 };
  });
  return normalized;
}

export function fallbackSeededWorkspace(title = 'Debt-power map') {
  return normalizeWorkspace({ version: 19, activePageId: 'page-main', pages: [{ id: 'page-main', title, map: cloneDefault() }] });
}

export function blankPageWorkspace(title = 'Untitled map') {
  return normalizeWorkspace({ version: 19, activePageId: 'page-main', pages: [{ id: 'page-main', title, map: blankMap() }] });
}

export function loadWorkspaceFallback(storage, options = {}) {
  const workspaceKey = options.workspaceKey || CURRENT_MAP_WORKSPACE_STORAGE_KEY;
  const legacyStorageKeys = options.legacyStorageKeys || LEGACY_MAP_WORKSPACE_STORAGE_KEYS;
  try {
    const saved = storage?.getItem?.(workspaceKey);
    if (saved) return normalizeWorkspace(JSON.parse(saved));
    for (const key of legacyStorageKeys) {
      const legacy = storage?.getItem?.(key);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed && Array.isArray(parsed.pages)) return resetViewsForLegacyWorkspace(parsed);
        const migrated = normalizeMap(parsed);
        migrated.view = { x: 0, y: 0, scale: 1 };
        return normalizeWorkspace({ version: 19, activePageId: 'page-main', pages: [{ id: 'page-main', title: 'Debt-power map', map: migrated }] });
      }
    }
  } catch {
    // Match the legacy runtime behavior: corrupt local map storage falls back to the seeded map.
  }
  return fallbackSeededWorkspace();
}

export function saveWorkspaceMirror(storage, workspace, options = {}) {
  const workspaceKey = options.workspaceKey || CURRENT_MAP_WORKSPACE_STORAGE_KEY;
  storage?.setItem?.(workspaceKey, JSON.stringify(workspace));
}

export function workspaceFromPageStateData(pageStateData) {
  if (pageStateData?.kind === 'map-workspace' && pageStateData.workspace) {
    return normalizeWorkspace(pageStateData.workspace);
  }
  if (pageStateData?.workspace && Array.isArray(pageStateData.workspace.pages)) {
    return normalizeWorkspace(pageStateData.workspace);
  }
  if (Array.isArray(pageStateData?.pages)) {
    return normalizeWorkspace(pageStateData);
  }
  return null;
}

export function buildMapPageStatePayload({ workspace, starterHidden, review }) {
  workspace.version = 19;
  return {
    kind: 'map-workspace',
    workspace,
    starterHidden,
    review,
  };
}

export function buildWorkspaceExportPayload(workspace, options = {}) {
  const exportedAt = typeof options.now === 'function' ? options.now() : new Date().toISOString();
  return {
    version: 20,
    exportedAt,
    activePageId: workspace.activePageId,
    pages: workspace.pages,
  };
}

export function appendImportedMapPage(workspace, fileName, parsed, options = {}) {
  const title = fileName ? fileName.replace(/\.json$/i, '') : 'Imported page';
  const page = makePage(title, parsed, options);
  workspace.pages.push(page);
  workspace.activePageId = page.id;
  return { workspace, page };
}

export function safeFileName(name) {
  return clean(name || 'learning-map').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'learning-map';
}

export function scheduleAutosave(previousTimer, callback, options = {}) {
  const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 140;
  const setTimeoutFn = typeof options.setTimeoutFn === 'function' ? options.setTimeoutFn : globalThis.setTimeout;
  const clearTimeoutFn = typeof options.clearTimeoutFn === 'function' ? options.clearTimeoutFn : globalThis.clearTimeout;
  clearTimeoutFn(previousTimer);
  return setTimeoutFn(callback, delay);
}
