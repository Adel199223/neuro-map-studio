import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const mindmapPath = '/prototypes/current/mindmap.html';
const debugMindmapPath = `${mindmapPath}?debugInput=1`;
const lessonPath = '/prototypes/current/lesson.html';
const pageRuntimePath = '/prototypes/current/page.html';
const projectPath = '/prototypes/current/project.html';
const workspaceDbName = 'neuro-map-studio-local-workspace';

async function resetMindmap(page: Page, path = mindmapPath) {
  await clearWorkspaceDatabase(page);
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function clearWorkspaceDatabase(page: Page) {
  await page.goto('/');
  await page.evaluate((dbName) => {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  }, workspaceDbName);
}

async function openDetails(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    if (element instanceof HTMLDetailsElement) {
      element.open = true;
    }
    if (element instanceof HTMLDialogElement && !element.open) {
      element.showModal();
    }
  });
}

async function visibleBoundingBox(locator: Locator, description: string) {
  await locator.waitFor({ state: 'visible' });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const box = await locator.boundingBox();
    if (box) return box;
    await locator.page().waitForTimeout(50);
  }
  throw new Error(`Could not determine locator bounding box for ${description}.`);
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  margin = 0,
) {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width > b.x - margin &&
    a.y < b.y + b.height + margin &&
    a.y + a.height > b.y - margin
  );
}

async function expectNoBoxOverlap(first: Locator, second: Locator, description: string, margin = 0) {
  const firstBox = await visibleBoundingBox(first, `${description} first`);
  const secondBox = await visibleBoundingBox(second, `${description} second`);
  expect(boxesOverlap(firstBox, secondBox, margin)).toBe(false);
  return { firstBox, secondBox };
}

async function expectWorkbenchControlsClearOfZoom(page: Page, description: string) {
  const zoomControls = page.locator('#zoomDock .toolbar-group');
  await expectNoBoxOverlap(page.locator('#btnWorkbenchClose'), zoomControls, `${description} close control`, 4);
  const visiblePrimaryAction = page.locator('#workbenchDrawer button:visible').first();
  await expectNoBoxOverlap(visiblePrimaryAction, zoomControls, `${description} visible workbench control`, 4);
}

async function longPress(locator: Locator, options: { pointerId?: number; x?: number; y?: number } = {}) {
  const box = await visibleBoundingBox(locator, 'long-press test');
  const clientX = box.x + (options.x ?? box.width / 2);
  const clientY = box.y + (options.y ?? box.height / 2);
  const payload = {
    pointerId: options.pointerId ?? 41,
    pointerType: 'touch',
    button: 0,
    buttons: 1,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
  };

  await locator.dispatchEvent('pointerdown', payload);
  await locator.page().waitForTimeout(550);
  await locator.dispatchEvent('pointerup', payload);
}

async function contextMenu(locator: Locator, options: { x?: number; y?: number } = {}) {
  const box = await visibleBoundingBox(locator, 'context-menu test');
  await locator.dispatchEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 2,
    buttons: 2,
    clientX: box.x + (options.x ?? box.width / 2),
    clientY: box.y + (options.y ?? box.height / 2),
  });
}

async function syntheticClick(locator: Locator, options: { x?: number; y?: number } = {}) {
  const box = await visibleBoundingBox(locator, 'synthetic click test');
  await locator.dispatchEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
    buttons: 1,
    clientX: box.x + (options.x ?? box.width / 2),
    clientY: box.y + (options.y ?? box.height / 2),
  });
}

async function pointerTap(
  locator: Locator,
  options: { pointerId?: number; pointerType?: 'mouse' | 'touch' | 'pen'; pressure?: number; tiltX?: number; tiltY?: number } = {},
) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Could not determine locator bounding box for pointer tap test.');
  }
  const clientX = box.x + box.width / 2;
  const clientY = box.y + box.height / 2;
  const payload = {
    pointerId: options.pointerId ?? 77,
    pointerType: options.pointerType ?? 'pen',
    button: 0,
    buttons: 1,
    pressure: options.pressure ?? 0.62,
    tiltX: options.tiltX ?? 12,
    tiltY: options.tiltY ?? -6,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
  };

  await locator.dispatchEvent('pointerdown', payload);
  await locator.dispatchEvent('pointerup', { ...payload, buttons: 0 });
  await locator.dispatchEvent('click', {
    bubbles: true,
    cancelable: true,
    composed: true,
    button: 0,
    buttons: 0,
    clientX,
    clientY,
  });
}

async function dragByHandle(
  page: Page,
  nodeId: string,
  options: { pointerId?: number; pointerType?: 'mouse' | 'touch' | 'pen'; deltaX?: number; deltaY?: number } = {},
) {
  const handle = page.locator(`.map-node[data-id="${nodeId}"] .drag-handle`);
  const moveTarget = page.locator('#nodeLayer');
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('Could not determine drag handle bounding box for pointer drag test.');
  }
  const clientX = box.x + box.width / 2;
  const clientY = box.y + box.height / 2;
  const payload = {
    pointerId: options.pointerId ?? 91,
    pointerType: options.pointerType ?? 'touch',
    button: 0,
    buttons: 1,
    pressure: 1,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
  };
  const moveX = clientX + (options.deltaX ?? 88);
  const moveY = clientY + (options.deltaY ?? 64);

  await handle.dispatchEvent('pointerdown', payload);
  await moveTarget.dispatchEvent('pointermove', { ...payload, clientX: moveX, clientY: moveY });
  await moveTarget.dispatchEvent('pointerup', { ...payload, buttons: 0, pressure: 0, clientX: moveX, clientY: moveY });
}

async function beginHandleDrag(
  page: Page,
  nodeId: string,
  options: { pointerId?: number; pointerType?: 'mouse' | 'touch' | 'pen'; deltaX?: number; deltaY?: number } = {},
) {
  const handle = page.locator(`.map-node[data-id="${nodeId}"] .drag-handle`);
  const moveTarget = page.locator('#nodeLayer');
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('Could not determine drag handle bounding box for pointer drag test.');
  }
  const clientX = box.x + box.width / 2;
  const clientY = box.y + box.height / 2;
  const payload = {
    pointerId: options.pointerId ?? 101,
    pointerType: options.pointerType ?? 'touch',
    button: 0,
    buttons: 1,
    pressure: 1,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX,
    clientY,
  };
  const moveX = clientX + (options.deltaX ?? 72);
  const moveY = clientY + (options.deltaY ?? 52);

  await handle.dispatchEvent('pointerdown', payload);
  await moveTarget.dispatchEvent('pointermove', { ...payload, clientX: moveX, clientY: moveY });

  return { handle, moveTarget, payload, moveX, moveY };
}

async function countDebugLines(log: Locator) {
  return log.evaluate((node) => {
    const text = node.textContent?.trim() || '';
    if (!text || /no recent input yet\./i.test(text)) return 0;
    return text.split('\n').filter(Boolean).length;
  });
}

async function countDebugOccurrences(log: Locator, pattern: string) {
  return log.evaluate(
    (node, needle) => (node.textContent || '').split(needle).length - 1,
    pattern,
  );
}

