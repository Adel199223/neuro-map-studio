import { expect, test } from '@playwright/test';
import { seedWorkspace } from '../../src/data/simonDixonSeed';
import type { LearningWorkspace } from '../../src/features/learning-map/types';
import {
  CURRENT_WORKSPACE_STORAGE_KEY,
  LEGACY_WORKSPACE_STORAGE_KEYS,
  createPage,
  deletePage,
  duplicatePage,
  loadWorkspace,
  normalizeWorkspace,
  parseImportedWorkspace,
  renamePage,
  saveWorkspace,
  serializeWorkspaceExport,
} from '../../src/features/learning-map/workspaceCore';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  constructor(initialValues?: Record<string, string>) {
    for (const [key, value] of Object.entries(initialValues ?? {})) {
      this.values.set(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function normalizedSeedWorkspace(): LearningWorkspace {
  return normalizeWorkspace(seedWorkspace);
}

test.describe('learning-map workspace core', () => {
  test('blank current autosave payload falls back to the seed workspace', () => {
    const storage = new MemoryStorage({
      [CURRENT_WORKSPACE_STORAGE_KEY]: JSON.stringify({}),
    });

    expect(loadWorkspace(storage)).toEqual(normalizedSeedWorkspace());
  });

  test('invalid current autosave payload falls back to the seed workspace', () => {
    const storage = new MemoryStorage({
      [CURRENT_WORKSPACE_STORAGE_KEY]: 'not-json',
    });

    expect(loadWorkspace(storage)).toEqual(normalizedSeedWorkspace());
  });

  test('legacy single-map payload migrates into a safe one-page workspace', () => {
    const storage = new MemoryStorage({
      [LEGACY_WORKSPACE_STORAGE_KEYS[0]]: JSON.stringify({
        ...seedWorkspace.pages[0].map,
        view: { x: 44, y: -22, scale: 1.8 },
      }),
    });

    const workspace = loadWorkspace(storage);

    expect(workspace.activePageId).toBe('page-main');
    expect(workspace.pages).toHaveLength(1);
    expect(workspace.pages[0].title).toBe('Debt-power map');
    expect(workspace.pages[0].map.view).toEqual({ x: 0, y: 0, scale: 1 });
  });

  test('legacy multi-page payload resets every page view while preserving pages', () => {
    const storage = new MemoryStorage({
      [LEGACY_WORKSPACE_STORAGE_KEYS[1]]: JSON.stringify({
        version: 18,
        activePageId: 'page-b',
        pages: [
          {
            id: 'page-a',
            title: 'First page',
            map: {
              ...seedWorkspace.pages[0].map,
              view: { x: 90, y: 40, scale: 2 },
            },
          },
          {
            id: 'page-b',
            title: 'Second page',
            map: {
              ...seedWorkspace.pages[0].map,
              view: { x: -20, y: 15, scale: 0.7 },
              nodes: [
                {
                  ...seedWorkspace.pages[0].map.nodes[0],
                  id: 'second-core',
                  title: 'Second core',
                },
              ],
              edges: [],
            },
          },
        ],
      }),
    });

    const workspace = loadWorkspace(storage);

    expect(workspace.activePageId).toBe('page-b');
    expect(workspace.pages).toHaveLength(2);
    expect(workspace.pages.map((page) => page.map.view)).toEqual([
      { x: 0, y: 0, scale: 1 },
      { x: 0, y: 0, scale: 1 },
    ]);
    expect(workspace.pages[1].map.nodes[0].title).toBe('Second core');
  });

  test('page create, duplicate, rename, and delete follow prototype semantics', () => {
    const baseWorkspace = normalizedSeedWorkspace();
    const createdWorkspace = createPage(baseWorkspace, '  New   idea page  ');
    const createdPage = createdWorkspace.pages.at(-1);

    expect(createdWorkspace.pages).toHaveLength(baseWorkspace.pages.length + 1);
    expect(createdWorkspace.activePageId).toBe(createdPage?.id);
    expect(createdPage?.title).toBe('New idea page');
    expect(createdPage?.map.nodes).toHaveLength(1);
    expect(createdPage?.map.nodes[0].title).toBe('Main idea');

    const duplicatedWorkspace = duplicatePage(createdWorkspace, baseWorkspace.pages[0].id);
    const duplicatedPage = duplicatedWorkspace.pages.at(-1);

    expect(duplicatedWorkspace.activePageId).toBe(duplicatedPage?.id);
    expect(duplicatedPage?.title).toBe('Debt-power map copy');
    expect(duplicatedPage?.map.nodes).toHaveLength(baseWorkspace.pages[0].map.nodes.length);

    const renamedWorkspace = renamePage(
      duplicatedWorkspace,
      duplicatedPage?.id ?? '',
      '  Renamed   learning page ',
    );
    const renamedPage = renamedWorkspace.pages.find((page) => page.id === duplicatedPage?.id);

    expect(renamedPage?.title).toBe('Renamed learning page');

    const deletedWorkspace = deletePage(renamedWorkspace, renamedPage?.id ?? '');

    expect(deletedWorkspace.pages).toHaveLength(createdWorkspace.pages.length);
    expect(deletedWorkspace.pages.find((page) => page.id === renamedPage?.id)).toBeUndefined();
  });

  test('deleting the last page is prevented', () => {
    const baseWorkspace = normalizedSeedWorkspace();

    expect(deletePage(baseWorkspace, baseWorkspace.pages[0].id)).toEqual(baseWorkspace);
  });

  test('workspace export round-trips without losing page and edge metadata', () => {
    const workspace = createPage(normalizedSeedWorkspace(), 'Contrast page');
    const exportedWorkspace: LearningWorkspace = {
      ...workspace,
      pages: workspace.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              map: {
                ...page.map,
                nodes: page.map.nodes.map((node, nodeIndex) =>
                  nodeIndex === 0 ? { ...node, group: 'violet' } : node,
                ),
                edges: page.map.edges.map((edge, edgeIndex) =>
                  edgeIndex === 0
                    ? { ...edge, fromPort: 'right', toPort: 'left', label: 'kept label' }
                    : edge,
                ),
              },
            }
          : page,
      ),
    };

    const payload = serializeWorkspaceExport(exportedWorkspace);
    const imported = parseImportedWorkspace(payload);

    expect(payload.version).toBe(20);
    expect(Date.parse(payload.exportedAt)).not.toBeNaN();
    expect(imported.kind).toBe('workspace');
    if (imported.kind !== 'workspace') {
      test.fail();
      return;
    }

    expect(imported.workspace.pages).toHaveLength(exportedWorkspace.pages.length);
    expect(imported.workspace.pages[0].map.nodes[0].group).toBe('violet');
    expect(imported.workspace.pages[0].map.edges[0].fromPort).toBe('right');
    expect(imported.workspace.pages[0].map.edges[0].toPort).toBe('left');
    expect(imported.workspace.pages[0].map.edges[0].label).toBe('kept label');
  });

  test('document node metadata round-trips with map workspace payloads', () => {
    const baseWorkspace = normalizedSeedWorkspace();
    const workspace: LearningWorkspace = {
      ...baseWorkspace,
      pages: baseWorkspace.pages.map((page, index) =>
        index === 0
          ? {
              ...page,
              map: {
                ...page.map,
                nodes: [
                  ...page.map.nodes,
                  {
                    id: 'doc-node',
                    title: 'Source document',
                    body: 'Why this source matters.',
                    group: 'violet',
                    shape: 'note',
                    importance: 2,
                    x: 100,
                    y: 100,
                    w: 300,
                    h: 170,
                    tag: 'note',
                    nodeType: 'document',
                    documentId: 'simon-dixon-debt-power',
                  },
                ],
              },
            }
          : page,
      ),
    };

    const payload = serializeWorkspaceExport(workspace);
    const imported = parseImportedWorkspace(payload);

    expect(imported.kind).toBe('workspace');
    if (imported.kind !== 'workspace') {
      test.fail();
      return;
    }

    const documentNode = imported.workspace.pages[0].map.nodes.find((node) => node.id === 'doc-node');
    expect(documentNode?.nodeType).toBe('document');
    expect(documentNode?.documentId).toBe('simon-dixon-debt-power');
  });

  test('single-map imports become a new page titled from the file name', () => {
    const imported = parseImportedWorkspace(
      {
        ...seedWorkspace.pages[0].map,
        nodes: [
          {
            ...seedWorkspace.pages[0].map.nodes[0],
            title: 'Imported core',
          },
        ],
        edges: [],
      },
      'my imported map.json',
    );

    expect(imported.kind).toBe('page');
    if (imported.kind !== 'page') {
      test.fail();
      return;
    }

    expect(imported.page.title).toBe('my imported map');
    expect(imported.page.map.nodes[0].title).toBe('Imported core');
  });

  test('autosave serialization writes the current storage key with compatibility payload shape', () => {
    const storage = new MemoryStorage();
    const workspace = createPage(normalizedSeedWorkspace(), 'Autosave page');

    const payload = saveWorkspace(storage, workspace);
    const storedRaw = storage.getItem(CURRENT_WORKSPACE_STORAGE_KEY);

    expect(payload.version).toBe(19);
    expect(storedRaw).not.toBeNull();
    const storedPayload = JSON.parse(storedRaw ?? '{}') as Record<string, unknown>;
    expect(storedPayload.version).toBe(19);
    expect(storedPayload.activePageId).toBe(workspace.activePageId);
    expect('schemaVersion' in storedPayload).toBeFalsy();
    expect(loadWorkspace(storage).pages).toHaveLength(workspace.pages.length);
  });
});
