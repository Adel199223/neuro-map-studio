import { expect, test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const helperUrl = pathToFileURL(resolve(root, 'public/prototypes/current/mindmapStorageHelpers.js')).href;
const storeUrl = pathToFileURL(resolve(root, 'public/prototypes/current/workspace-store.js')).href;

async function loadHelpers() {
  return import(`${helperUrl}?cache=${Date.now()}`);
}

async function loadStoreConstants() {
  return import(`${storeUrl}?cache=${Date.now()}`);
}

function fakeStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    entries,
  };
}

const minimalNode = {
  id: 'core',
  title: 'Core idea',
  body: 'Core body.',
  group: 'blue',
  shape: 'card',
  importance: 2,
  x: 0,
  y: 0,
  w: 240,
  h: 130,
  tag: 'core',
};

test.describe('mindmap storage helper extraction', () => {
  test('normalizes maps and workspaces with current fallback behavior', async () => {
    const { normalizeMap, resetViewsForLegacyWorkspace } = await loadHelpers();

    const map = normalizeMap({
      version: 99,
      view: { x: 5, y: 6, scale: 1.25 },
      nodes: [
        {
          id: 'doc',
          title: 'Document block',
          body: 'Document body.',
          group: 'green',
          shape: 'oval',
          importance: 9,
          x: '10',
          y: '20',
          w: 100,
          h: 100,
          tag: 'source',
          nodeType: 'document',
          documentId: 'doc-1',
        },
        {
          id: 'fallback',
          title: '',
          body: '',
          group: 'unknown',
          shape: 'triangle',
          importance: 0,
          x: 'not-a-number',
          y: null,
          w: 999,
          h: 10,
        },
      ],
      edges: [
        {
          id: 'valid-edge',
          from: 'doc',
          to: 'fallback',
          relation: 'controls',
          strength: 9,
          shape: 'straight',
          fromPort: 'right',
          toPort: 'left',
          label: 'keeps label',
        },
        {
          id: 'invalid-edge',
          from: 'missing',
          to: 'doc',
          relation: 'causes',
        },
      ],
    });

    expect(map.version).toBe(19);
    expect(map.view).toEqual({ x: 5, y: 6, scale: 1.25 });
    expect(map.nodes[0]).toMatchObject({
      id: 'doc',
      group: 'green',
      shape: 'oval',
      importance: 3,
      x: 10,
      y: 20,
      nodeType: 'document',
      documentId: 'doc-1',
    });
    expect(map.nodes[0].w).toBeGreaterThanOrEqual(340);
    expect(map.nodes[0].h).toBeGreaterThanOrEqual(172);
    expect(map.nodes[1]).toMatchObject({
      group: 'blue',
      shape: 'card',
      importance: 2,
      x: 40,
      y: 0,
      body: 'Rewrite this in your own words.',
      nodeType: 'concept',
      documentId: '',
    });
    expect(map.edges).toEqual([
      {
        id: 'valid-edge',
        from: 'doc',
        to: 'fallback',
        relation: 'controls',
        strength: 5,
        shape: 'straight',
        fromPort: 'right',
        toPort: 'left',
        label: 'keeps label',
      },
    ]);

    const legacy = resetViewsForLegacyWorkspace({
      version: 19,
      activePageId: 'legacy-page',
      pages: [
        {
          id: 'legacy-page',
          title: 'Legacy page',
          map: { version: 19, view: { x: 99, y: 88, scale: 2 }, nodes: [minimalNode], edges: [] },
        },
      ],
    });
    expect(legacy.pages[0].map.view).toEqual({ x: 0, y: 0, scale: 1 });
  });

  test('loads current storage first, then legacy storage, then seeded fallback', async () => {
    const { loadWorkspaceFallback } = await loadHelpers();
    const { CURRENT_MAP_WORKSPACE_STORAGE_KEY, LEGACY_MAP_WORKSPACE_STORAGE_KEYS } = await loadStoreConstants();

    const currentWorkspace = {
      version: 19,
      activePageId: 'current',
      pages: [{ id: 'current', title: 'Current storage map', map: { version: 19, nodes: [minimalNode], edges: [] } }],
    };
    const legacyWorkspace = {
      version: 19,
      activePageId: 'legacy',
      pages: [
        {
          id: 'legacy',
          title: 'Legacy storage map',
          map: { version: 19, view: { x: 30, y: 40, scale: 1.6 }, nodes: [minimalNode], edges: [] },
        },
      ],
    };

    const current = loadWorkspaceFallback(
      fakeStorage({
        [CURRENT_MAP_WORKSPACE_STORAGE_KEY]: JSON.stringify(currentWorkspace),
        [LEGACY_MAP_WORKSPACE_STORAGE_KEYS[0]]: JSON.stringify(legacyWorkspace),
      }),
    );
    expect(current.pages[0].title).toBe('Current storage map');

    const legacy = loadWorkspaceFallback(
      fakeStorage({
        [LEGACY_MAP_WORKSPACE_STORAGE_KEYS[0]]: JSON.stringify(legacyWorkspace),
      }),
    );
    expect(legacy.pages[0].title).toBe('Legacy storage map');
    expect(legacy.pages[0].map.view).toEqual({ x: 0, y: 0, scale: 1 });

    const fallback = loadWorkspaceFallback(fakeStorage({ [CURRENT_MAP_WORKSPACE_STORAGE_KEY]: '{bad json' }));
    expect(fallback.activePageId).toBe('page-main');
    expect(fallback.pages[0].map.nodes.some((node: { id: string }) => node.id === 'core')).toBe(true);
  });

  test('builds map page-state and workspace export payloads without changing wire shape', async () => {
    const { buildMapPageStatePayload, buildWorkspaceExportPayload } = await loadHelpers();
    const workspace = { version: 99, activePageId: 'page-main', pages: [{ id: 'page-main', title: 'Map', map: {} }] };
    const review = {
      version: 1,
      attempts: [{ id: 'attempt-1', rating: 'missed' }],
      sessions: [],
    };

    const pageState = buildMapPageStatePayload({ workspace, starterHidden: true, review });
    expect(pageState).toEqual({
      kind: 'map-workspace',
      workspace,
      starterHidden: true,
      review,
    });
    expect(workspace.version).toBe(19);

    const exported = buildWorkspaceExportPayload(workspace, { now: () => '2026-05-02T10:00:00.000Z' });
    expect(exported).toEqual({
      version: 20,
      exportedAt: '2026-05-02T10:00:00.000Z',
      activePageId: 'page-main',
      pages: workspace.pages,
    });
  });

  test('appends imported map pages using current title and active-page semantics', async () => {
    const { appendImportedMapPage, normalizeWorkspace } = await loadHelpers();
    const workspace = normalizeWorkspace({
      version: 19,
      activePageId: 'page-main',
      pages: [{ id: 'page-main', title: 'Main', map: { version: 19, nodes: [minimalNode], edges: [] } }],
    });

    const result = appendImportedMapPage(
      workspace,
      'Imported ideas.json',
      {
        version: 19,
        view: { x: 1, y: 2, scale: 1 },
        nodes: [{ ...minimalNode, id: 'imported-core', title: 'Imported core' }],
        edges: [],
      },
      { createId: () => 'page-imported' },
    );

    expect(result.page.id).toBe('page-imported');
    expect(result.page.title).toBe('Imported ideas');
    expect(workspace.activePageId).toBe('page-imported');
    expect(workspace.pages.map((page: { id: string }) => page.id)).toEqual(['page-main', 'page-imported']);
    expect(workspace.pages[1].map.nodes[0].id).toBe('imported-core');
  });

  test('preserves safe file names and autosave debounce behavior', async () => {
    const { safeFileName, scheduleAutosave } = await loadHelpers();
    const calls: unknown[] = [];

    expect(safeFileName(' My Fancy Map!!.json? ')).toBe('my-fancy-map-json');
    expect(safeFileName('')).toBe('learning-map');

    const timer = scheduleAutosave('old-timer', () => calls.push('callback'), {
      delay: 140,
      clearTimeoutFn: (timerId: string) => calls.push(['clear', timerId]),
      setTimeoutFn: (callback: () => void, delay: number) => {
        calls.push(['set', delay]);
        callback();
        return 'new-timer';
      },
    });

    expect(timer).toBe('new-timer');
    expect(calls).toEqual([['clear', 'old-timer'], ['set', 140], 'callback']);
  });

  test('saves the seeded localStorage mirror with the current storage key', async () => {
    const { saveWorkspaceMirror } = await loadHelpers();
    const { CURRENT_MAP_WORKSPACE_STORAGE_KEY } = await loadStoreConstants();
    const storage = fakeStorage();
    const workspace = { version: 19, activePageId: 'page-main', pages: [] };

    saveWorkspaceMirror(storage, workspace);

    expect(storage.entries.get(CURRENT_MAP_WORKSPACE_STORAGE_KEY)).toBe(JSON.stringify(workspace));
  });
});