async function getEdgeSnapshot(page: Page, edgeIndex = -1) {
  return page.evaluate((index) => {
    const edges = Array.from(document.querySelectorAll('#edgeLayer g.edge-group'));
    const labels = Array.from(document.querySelectorAll('#edgeLabelLayer .edge-label'));
    const resolvedIndex = index < 0 ? edges.length + index : index;
    const edgeGroup = edges[resolvedIndex] as SVGGElement | undefined;
    const edgePath = edgeGroup?.querySelector('.edge') as SVGPathElement | null;
    const hitPath = edgeGroup?.querySelector('.edge-hit') as SVGPathElement | null;
    const label = labels[resolvedIndex] as HTMLElement | undefined;
    if (!edgeGroup || !edgePath || !hitPath || !label) return null;
    const d = edgePath.getAttribute('d') || '';
    const numbers = d.match(/-?\d*\.?\d+/g)?.map(Number) || [];
    const endpoint =
      numbers.length >= 2
        ? { x: numbers[numbers.length - 2], y: numbers[numbers.length - 1] }
        : null;
    return {
      d,
      hitD: hitPath.getAttribute('d') || '',
      labelLeft: Number.parseFloat(label.style.left || '0'),
      labelTop: Number.parseFloat(label.style.top || '0'),
      edgeId: edgeGroup.dataset.edgeId || '',
      endpoint,
    };
  }, edgeIndex);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return {
      clientWidth: root.clientWidth,
      scrollWidth: Math.max(root.scrollWidth, body?.scrollWidth ?? 0),
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
}

async function expectReadableBox(locator: Locator, description: string, minWidth = 180) {
  const box = await visibleBoundingBox(locator, description);
  expect(box.width).toBeGreaterThan(minWidth);
  expect(box.height).toBeLessThan(120);
  return box;
}

async function expectElementTopBefore(locator: Locator, description: string, maxTop: number) {
  const box = await visibleBoundingBox(locator, description);
  expect(box.y).toBeLessThan(maxTop);
  return box;
}

async function expectUsableCanvasHeight(page: Page, minHeight = 420) {
  const stageBox = await visibleBoundingBox(page.locator('#stage'), 'map canvas stage');
  expect(stageBox.height).toBeGreaterThan(minHeight);
  return stageBox;
}

async function expectFreshMapNodeClearOfOverlays(page: Page) {
  const geometry = await page.evaluate(() => {
    const rectOf = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const node = rectOf('.map-node[data-id="core"]');
    const toolbar = rectOf('.toolbar');
    const starter = rectOf('#mapStarterPanel:not([hidden])');
    const zoomDock = rectOf('#zoomDock');
    const workbench = rectOf('#workbenchDrawer:not([hidden])');
    const selectionShelf = rectOf('#selectionShelf:not([hidden])');
    const stage = rectOf('#stage');
    const overlaps = (a: NonNullable<typeof node>, b: NonNullable<typeof node>) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      node,
      toolbar,
      starter,
      zoomDock,
      workbench,
      selectionShelf,
      stage,
      overlapsToolbar: node && toolbar ? overlaps(node, toolbar) : false,
      overlapsStarter: node && starter ? overlaps(node, starter) : false,
      overlapsZoomDock: node && zoomDock ? overlaps(node, zoomDock) : false,
      overlapsWorkbench: node && workbench ? overlaps(node, workbench) : false,
      overlapsSelectionShelf: node && selectionShelf ? overlaps(node, selectionShelf) : false,
    };
  });

  expect(geometry.node).not.toBeNull();
  expect(geometry.stage).not.toBeNull();
  expect(geometry.toolbar).not.toBeNull();
  expect(geometry.starter).not.toBeNull();
  expect(geometry.workbench).not.toBeNull();
  expect(geometry.zoomDock).not.toBeNull();
  expect(geometry.overlapsToolbar).toBe(false);
  expect(geometry.overlapsStarter).toBe(false);
  expect(geometry.overlapsWorkbench).toBe(false);
  expect(geometry.overlapsZoomDock).toBe(false);
  expect(geometry.overlapsSelectionShelf).toBe(false);
  expect(geometry.node!.left).toBeGreaterThanOrEqual(geometry.stage!.left + 12);
  expect(geometry.node!.top).toBeGreaterThanOrEqual(geometry.stage!.top + 12);
  expect(geometry.node!.right).toBeLessThanOrEqual(geometry.stage!.right - 12);
  expect(geometry.node!.bottom).toBeLessThanOrEqual(geometry.stage!.bottom - 12);
}

async function clickCanvasAt(page: Page, position: { xRatio?: number; yRatio?: number } = {}) {
  const stageBox = await visibleBoundingBox(page.locator('#stage'), 'canvas placement stage');
  await page.mouse.click(
    stageBox.x + stageBox.width * (position.xRatio ?? 0.44),
    stageBox.y + stageBox.height * (position.yRatio ?? 0.46),
  );
}

async function clickLocatorCenter(page: Page, locator: Locator, description: string) {
  const box = await visibleBoundingBox(locator, description);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('current standalone prototypes', () => {
  test('root dashboard prioritizes projects and app actions over explainer copy', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await expect(page.getByLabel(/Workspace rail/i)).toBeVisible();
    await expect(page.getByLabel(/Workspace topbar/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Workspace board/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /build calm learning projects from documents/i })).toHaveCount(0);
    await expect(page.getByLabel(/Continue working/i).getByRole('link', { name: /open project/i })).toHaveAttribute(
      'href',
      '/prototypes/current/project.html?projectId=geopolitics-economics',
    );
    await expect(page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New map$/i })).toBeVisible();
    await expect(page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New page$/i })).toBeVisible();
    await expect(page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New project$/i })).toBeVisible();
    await expect(page.getByLabel(/Recent pages and diagrams/i)).toBeVisible();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Project board/i })).toBeVisible();
    await expect(page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Backup/i })).toBeVisible();
    await expect(page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Developer tools/i })).toHaveCount(0);
    await expect(page.getByText(/Build calm learning projects from documents/i)).toBeHidden();
  });

  test('developer tools are secondary, not primary navigation', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await expect(page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Developer tools/i })).toHaveCount(0);
    await page.getByLabel(/Workspace rail/i).getByRole('button', { name: /^Help$/i }).click();
    await expect(page.getByRole('heading', { name: /Help \/ About/i })).toBeVisible();
    await openDetails(page, '.advanced-tools');
    await expect(page.getByRole('button', { name: /Open developer tools/i })).toBeVisible();
  });

  test('root dashboard stays readable at medium width', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 760 });
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    const continuePanel = page.getByLabel(/Continue working/i);
    await expect(page.getByLabel(/Workspace rail/i)).toBeVisible();
    await expect(continuePanel).toBeVisible();
    await expect(page.getByLabel(/Quick create/i)).toBeVisible();
    await expect(page.getByLabel(/Recent pages and diagrams/i)).toBeVisible();
    await expectReadableBox(continuePanel.getByRole('heading', { name: /Geopolitics & Economics/i }), 'medium current project title');
    await expectElementTopBefore(page.getByLabel(/Recent pages and diagrams/i), 'medium recent pages panel', 760);
    await expectNoHorizontalOverflow(page);
  });

  test('root dashboard stacks cleanly at narrow width', async ({ page }) => {
    await page.setViewportSize({ width: 680, height: 820 });
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await expect(page.getByLabel(/Workspace rail/i)).toBeVisible();
    await expect(page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New map$/i })).toBeVisible();
    await expect(page.getByLabel(/Quick create/i)).toBeVisible();
    await expectReadableBox(
      page.getByLabel(/Continue working/i).getByRole('heading', { name: /Geopolitics & Economics/i }),
      'narrow current project title',
      150,
    );
    await expectNoHorizontalOverflow(page);
  });

  test('root dashboard keeps object board visible at wide desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await expect(page.getByLabel(/Continue working/i)).toBeVisible();
    await expect(page.getByLabel(/Quick create/i)).toBeVisible();
    await expect(page.getByLabel(/Recent pages and diagrams/i)).toBeVisible();
    await expect(page.getByLabel(/^Projects$/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('root workspace dashboard can create a project that persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New project$/i }).click();
    await page.getByLabel(/Project title/i).fill('Neuroscience study');
    await page.getByLabel(/Theme or domain/i).fill('neuroscience');
    await page.getByLabel(/Short description/i).fill('A calm project for memory, attention, and learning.');
    await page.getByRole('button', { name: /create project locally/i }).click();

    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Neuroscience study/i })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Neuroscience study/i })).toBeVisible();
  });

  test('root new map action creates and opens a map runtime', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New map$/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/mindmap\.html\?pageId=/);
    await expect(page.getByRole('heading', { name: /New learning map/i })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /New learning map/i })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeVisible();
  });

  test('fresh map runtime starts with the main idea clear of overlays', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 760 });
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New map$/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/mindmap\.html\?pageId=/);
    await expect(page.locator('.map-node[data-id="core"]', { hasText: 'Main idea' })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeVisible();
    await expectFreshMapNodeClearOfOverlays(page);
  });

  test('map header stays readable at medium width', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 760 });
    await resetMindmap(page);

    await expect(page.locator('.topbar')).toBeVisible();
    await expectReadableBox(page.locator('#mapPageTitle'), 'medium map title', 180);
    await expectReadableBox(page.locator('#projectKicker'), 'medium map context', 180);
    await expect(page.locator('#projectKicker')).toHaveAttribute('title', /Project: Geopolitics & Economics/);
    await expect(page.getByLabel(/Switch map view inside this page/i)).toBeVisible();
    await expect(page.locator('#btnNewPage')).toBeVisible();
    await expect(page.locator('#saveStatus')).toBeVisible();
    await expectUsableCanvasHeight(page, 420);
    await expectNoHorizontalOverflow(page);

    const topbarBox = await visibleBoundingBox(page.locator('.topbar'), 'medium map topbar');
    expect(topbarBox.height).toBeLessThan(150);
  });

  test('map header keeps canvas usable at narrow width', async ({ page }) => {
    await page.setViewportSize({ width: 680, height: 820 });
    await resetMindmap(page);

    await expectReadableBox(page.locator('#mapPageTitle'), 'narrow map title', 150);
    await expectReadableBox(page.locator('#projectKicker'), 'narrow map context', 150);
    await expect(page.getByLabel(/Switch map view inside this page/i)).toBeVisible();
    await expect(page.locator('#btnNewPage')).toBeVisible();
    await expectUsableCanvasHeight(page, 380);
    await expectNoHorizontalOverflow(page);

    const topbarBox = await visibleBoundingBox(page.locator('.topbar'), 'narrow map topbar');
    expect(topbarBox.height).toBeLessThan(190);
  });

  test('workspace backup export includes schema metadata and all local stores', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await expect(page.getByLabel(/Workspace board/i)).toBeVisible();

    await page.evaluate(async () => {
      const runtime = window as unknown as Window & {
        neuroMapWorkspaceStore: {
          createProject: (fields: Record<string, string>) => Promise<{ id: string }>;
          createDocument: (projectId: string, fields: Record<string, string>) => Promise<{ id: string }>;
          createPage: (projectId: string, fields: Record<string, string>) => Promise<{ id: string }>;
          linkPageDocument: (pageId: string, documentId: string, relationship: string) => Promise<unknown>;
          savePageState: (pageId: string, pageType: string, data: Record<string, string>) => Promise<unknown>;
        };
      };
      const store = runtime.neuroMapWorkspaceStore;
      const project = await store.createProject({
        title: 'Backup export project',
        description: 'Project included in a JSON backup.',
        theme: 'backup-test',
      });
      const documentRecord = await store.createDocument(project.id, {
        title: 'Backup source document',
        type: 'note',
        description: 'A source that should be exported.',
      });
      const pageRecord = await store.createPage(project.id, {
        title: 'Backup notes page',
        type: 'notes',
        description: 'A page that should have runtime state.',
      });
      await store.linkPageDocument(pageRecord.id, documentRecord.id, 'source');
      await store.savePageState(pageRecord.id, 'notes', {
        kind: 'notes-editor',
        prompt: 'Backup prompt',
        body: 'Backup body',
        nextQuestion: 'What should restore?',
      });
    });

    await page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Backup/i }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export workspace backup/i }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Expected a downloaded backup file.');
    const backup = JSON.parse(readFileSync(downloadPath, 'utf8')) as {
      schemaVersion: number;
      app: { name: string };
      storage: { dbVersion: number; pageStateVersion: number };
      projects: Array<{ title: string }>;
      documents: Array<{ title: string }>;
      pages: Array<{ title: string }>;
      pageDocumentLinks: unknown[];
      pageStates: Array<{ data: unknown }>;
    };

    expect(backup.schemaVersion).toBe(1);
    expect(backup.app.name).toBe('Neuro Map Studio');
    expect(backup.storage.dbVersion).toBeGreaterThanOrEqual(2);
    expect(backup.storage.pageStateVersion).toBe(1);
    expect(backup.projects.some((project) => project.title === 'Backup export project')).toBe(true);
    expect(backup.documents.some((documentRecord) => documentRecord.title === 'Backup source document')).toBe(true);
    expect(backup.pages.some((pageRecord) => pageRecord.title === 'Backup notes page')).toBe(true);
    expect(backup.pageDocumentLinks.length).toBeGreaterThan(0);
    expect(backup.pageStates.length).toBeGreaterThan(0);
  });

  test('workspace backup import merges valid data and persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await expect(page.getByLabel(/Workspace board/i)).toBeVisible();
    const backup = await page.evaluate(async () => {
      const runtime = window as unknown as Window & {
        neuroMapWorkspaceStore: {
          createProject: (fields: Record<string, string>) => Promise<{ id: string }>;
          createDocument: (projectId: string, fields: Record<string, string>) => Promise<{ id: string }>;
          createPage: (projectId: string, fields: Record<string, string>) => Promise<{ id: string }>;
          linkPageDocument: (pageId: string, documentId: string, relationship: string) => Promise<unknown>;
          savePageState: (pageId: string, pageType: string, data: Record<string, string>) => Promise<unknown>;
          exportWorkspaceBackup: () => Promise<unknown>;
        };
      };
      const store = runtime.neuroMapWorkspaceStore;
      const project = await store.createProject({
        title: 'Backup import project',
        description: 'Imported project should survive reload.',
        theme: 'import-test',
      });
      const documentRecord = await store.createDocument(project.id, {
        title: 'Imported source',
        type: 'note',
        description: 'Imported document metadata.',
      });
      const pageRecord = await store.createPage(project.id, {
        title: 'Imported notes page',
        type: 'notes',
        description: 'Imported runtime page.',
      });
      await store.linkPageDocument(pageRecord.id, documentRecord.id, 'related');
      await store.savePageState(pageRecord.id, 'notes', {
        kind: 'notes-editor',
        prompt: 'Imported prompt',
        body: 'Imported body',
        nextQuestion: 'What came from backup?',
      });
      return store.exportWorkspaceBackup();
    });

    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Backup/i }).click();
    await page.getByLabel(/Import workspace backup/i).setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });

    await expect(page.getByText(/Backup merged safely/i)).toBeVisible();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Backup import project/i })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Backup import project/i })).toBeVisible();

    await page.locator('.project-card').filter({ hasText: 'Backup import project' }).getByRole('link', { name: /Open project/i }).click();
    await expect(page.getByRole('heading', { name: /Imported notes page/i })).toBeVisible();
    await page.getByRole('tab', { name: /^Utilities$/i }).click();
    await expect(page.getByText(/Imported notes page uses Imported source as related/i)).toBeVisible();
  });

  test('workspace backup import rejects invalid JSON without replacing local data', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Geopolitics & Economics/i })).toBeVisible();

    await page.getByLabel(/Workspace rail/i).getByRole('button', { name: /Backup/i }).click();
    await page.getByLabel(/Import workspace backup/i).setInputFiles({
      name: 'not-a-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ schemaVersion: 999, projects: 'nope' })),
    });

    await expect(page.getByText(/Backup rejected/i)).toBeVisible();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Geopolitics & Economics/i })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/^Projects$/i).getByRole('heading', { name: /Geopolitics & Economics/i })).toBeVisible();
  });

  test('empty projects show create prompts instead of dead lesson or map shortcuts', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New project$/i }).click();
    await page.getByLabel(/Project title/i).fill('Empty runtime project');
    await page.getByLabel(/Theme or domain/i).fill('learning lab');
    await page.getByLabel(/Short description/i).fill('A fresh project with no pages yet.');
    await page.getByRole('button', { name: /create project locally/i }).click();

    const projectCard = page.locator('.project-card').filter({ hasText: 'Empty runtime project' });
    await projectCard.getByRole('link', { name: /open project/i }).click();

    await expect(page.getByRole('heading', { name: /Empty runtime project/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open lesson/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Open map|Open editable map/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Create a lesson page/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create a map page/i })).toBeVisible();

    await page.getByRole('button', { name: /Create a lesson page/i }).click();
    await expect(page.locator('#pageCreatePanel')).toHaveJSProperty('open', true);
    await expect(page.locator('#pageTypeSelect')).toHaveValue('lesson');
  });

  test('project home separates documents, pages, and page-document references', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await expect(page.getByRole('heading', { name: 'Geopolitics & Economics' })).toBeVisible();
    await expect(page.getByText(/Neuro Map Studio/i).first()).toBeVisible();
    await expect(page.getByLabel(/Project rail/i)).toBeVisible();
    await expect(page.getByLabel(/Project topbar/i)).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Pages$/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('heading', { name: /Pages and diagrams/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Documents$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Utilities$/i })).toBeVisible();
    await expect(page.locator('#pageCreatePanel')).toHaveJSProperty('open', false);
    await expect(page.locator('#documentCreatePanel')).toHaveJSProperty('open', false);
    await page.getByRole('tab', { name: /^Documents$/i }).click();
    await expect(page.getByRole('heading', { name: /Document library/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Simon Dixon debt-power interview\/model/i })).toBeVisible();
    await page.getByRole('tab', { name: /^Pages$/i }).click();

    const openLinks = await page.locator('.page-card a[data-role="page-open-link"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') || ''),
    );
    expect(openLinks.length).toBeGreaterThan(0);
    expect(openLinks.every((href) => href.length > 0 && href !== '#')).toBe(true);

    await openDetails(page, '#documentCreatePanel');
    await page.locator('#documentForm').getByLabel(/Title/i).fill('Central bank explainer');
    await page.locator('#documentForm').getByLabel(/Type/i).selectOption('web');
    await page.locator('#documentForm').getByLabel(/Source\/topic label/i).fill('Web source');
    await page.locator('#documentForm').getByLabel(/Tags/i).fill('money, policy');
    await page.locator('#documentForm').getByLabel(/Short description/i).fill('A source about central bank policy.');
    await page.locator('#documentForm').getByRole('button', { name: /Create document/i }).click();
    await expect(page.getByRole('heading', { name: /Central bank explainer/i })).toBeVisible();

    await page.getByRole('tab', { name: /^Utilities$/i }).click();
    await page.getByRole('button', { name: /Attach document/i }).click();
    await page.locator('#linkPageSelect').selectOption({ label: 'Debt-power map' });
    await page.locator('#linkDocumentSelect').selectOption({ label: 'Central bank explainer' });
    await page.locator('#linkForm').getByLabel(/Relationship/i).selectOption('evidence');
    await page.locator('#linkForm').getByRole('button', { name: /Attach document to page/i }).click();
    await expect(page.getByText(/Debt-power map uses Central bank explainer as evidence/i)).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: /^Documents$/i }).click();
    await expect(page.getByRole('heading', { name: /Central bank explainer/i })).toBeVisible();
    await page.getByRole('tab', { name: /^Utilities$/i }).click();
    await expect(page.getByText(/Debt-power map uses Central bank explainer as evidence/i)).toBeVisible();
  });

  test('project hub remains readable at medium width', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 760 });
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await expect(page.getByLabel(/Project rail/i)).toBeVisible();
    await expect(page.getByLabel(/Project rail/i).getByRole('link', { name: /^Workspace$/i })).toBeVisible();
    await expect(page.getByLabel(/Project rail/i).getByRole('link', { name: /Workspace home/i })).toHaveCount(0);
    await expectReadableBox(
      page.getByLabel(/Project rail/i).getByRole('link', { name: /^Workspace$/i }),
      'medium project rail workspace link',
      70,
    );
    await expect(page.getByRole('tab', { name: /^Pages$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Documents$/i })).toBeVisible();

    const mapCard = page.locator('.page-card.type-map').first();
    await expect(mapCard.getByRole('link', { name: /Debt-power map/i })).toHaveAttribute('href', /page\.html\?pageId=/);
    await expectReadableBox(mapCard.getByRole('link', { name: /Debt-power map/i }), 'medium map card title', 150);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('tab', { name: /^Documents$/i }).click();
    await expect(page.getByLabel(/Documents board/i)).toBeVisible();
    await expectReadableBox(page.locator('.document-card').first().getByRole('heading'), 'medium document card title', 150);
    await expectNoHorizontalOverflow(page);
  });

  test('creating a lesson page opens a real runtime lesson and persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Power notes lesson');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('lesson');
    await page.locator('#pageForm').getByLabel(/Description/i).fill('A calm lesson page for encoding the project in plain language.');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/page\.html\?pageId=/);
    await expect(page.getByRole('heading', { name: /Power notes lesson/i })).toBeVisible();
    await expect(page.locator('#lessonRuntime .meta').first()).toHaveText(/Lesson page/i);

    await page.locator('#lessonSummary').fill('Debt changes behavior by changing dependence.');
    await page.locator('#lessonReflectionAnswer').fill('It helps me restate the source in plain language.');
    await expect(page.locator('#status')).toContainText(/Saved locally/i);
    await page.reload();

    await expect(page.locator('#lessonSummary')).toHaveValue(/Debt changes behavior/i);
    await expect(page.locator('#lessonReflectionAnswer')).toHaveValue(/plain language/i);
  });

  test('creating a review page opens a real runtime review page and persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Retrieval review');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('review');
    await page.locator('#pageForm').getByLabel(/Description/i).fill('Practice questions for this source.');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/page\.html\?pageId=/);
    await expect(page.getByRole('heading', { name: /Retrieval review/i })).toBeVisible();
    await expect(page.getByText(/Review page/i)).toBeVisible();

    await page.locator('#reviewIntro').fill('Use these prompts for quick recall.');
    await page.locator('#reviewPrompts textarea[data-field="question"]').first().fill('What creates dependence in the model?');
    await page.locator('#reviewPrompts textarea[data-field="answer"]').first().fill('Debt and refinancing pressure.');
    await expect(page.locator('#status')).toContainText(/Saved locally/i);
    await page.reload();

    await expect(page.locator('#reviewIntro')).toHaveValue(/quick recall/i);
    await expect(page.locator('#reviewPrompts textarea[data-field="question"]').first()).toHaveValue(/creates dependence/i);
    await expect(page.locator('#reviewPrompts textarea[data-field="answer"]').first()).toHaveValue(/refinancing pressure/i);
  });

  test('creating a notes page opens a real runtime notes page and persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Working notes');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('notes');
    await page.locator('#pageForm').getByLabel(/Description/i).fill('Loose project notes and reframing.');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/page\.html\?pageId=/);
    const createdNotesUrl = page.url();
    await expect(page.getByRole('heading', { name: /Working notes/i })).toBeVisible();
    await expect(page.getByText(/Notes page/i)).toBeVisible();

    await page.locator('#notesBody').fill('Capture what feels unstable or worth revisiting.');
    await page.locator('#notesNextStep').fill('Return after the next source pass.');
    await expect(page.locator('#status')).toContainText(/Saved locally/i);
    await page.reload();

    await expect(page.locator('#notesBody')).toHaveValue(/worth revisiting/i);
    await expect(page.locator('#notesNextStep')).toHaveValue(/next source pass/i);

    await page.goto(projectPath);
    const notesCard = page.locator('.page-card').filter({ hasText: 'Working notes' });
    await expect(notesCard.getByRole('link', { name: /Open notes/i })).toHaveAttribute(
      'href',
      /page\.html\?pageId=/,
    );
    await notesCard.getByRole('link', { name: /Open notes/i }).click();
    await expect(page).toHaveURL(createdNotesUrl);
    await expect(page.getByRole('heading', { name: /Working notes/i })).toBeVisible();
  });

  test('page runtime dispatches seeded lesson and map pages through their compatibility entrypoints', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(`${pageRuntimePath}?pageId=simon-dixon-linear-lesson`);
    await expect(page).toHaveURL(/\/prototypes\/current\/lesson\.html\?pageId=simon-dixon-linear-lesson/);
    await expect(page.getByRole('heading', { name: /linear lesson: debt, assets, power, and exit/i })).toBeVisible();

    await page.goto(`${pageRuntimePath}?pageId=simon-dixon-debt-power-map`);
    await expect(page).toHaveURL(/\/prototypes\/current\/mindmap\.html\?pageId=simon-dixon-debt-power-map/);
    await expect(page.getByRole('heading', { name: /^debt-power map$/i })).toBeVisible();
  });

  test('page runtime shows a safe not-found state for missing or invalid page ids', async ({ page }) => {
    await clearWorkspaceDatabase(page);

    await page.goto(pageRuntimePath);
    await expect(page.getByRole('heading', { name: /Choose a page/i })).toBeVisible();
    await expect(page.locator('#backToProject')).toHaveAttribute('href', 'project.html');
    await expect(page.locator('#compatibilityLink')).toBeHidden();
    await expect(page.locator('#compatibilityLink')).not.toHaveAttribute('href', '#');

    await page.goto(`${pageRuntimePath}?pageId=missing-page`);
    await expect(page.getByRole('heading', { name: /Page not found/i })).toBeVisible();
    await expect(page.locator('#backToProject')).toHaveAttribute(
      'href',
      'project.html?projectId=geopolitics-economics',
    );
    await expect(page.getByRole('link', { name: /Back to project/i }).first()).toHaveAttribute(
      'href',
      'project.html?projectId=geopolitics-economics',
    );
  });

  test('legacy metadata-only map pages open through runtime and recover page state', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    const legacyPageId = 'legacy-live-map-page';
    await page.evaluate(
      ({ dbName, pageId }) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(dbName);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(['pages'], 'readwrite');
            const timestamp = new Date().toISOString();
            tx.objectStore('pages').put({
              id: pageId,
              projectId: 'geopolitics-economics',
              title: 'Legacy live map page',
              type: 'map',
              description: 'Old live metadata record without a runtime page state.',
              route: 'project.html?projectId=geopolitics-economics',
              slug: 'legacy-live-map-page',
              protected: false,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          };
        }),
      { dbName: workspaceDbName, pageId: legacyPageId },
    );

    await page.reload();
    const legacyCard = page.locator('.page-card').filter({ hasText: 'Legacy live map page' });
    const openMap = legacyCard.getByRole('link', { name: /Open map/i });
    await expect(openMap).toHaveAttribute('href', `page.html?pageId=${legacyPageId}`);
    await openMap.click();

    await expect(page).toHaveURL(new RegExp(`/prototypes/current/mindmap\\.html\\?pageId=${legacyPageId}`));
    await expect(page.getByRole('heading', { name: /Legacy live map page/i })).toBeVisible();
    await expect(page.locator('.map-node', { hasText: 'Main idea' })).toBeVisible();

    const recoveredKind = await page.evaluate(async (pageId) => {
      const runtime = window as Window & {
        neuroMapWorkspaceStore?: {
          getPageState: (pageId: string) => Promise<{ data?: { kind?: string } } | null>;
        };
      };
      const state = await runtime.neuroMapWorkspaceStore?.getPageState(pageId);
      return state?.data?.kind || '';
    }, legacyPageId);
    expect(recoveredKind).toBe('map-workspace');

    await page.reload();
    await expect(page.getByRole('heading', { name: /Legacy live map page/i })).toBeVisible();
    await expect(page.locator('.map-node', { hasText: 'Main idea' })).toBeVisible();
  });

  test('creating a map page opens a functioning map page and keeps map state isolated by pageId', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Blank systems map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByLabel(/Description/i).fill('A fresh map page for my own restructuring.');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/mindmap\.html\?pageId=/);
    const createdMapUrl = page.url();
    await expect(page.getByRole('heading', { name: /Blank systems map/i })).toBeVisible();
    await expect(page.locator('.map-node')).toHaveCount(1);
    await expect(page.locator('.map-node', { hasText: 'Main idea' })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeVisible();

    await page.getByRole('button', { name: /Add central question/i }).click();
    await expect(page.locator('.map-node')).toHaveCount(2);
    await expect(page.locator('.map-node', { hasText: 'Central question' })).toBeVisible();
    await expect(page.locator('#saveStatus')).toContainText(/Added block/i);
    await page.reload();
    await expect(page.locator('.map-node', { hasText: 'Central question' })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeHidden();

    await page.goto(`${pageRuntimePath}?pageId=simon-dixon-debt-power-map`);
    await expect(page.locator('.map-node')).toHaveCount(13);
    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();

    await page.goto(createdMapUrl);
    await expect(page.getByRole('heading', { name: /Blank systems map/i })).toBeVisible();
    await expect(page.locator('.map-node')).toHaveCount(2);
  });

  test('map status feedback uses a transient toast without stretching the header', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 760 });
    await resetMindmap(page);
    await page.locator('#btnWorkbenchToggle').click({ force: true });
    await expect(page.locator('#workbenchDrawer')).toBeVisible();

    await page.getByRole('button', { name: /Reset to 100 percent/i }).click();

    const toast = page.locator('#toast');
    await expect(toast).toContainText(/View reset/i);
    await expect(toast).toHaveClass(/show/);
    await expectNoBoxOverlap(toast, page.locator('#workbenchDrawer'), 'view reset toast and workbench', 4);
    await expectNoBoxOverlap(toast, page.locator('#zoomDock .toolbar-group'), 'view reset toast and zoom dock', 4);
    await expect(page.locator('#saveStatus')).toContainText(/View reset/i);
    const statusBox = await page.locator('#saveStatus').boundingBox();
    expect(statusBox?.width ?? 0).toBeLessThan(4);
    const topbarBox = await visibleBoundingBox(page.locator('.topbar'), 'map header after status toast');
    expect(topbarBox.height).toBeLessThan(150);
    await expectNoHorizontalOverflow(page);
    await expect.poll(async () => page.locator('#toast').evaluate((el) => el.classList.contains('show'))).toBe(false);
  });

  test('map workbench placement mode opens, cancels, and creates question and evidence blocks', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Workbench starter map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page).toHaveURL(/\/prototypes\/current\/mindmap\.html\?pageId=/);
    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeVisible();
    await expect(page.locator('#workbenchAddConcept')).toBeVisible();
    await expect(page.locator('#workbenchAddQuestion')).toBeVisible();
    await expect(page.locator('#workbenchAddEvidence')).toBeVisible();
    await expect(page.locator('#workbenchAddDocument')).toBeVisible();

    await page.locator('#btnWorkbenchClose').click();
    await expect(page.locator('#workbenchDrawer')).toBeHidden();
    await expectUsableCanvasHeight(page);
    await page.locator('#btnWorkbenchToggle').click();
    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    const reopenWorkbench = async () => {
      if (await page.locator('#workbenchDrawer').isHidden()) {
        await page.locator('#btnWorkbenchToggle').click({ force: true });
        await expect(page.locator('#workbenchDrawer')).toBeVisible();
      }
    };

    await page.locator('#workbenchAddConcept').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place concept block/i);
    await expect(page.locator('#placementOverlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#placementOverlay')).toBeHidden();
    await expect(page.locator('.map-node.type-concept', { hasText: /New concept/i })).toHaveCount(0);

    await reopenWorkbench();
    await page.locator('#workbenchAddQuestion').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place question block/i);
    await clickCanvasAt(page, { xRatio: 0.42, yRatio: 0.42 });
    await expect(page.locator('.map-node.type-question', { hasText: /Question to answer|Central question/i })).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeHidden();

    await reopenWorkbench();
    await page.locator('#workbenchAddEvidence').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place evidence block/i);
    await clickCanvasAt(page, { xRatio: 0.34, yRatio: 0.62 });
    await expect(page.locator('.map-node.type-evidence', { hasText: /Evidence block/i })).toBeVisible();
    await expect(page.locator('#saveStatus')).toContainText(/Evidence block placed/i);

    await reopenWorkbench();
    await page.locator('#workbenchAddDocument').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place document block/i);
    await clickCanvasAt(page, { xRatio: 0.5, yRatio: 0.66 });
    await expect(page.locator('.map-node.type-document')).toContainText(/Simon Dixon debt-power interview\/model/i);

    await page.waitForTimeout(350);
    await page.reload();
    await expect(page.locator('.map-node.type-question')).toBeVisible();
    await expect(page.locator('.map-node.type-evidence')).toBeVisible();
    await expect(page.locator('.map-node.type-document')).toBeVisible();
    await expect(page.locator('#mapStarterPanel')).toBeHidden();
  });

  test('map workbench creates a persistent movable and linkable document block from project sources', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Workbench source map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await page.locator('#workbenchDocumentList [data-workbench-document-id]').first().click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place document block/i);
    await clickCanvasAt(page, { xRatio: 0.45, yRatio: 0.52 });

    const documentNode = page.locator('.map-node.type-document').first();
    await expect(documentNode).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expect(documentNode.locator('.document-type-badge')).not.toHaveText('');
    const documentNodeId = await documentNode.getAttribute('data-id');
    const documentId = await documentNode.getAttribute('data-document-id');
    expect(documentNodeId).toBeTruthy();
    expect(documentId).toBeTruthy();

    await page.locator('.map-node[data-id="core"]').click();
    await page.locator('#btnConnect').click();
    await documentNode.click();
    await expect(page.locator('#edgeLayer g.edge-group')).toHaveCount(1);
    await expect(page.locator('#saveStatus')).toContainText(/Connected/i);
    await page.waitForTimeout(500);

    const before = await documentNode.boundingBox();
    await dragByHandle(page, documentNodeId!, { pointerType: 'touch', deltaX: 82, deltaY: 54 });
    const after = await documentNode.boundingBox();
    expect(after?.x).not.toBe(before?.x);
    await expect(page.locator('#edgeLayer g.edge-group')).toHaveCount(1);

    await page.reload();
    const persistedDocumentNode = page.locator(`.map-node.type-document[data-document-id="${documentId}"]`);
    await expect(persistedDocumentNode).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expect(page.locator('#edgeLayer g.edge-group')).toHaveCount(1);
  });

  test('map workbench overlays keep zoom dock, shelf, toast, and document blocks separated', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.setViewportSize({ width: 1000, height: 760 });
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Overlay safe source map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await expectNoBoxOverlap(page.locator('#workbenchDrawer'), page.locator('#zoomDock .toolbar-group'), 'workbench drawer and zoom dock', 4);
    await page.locator('#btnZoomIn').click();
    await expect(page.locator('#btnZoomPercent')).not.toHaveText('100%');

    await page.locator('#workbenchDocumentList [data-workbench-document-id]').first().click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place document block/i);
    await clickCanvasAt(page, { xRatio: 0.42, yRatio: 0.58 });
    const documentNode = page.locator('.map-node.type-document').first();
    await expect(documentNode).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expect(page.locator('#toast')).toContainText(/Document block added/i);
    await expect(page.locator('#selectionShelf')).toBeVisible();

    await expectNoBoxOverlap(documentNode, page.locator('#workbenchDrawer'), 'document block and workbench drawer', 4);
    await expectNoBoxOverlap(documentNode, page.locator('.toolbar'), 'document block and toolbar', 4);
    await expectNoBoxOverlap(documentNode, page.locator('#zoomDock .toolbar-group'), 'document block and zoom dock', 4);
    await expectNoBoxOverlap(documentNode, page.locator('#selectionShelf'), 'document block and selected shelf', 4);
    await expectNoBoxOverlap(page.locator('#toast'), page.locator('#workbenchDrawer'), 'document toast and workbench drawer', 4);
    await expectNoBoxOverlap(page.locator('#toast'), page.locator('#zoomDock .toolbar-group'), 'document toast and zoom dock', 4);
    await expectNoHorizontalOverflow(page);
  });

  test('map placement nudges new blocks away from occupied nodes', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.setViewportSize({ width: 1000, height: 760 });
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Placement collision map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    const mainIdea = page.locator('.map-node[data-id="core"]', { hasText: 'Main idea' });
    await expect(mainIdea).toBeVisible();
    await page.locator('#workbenchAddQuestion').click();
    await expect(page.locator('#placementOverlay')).toContainText(/question block/i);
    await clickLocatorCenter(page, mainIdea, 'main idea occupied placement target');

    const questionNode = page.locator('.map-node.type-question', { hasText: /Question to answer/i });
    await expect(questionNode).toBeVisible();
    await expectNoBoxOverlap(questionNode, mainIdea, 'nudged question and main idea', 8);
    await expectNoBoxOverlap(questionNode, page.locator('#workbenchDrawer'), 'nudged question and workbench', 4);
  });

  test('map workbench stays canvas-safe at medium and narrow widths', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.setViewportSize({ width: 900, height: 760 });
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Responsive workbench map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await expectFreshMapNodeClearOfOverlays(page);
    await expect(page.locator('#zoomDock')).toBeVisible();
    await expectWorkbenchControlsClearOfZoom(page, 'medium workbench and zoom dock');
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 520, height: 760 });
    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await expect(page.locator('#btnWorkbenchClose')).toBeVisible();
    await expect(page.locator('#zoomDock')).toBeVisible();
    await expectWorkbenchControlsClearOfZoom(page, 'narrow workbench and zoom dock');
    await expectNoHorizontalOverflow(page);
    await page.locator('#workbenchAddQuestion').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place question block/i);
    await expect(page.locator('#workbenchDrawer')).toBeHidden();
    await clickCanvasAt(page, { xRatio: 0.48, yRatio: 0.5 });
    await expect(page.locator('.map-node.type-question')).toBeVisible();
    await expect(page.locator('#zoomDock')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectUsableCanvasHeight(page, 360);
  });

  test('map placement overlay stays clear of zoom dock at medium width', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.setViewportSize({ width: 1000, height: 760 });
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Placement overlay lane map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await page.locator('#workbenchAddConcept').click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place concept block/i);
    await expectNoBoxOverlap(page.locator('#placementOverlay'), page.locator('#zoomDock .toolbar-group'), 'medium placement overlay and zoom dock', 4);
    await expectNoHorizontalOverflow(page);
  });

  test('map placement overlay and collapsed workbench handle stay clear at narrow width', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Narrow placement lane map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#workbenchDrawer')).toBeVisible();
    await page.locator('#workbenchDocumentList [data-workbench-document-id]').first().click();
    await expect(page.locator('#placementOverlay')).toContainText(/Tap the canvas to place document block/i);
    await expect(page.locator('#workbenchDrawer')).toBeHidden();
    await expect(page.locator('#btnWorkbenchToggle')).toBeVisible();
    await expectNoBoxOverlap(page.locator('#placementOverlay'), page.locator('#zoomDock .toolbar-group'), 'narrow placement overlay and zoom dock', 4);
    await expectNoBoxOverlap(page.locator('#btnWorkbenchToggle'), page.locator('#zoomDock .toolbar-group'), 'narrow workbench handle and zoom dock', 4);

    await clickCanvasAt(page, { xRatio: 0.36, yRatio: 0.3 });
    const documentNode = page.locator('.map-node.type-document').first();
    await expect(documentNode).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expectNoBoxOverlap(documentNode, page.locator('#zoomDock .toolbar-group'), 'narrow document block and zoom dock', 4);
    await expectNoBoxOverlap(documentNode, page.locator('#selectionShelf'), 'narrow document block and selected shelf', 4);
    await expectNoBoxOverlap(page.locator('#btnWorkbenchToggle'), page.locator('#zoomDock .toolbar-group'), 'narrow workbench handle and zoom dock after placement', 4);
    await expectNoHorizontalOverflow(page);
  });

  test('new map starter can add document blocks or explain when no documents exist', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(projectPath);

    await openDetails(page, '#pageCreatePanel');
    await page.locator('#pageForm').getByLabel(/Title/i).fill('Starter document map');
    await page.locator('#pageForm').getByLabel(/Type/i).selectOption('map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#mapStarterPanel')).toBeVisible();
    await page.getByRole('button', { name: /Add source\/document block/i }).click();
    await expect(page.locator('#documentPicker')).toBeVisible();
    await page.locator('#documentPicker').getByRole('button', { name: /Simon Dixon debt-power/i }).click();
    await expect(page.locator('.map-node.type-document')).toContainText(/Simon Dixon debt-power interview\/model/i);

    await page.goto('/');
    await page.getByLabel(/Workspace topbar/i).getByRole('button', { name: /^New project$/i }).click();
    await page.getByLabel(/Project title/i).fill('No document project');
    await page.getByLabel(/Theme or domain/i).fill('starter');
    await page.getByLabel(/Short description/i).fill('A project with no documents.');
    await page.getByRole('button', { name: /create project locally/i }).click();
    await page.locator('.project-card').filter({ hasText: 'No document project' }).getByRole('link', { name: /Open project/i }).click();
    await page.getByRole('button', { name: /Create a map page/i }).click();
    await page.locator('#pageForm').getByLabel(/Title/i).fill('No docs map');
    await page.locator('#pageForm').getByRole('button', { name: /Create page/i }).click();

    await expect(page.locator('#mapStarterPanel')).toBeVisible();
    const addDocumentFirst = page.getByRole('button', { name: /Add a document first/i });
    await expect(addDocumentFirst).toBeVisible();
    await expect(addDocumentFirst).toBeDisabled();
    await expect(page.locator('#starterDocumentHint')).toContainText(/Add document metadata/i);
  });

  test('seeded map migrates legacy localStorage into page-owned state without deleting the legacy save', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(mindmapPath);

    const legacyKey = 'simon-dixon-debt-power-learning-workspace-v17';
    await page.evaluate(({ key }) => {
      localStorage.clear();
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 18,
          activePageId: 'page-main',
          pages: [
            {
              id: 'page-main',
              title: 'Migrated debt-power map',
              map: {
                version: 19,
                view: { x: 0, y: 0, scale: 1 },
                nodes: [
                  {
                    id: 'legacy-core',
                    title: 'Migrated idea',
                    body: 'Legacy localStorage content.',
                    group: 'blue',
                    shape: 'card',
                    importance: 3,
                    x: -40,
                    y: -20,
                    w: 300,
                    h: 160,
                    tag: 'legacy',
                  },
                ],
                edges: [],
              },
            },
          ],
        }),
      );
    }, { key: legacyKey });

    await page.goto(`${mindmapPath}?pageId=simon-dixon-debt-power-map`);
    await expect(page.locator('.map-node', { hasText: 'Migrated idea' })).toBeVisible();

    const storedKind = await page.evaluate(async () => {
      const runtime = window as Window & {
        neuroMapWorkspaceStore?: {
          getPageState: (
            pageId: string,
          ) => Promise<{ data?: { kind?: string } } | null>;
        };
      };
      const state = await runtime.neuroMapWorkspaceStore?.getPageState('simon-dixon-debt-power-map');
      return state?.data?.kind || '';
    });
    expect(storedKind).toBe('map-workspace');

    const legacyStillExists = await page.evaluate((key) => localStorage.getItem(key), legacyKey);
    expect(legacyStillExists).not.toBeNull();
  });

  test('learning map loads article-specific blocks and keeps ports outside block bounds', async ({ page }) => {
    await resetMindmap(page);

    await expect(page.getByRole('heading', { name: /^debt-power map$/i })).toBeVisible();
    await expect(page.locator('#projectKicker')).toContainText(/Geopolitics & Economics/i);
    await expect(page.locator('#projectKicker')).toContainText(/Editable map/i);
    await expect(page.locator('#projectKicker')).toHaveAttribute('title', /Project: Geopolitics & Economics/);
    await expect(page.locator('#projectKicker')).toHaveAttribute('title', /Page: Editable map/);
    await expect(page.locator('.topbar')).not.toContainText(/Advanced learning map app/i);
    await expect(page.locator('.topbar')).not.toContainText(/Simon Dixon’s debt-power model/i);
    await expect(page.getByRole('link', { name: /project/i })).toHaveAttribute(
      'href',
      /project\.html\?projectId=geopolitics-economics/,
    );
    await expect(page.getByRole('link', { name: /open related lesson/i })).toHaveAttribute(
      'href',
      /page\.html\?pageId=simon-dixon-linear-lesson/,
    );
    await expect(page.locator('.map-node')).toHaveCount(13);
    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();
    await expect(page.locator('.map-node', { hasText: 'Money starts as debt' })).toBeVisible();
    await expect(page.locator('.connection-port')).toHaveCount(52);

    const geometry = await page.locator('.map-node[data-id="core"]').evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const top = node.querySelector('.connection-port.port-top')?.getBoundingClientRect();
      const right = node.querySelector('.connection-port.port-right')?.getBoundingClientRect();
      const bottom = node.querySelector('.connection-port.port-bottom')?.getBoundingClientRect();
      const left = node.querySelector('.connection-port.port-left')?.getBoundingClientRect();
      return {
        node: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
        top: top ? { top: top.top, right: top.right, bottom: top.bottom, left: top.left } : null,
        right: right ? { top: right.top, right: right.right, bottom: right.bottom, left: right.left } : null,
        bottom: bottom ? { top: bottom.top, right: bottom.right, bottom: bottom.bottom, left: bottom.left } : null,
        left: left ? { top: left.top, right: left.right, bottom: left.bottom, left: left.left } : null,
      };
    });

    expect(geometry.top).not.toBeNull();
    expect(geometry.right).not.toBeNull();
    expect(geometry.bottom).not.toBeNull();
    expect(geometry.left).not.toBeNull();
    expect(geometry.top!.bottom).toBeLessThanOrEqual(geometry.node.top + 3);
    expect(geometry.right!.left).toBeGreaterThanOrEqual(geometry.node.right - 3);
    expect(geometry.bottom!.top).toBeGreaterThanOrEqual(geometry.node.bottom - 3);
    expect(geometry.left!.right).toBeLessThanOrEqual(geometry.node.left + 3);
  });

  test('learning map recenter and zoom controls do not blank the canvas', async ({ page }) => {
    await resetMindmap(page);

    const zoomDock = page.locator('#zoomDock');
    await expect(zoomDock).toBeVisible();
    await expect(page.locator('.toolbar #btnZoomIn')).toHaveCount(0);

    const dockBox = await zoomDock.boundingBox();
    const viewport = page.viewportSize();
    if (!dockBox || !viewport) {
      throw new Error('Zoom dock should have a bounding box within the viewport.');
    }
    expect(dockBox.x).toBeGreaterThan(viewport.width * 0.55);
    expect(dockBox.y).toBeGreaterThan(viewport.height * 0.45);

    await page.getByRole('button', { name: /zoom in/i }).click();
    await page.getByRole('button', { name: /zoom out/i }).click();
    await page.getByRole('button', { name: /recenter full map/i }).click();

    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();
  });

  test('learning map keeps right-click menus for block, link, and canvas', async ({ page }) => {
    await resetMindmap(page);

    await contextMenu(page.locator('.map-node[data-id="core"]'));
    await expect(page.getByRole('button', { name: /add linked block/i }).first()).toBeVisible();

    await contextMenu(page.locator('.edge-label').first());
    await expect(page.getByRole('button', { name: /rename link label/i })).toBeVisible();

    const stage = page.locator('#stage');
    const stageBox = await stage.boundingBox();
    if (!stageBox) throw new Error('Stage should be visible for canvas menu test.');
    await contextMenu(stage, { x: stageBox.width - 120, y: stageBox.height - 120 });
    await expect(page.getByRole('button', { name: /add free block here/i })).toBeVisible();
  });

  test('selected block toolbar appears and can add a linked block', async ({ page }) => {
    await resetMindmap(page);

    await page.locator('.map-node[data-id="core"]').click();
    await expect(page.locator('#selectionShelf')).toBeVisible();
    await expect(page.getByRole('button', { name: /add linked block from selected block/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change selected block style/i })).toBeVisible();

    await page.getByRole('button', { name: /add linked block from selected block/i }).click();
    await expect(page.locator('.map-node')).toHaveCount(14);
  });

  test('map can create a movable and linkable document reference block', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await resetMindmap(page);

    await page.getByRole('button', { name: /add document reference block/i }).click();
    await expect(page.locator('#documentPicker')).toBeVisible();
    await page.locator('#documentPicker').getByRole('button', { name: /Simon Dixon debt-power/i }).click();

    const documentNode = page.locator('.map-node.type-document').first();
    await expect(documentNode).toBeVisible();
    await expect(documentNode).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expect(documentNode).toHaveAttribute('data-document-id', 'simon-dixon-debt-power');

    const documentNodeId = await documentNode.getAttribute('data-id');
    if (!documentNodeId) {
      throw new Error('Document reference block should have a node id.');
    }

    const before = await documentNode.boundingBox();
    await dragByHandle(page, documentNodeId, { pointerType: 'touch', deltaX: 96, deltaY: 60 });
    const after = await documentNode.boundingBox();
    expect(after?.x).not.toBe(before?.x);

    await page.locator('.map-node[data-id="core"]').click();
    await page.locator('#btnConnect').click();
    await documentNode.click();
    await expect(page.locator('#edgeLayer g.edge-group')).toHaveCount(15);

    await documentNode.getByRole('button', { name: /open document details/i }).click();
    await expect(page.locator('#documentDetailCard')).toBeVisible();
    await expect(page.locator('#documentDetailCard')).toContainText(/Simon Dixon debt-power interview\/model/i);
  });

  test('new linked block edges re-anchor after moving under zoom', async ({ page }) => {
    await resetMindmap(page);

    await page.locator('.map-node[data-id="core"]').click();
    await page.getByRole('button', { name: /add linked block from selected block/i }).click();
    await expect(page.locator('.map-node')).toHaveCount(14);

    const newNode = page.locator('.map-node', { hasText: 'New linked idea' }).last();
    const newNodeId = await newNode.getAttribute('data-id');
    if (!newNodeId) {
      throw new Error('Expected the new linked block to have a data-id.');
    }

    const before = await getEdgeSnapshot(page);
    if (!before?.endpoint) {
      throw new Error('Expected a connected edge snapshot before moving the linked block.');
    }

    await page.getByRole('button', { name: /zoom in/i }).click();
    await dragByHandle(page, newNodeId, { pointerType: 'touch', deltaX: -260, deltaY: -220 });

    const after = await getEdgeSnapshot(page);
    if (!after?.endpoint) {
      throw new Error('Expected a connected edge snapshot after moving the linked block.');
    }

    expect(after.d).not.toBe(before.d);
    expect(after.hitD).toBe(after.d);
    expect(after.labelLeft).not.toBe(before.labelLeft);
    expect(after.labelTop).not.toBe(before.labelTop);

    const attachment = await page.locator(`.map-node[data-id="${newNodeId}"]`).evaluate((node, endpoint) => {
      if (!endpoint) return null;
      const left = Number.parseFloat((node as HTMLElement).style.left || '0');
      const top = Number.parseFloat((node as HTMLElement).style.top || '0');
      const width = Number.parseFloat((node as HTMLElement).style.width || '268');
      const height = Number.parseFloat((node as HTMLElement).style.height || '145');
      const ports = [
        { x: left + width / 2, y: top - 6 },
        { x: left + width + 6, y: top + height / 2 },
        { x: left + width / 2, y: top + height + 6 },
        { x: left - 6, y: top + height / 2 },
      ];
      const distances = ports.map((port) => Math.hypot(port.x - endpoint.x, port.y - endpoint.y));
      return Math.min(...distances);
    }, after.endpoint);

    expect(attachment).not.toBeNull();
    expect(attachment!).toBeLessThan(28);
  });

  test('selected link toolbar exposes relationship controls', async ({ page }) => {
    await resetMindmap(page);

    await syntheticClick(page.locator('.edge-label').first());
    await expect(page.locator('#selectionShelf')).toBeVisible();
    await expect(page.getByRole('button', { name: /edit selected link label/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change selected link relationship type/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change selected link route/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change selected link source connection side/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /change selected link target connection side/i })).toBeVisible();
  });

  test('selected toolbar dismisses on canvas and Escape, stays usable inside, and returns after drag', async ({ page }) => {
    await resetMindmap(page);

    const shelf = page.locator('#selectionShelf');
    const coreNode = page.locator('.map-node[data-id="core"]');
    await coreNode.click();
    await expect(shelf).toBeVisible();

    await page.getByRole('button', { name: /collapse selected item toolbar/i }).click();
    await expect(shelf).toBeVisible();

    const stage = page.locator('#stage');
    const stageBox = await stage.boundingBox();
    if (!stageBox) {
      throw new Error('Stage should have a bounding box for deselect testing.');
    }
    const blankX = stageBox.x + stageBox.width / 2;
    const blankY = stageBox.y + stageBox.height - 140;
    await stage.dispatchEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: 1,
      pointerId: 333,
      pointerType: 'mouse',
      clientX: blankX,
      clientY: blankY,
    });
    await stage.dispatchEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: 0,
      pointerId: 333,
      pointerType: 'mouse',
      clientX: blankX,
      clientY: blankY,
    });
    await syntheticClick(stage, { x: stageBox.width / 2, y: stageBox.height - 140 });
    await expect(shelf).toBeHidden();

    await coreNode.click();
    await expect(shelf).toBeVisible();
    await page.locator('#stage').focus();
    await page.keyboard.press('Escape');
    await expect(shelf).toBeHidden();

    await coreNode.click();
    await expect(shelf).toBeVisible();
    const drag = await beginHandleDrag(page, 'core', { pointerType: 'touch', deltaX: 72, deltaY: 52 });
    await expect(shelf).toBeHidden();
    await drag.moveTarget.dispatchEvent('pointerup', {
      ...drag.payload,
      buttons: 0,
      pressure: 0,
      clientX: drag.moveX,
      clientY: drag.moveY,
    });
    await expect(shelf).toBeVisible();
  });

  test('touch long-press opens block and canvas menus', async ({ page }) => {
    await resetMindmap(page);

    const coreNode = page.locator('.map-node[data-id="core"]');
    await longPress(coreNode, { pointerId: 51 });
    await expect(page.getByRole('button', { name: /add linked block/i }).first()).toBeVisible();

    await page.keyboard.press('Escape');
    await longPress(page.locator('#stage'), { pointerId: 52, x: 84, y: 96 });
    await expect(page.getByRole('button', { name: /add free block here/i })).toBeVisible();
  });

  test('touch long-press on an edge hit target opens the link menu and suppresses duplicate contextmenu', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await page.getByRole('button', { name: /expand input diagnostics/i }).click();

    const hitTarget = page.locator('.edge-hit').first();
    const hitWidth = await hitTarget.evaluate((path) => Number(path.getAttribute('stroke-width') || '0'));
    expect(hitWidth).toBeGreaterThanOrEqual(32);

    await longPress(hitTarget, { pointerId: 61 });
    await expect(page.getByRole('button', { name: /rename link label/i })).toBeVisible();
    await expect(page.locator('#selectionShelf')).toBeVisible();
    await expect(log).toContainText('mode=edge');
    await expect(log).toContainText('hit=edge-hit-target');
    await expect(log).toContainText('edge=e1');
    await expect(log).not.toContainText('mode=canvas | reason=long-press');

    await contextMenu(page.locator('#stage'), { x: 120, y: 120 });
    await expect(log).toContainText('contextmenu-suppressed');
    await expect(log).not.toContainText('mode=canvas | reason=contextmenu');
    await expect(page.getByRole('button', { name: /add free block here/i })).toHaveCount(0);
  });

  test('touch long-press on a node opens one node menu and suppresses follow-up menu contextmenu', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await page.getByRole('button', { name: /expand input diagnostics/i }).click();

    const coreNode = page.locator('.map-node[data-id="core"]');
    await longPress(coreNode, { pointerId: 58 });

    await expect(page.locator('#contextMenu')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#contextMenu').getByRole('button', { name: /add linked block/i })).toBeVisible();
    expect(await countDebugOccurrences(log, 'menu-open')).toBe(1);
    await expect(log).toContainText('mode=node');
    await expect(log).toContainText('reason=long-press');
    await expect(log).not.toContainText('mode=canvas | reason=contextmenu | target=div#contextMenu.menu');

    await contextMenu(page.locator('#contextMenu'), { x: 18, y: 18 });
    await expect(log).toContainText('contextmenu-suppressed');
    await expect(log).toContainText('mode=node | reason=recent-long-press');
    await expect(log).not.toContainText('mode=canvas | reason=contextmenu | target=div#contextMenu.menu');
    expect(await countDebugOccurrences(log, 'menu-open')).toBe(1);
  });

  test('touch drag handle moves a node and keeps touch-action plus capture diagnostics', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await page.getByRole('button', { name: /expand input diagnostics/i }).click();
    const clearButton = page.getByRole('button', { name: /clear diagnostics log/i });
    if (await clearButton.isEnabled()) {
      await clearButton.click();
    }

    const touchActions = await page.evaluate(() => ({
      stage: getComputedStyle(document.getElementById('stage')!).touchAction,
      nodeLayer: getComputedStyle(document.getElementById('nodeLayer')!).touchAction,
      handle: getComputedStyle(document.querySelector('.drag-handle')!).touchAction,
    }));
    expect(touchActions.stage).toBe('none');
    expect(touchActions.nodeLayer).toBe('none');
    expect(touchActions.handle).toBe('none');

    const before = await page.locator('.map-node[data-id="core"]').evaluate((node) => ({
      left: node.getBoundingClientRect().left,
      top: node.getBoundingClientRect().top,
    }));

    await dragByHandle(page, 'core', { pointerType: 'touch' });

    const after = await page.locator('.map-node[data-id="core"]').evaluate((node) => ({
      left: node.getBoundingClientRect().left,
      top: node.getBoundingClientRect().top,
    }));

    expect(Math.abs(after.left - before.left)).toBeGreaterThan(20);
    expect(Math.abs(after.top - before.top)).toBeGreaterThan(20);
    await expect(log).toContainText('drag-start');
    await expect(log).toContainText('capture-requested');
    await expect(log).toContainText('drag-end');
    await expect(log).not.toContainText('reason=pointercancel');
  });

  test('drag contextmenu is suppressed during active and recent drag, and gesture lock clears after drag', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await page.getByRole('button', { name: /expand input diagnostics/i }).click();

    const { handle, moveTarget, payload, moveX, moveY } = await beginHandleDrag(page, 'core', { pointerType: 'touch' });

    const lockStateDuringDrag = await page.evaluate(() => ({
      body: document.body.classList.contains('drag-gesture-lock'),
      stage: document.getElementById('stage')!.classList.contains('drag-gesture-lock'),
      nodeLayer: document.getElementById('nodeLayer')!.classList.contains('drag-gesture-lock'),
    }));
    expect(lockStateDuringDrag.body).toBe(true);
    expect(lockStateDuringDrag.stage).toBe(true);
    expect(lockStateDuringDrag.nodeLayer).toBe(true);

    await contextMenu(handle);
    await expect(log).toContainText('contextmenu-suppressed');
    await expect(log).toContainText('reason=active-drag');
    await expect(page.locator('#contextMenu')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#contextMenu').getByRole('button', { name: /add linked block/i })).toHaveCount(0);
    await expect(page.locator('#contextMenu').getByRole('button', { name: /add free block here/i })).toHaveCount(0);

    await moveTarget.dispatchEvent('pointerup', { ...payload, buttons: 0, pressure: 0, clientX: moveX, clientY: moveY });
    await contextMenu(handle);
    await expect(log).toContainText('reason=recent-drag');

    const lockStateAfterDrag = await page.evaluate(() => ({
      body: document.body.classList.contains('drag-gesture-lock'),
      stage: document.getElementById('stage')!.classList.contains('drag-gesture-lock'),
      nodeLayer: document.getElementById('nodeLayer')!.classList.contains('drag-gesture-lock'),
    }));
    expect(lockStateAfterDrag.body).toBe(false);
    expect(lockStateAfterDrag.stage).toBe(false);
    expect(lockStateAfterDrag.nodeLayer).toBe(false);

    const titleState = await page.locator('.map-node[data-id="core"] .node-title').evaluate((el) => {
      el.focus();
      const htmlEl = el instanceof HTMLElement ? el : null;
      return {
        active: document.activeElement === el,
        editable: htmlEl ? htmlEl.isContentEditable : false,
        userSelect: getComputedStyle(el).userSelect,
      };
    });
    expect(titleState.active).toBe(true);
    expect(titleState.editable).toBe(true);
    expect(titleState.userSelect).toBe('text');
  });

  test('input diagnostics stay hidden by default', async ({ page }) => {
    await resetMindmap(page);

    await expect(page.locator('#inputDebugPanel')).toBeHidden();
  });

  test('header keeps instructions hidden by default and help drawer exposes quick tips', async ({ page }) => {
    await resetMindmap(page);

    await expect(page.locator('.topbar')).not.toContainText(
      /use pages, block shapes, connection ports, and relationship lines to encode meaning/i,
    );

    await page.getByRole('button', { name: /toggle legend/i }).click();
    await expect(page.locator('#legendCard')).toBeVisible();
    await expect(page.locator('#legendCard')).toContainText(/quick map tips/i);
    await expect(page.locator('#legendCard')).toContainText(/move blocks to test your understanding/i);
    await expect(page.locator('#legendCard')).toContainText(/focus and recenter when the map feels overwhelming/i);
  });

  test('input diagnostics can be enabled, expanded, logged, and cleared', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/collapsed/);

    await page.getByRole('button', { name: /expand input diagnostics/i }).click();
    await expect(panel).not.toHaveClass(/collapsed/);
    await expect(page.getByRole('button', { name: /copy diagnostics log/i })).toBeVisible();

    await pointerTap(page.locator('.map-node[data-id="core"]'));
    await expect(log).toContainText('tap');
    await expect(log).toContainText('pen');
    await expect(log).toContainText('pressure=');

    await page.getByRole('button', { name: /clear diagnostics log/i }).click();
    await expect(log).toHaveText(/no recent input yet\./i);
  });

  test('input diagnostics retain more than 25 recent events', async ({ page }) => {
    await resetMindmap(page, debugMindmapPath);

    const panel = page.locator('#inputDebugPanel');
    const log = page.locator('#inputDebugLog');
    await expect(panel).toBeVisible();
    await page.getByRole('button', { name: /expand input diagnostics/i }).click();

    const coreNode = page.locator('.map-node[data-id="core"]');
    for (let i = 0; i < 30; i += 1) {
      await pointerTap(coreNode, { pointerId: 120 + i, pointerType: 'touch', pressure: 0.5 });
    }

    expect(await countDebugLines(log)).toBeGreaterThan(25);
    await expect(page.locator('#inputDebugSummary')).toContainText('/150 recent interactions');
    await expect(page.getByRole('button', { name: /copy diagnostics log/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear diagnostics log/i })).toBeEnabled();
  });

  test('selected toolbar stays inside the viewport on a tablet-ish layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await resetMindmap(page);

    await page.locator('.map-node[data-id="core"]').click();
    const shelf = page.locator('#selectionShelf');
    await expect(shelf).toBeVisible();

    const box = await shelf.boundingBox();
    if (!box) {
      throw new Error('Selection shelf should have a bounding box on tablet viewport.');
    }

    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(768);
    expect(box.y + box.height).toBeLessThanOrEqual(1024);
  });

  test('lesson prototype includes glossary and read-aloud controls', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto(lessonPath);
    await expect(page.getByRole('heading', { name: /linear lesson: debt, assets, power, and exit/i })).toBeVisible();
    await expect(page.getByLabel(/project breadcrumb/i)).toContainText(/Neuro Map Studio/i);
    await expect(page.getByLabel(/project breadcrumb/i)).toContainText(/Project: Geopolitics & Economics/i);
    await expect(page.getByLabel(/project breadcrumb/i)).toContainText(/Source: Simon Dixon debt-power interview\/model/i);
    await expect(page.getByLabel(/project breadcrumb/i)).toContainText(/Page: Linear lesson/i);
    await expect(page.getByRole('link', { name: /back to project/i })).toHaveAttribute(
      'href',
      'project.html?projectId=geopolitics-economics',
    );
    await expect(page.getByRole('heading', { name: /Related project documents/i })).toBeVisible();
    await expect(page.locator('#relatedDocuments')).toContainText(/Simon Dixon debt-power interview\/model/i);
    await expect(page.getByRole('link', { name: /open editable learning map/i }).first()).toHaveAttribute(
      'href',
      /page\.html\?pageId=simon-dixon-debt-power-map/,
    );
    const readControls = page.locator('.read-toolbar, .reader-toolbar, [aria-label*="Read"], [aria-label*="read"]');
    expect(await readControls.count()).toBeGreaterThan(0);
  });
});
