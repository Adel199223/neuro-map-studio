import { expect, test, type Locator, type Page } from '@playwright/test';

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

test.describe('current standalone prototypes', () => {
  test('root app exposes prototype entry links', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /build calm learning projects from documents/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open current project/i })).toHaveAttribute(
      'href',
      '/prototypes/current/project.html?projectId=geopolitics-economics',
    );
    await expect(page.getByRole('heading', { name: /Geopolitics & Economics/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create project locally/i })).toBeVisible();
    await expect(page.getByText(/Development links/i)).toBeVisible();
  });

  test('root workspace dashboard can create a project that persists after reload', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Project title/i).fill('Neuroscience study');
    await page.getByLabel(/Theme or domain/i).fill('neuroscience');
    await page.getByLabel(/Short description/i).fill('A calm project for memory, attention, and learning.');
    await page.getByRole('button', { name: /create project locally/i }).click();

    await expect(page.getByRole('heading', { name: /Neuroscience study/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: /Neuroscience study/i })).toBeVisible();
  });

  test('empty projects show create prompts instead of dead lesson or map shortcuts', async ({ page }) => {
    await clearWorkspaceDatabase(page);
    await page.goto('/');

    await page.getByLabel(/Project title/i).fill('Empty runtime project');
    await page.getByLabel(/Theme or domain/i).fill('learning lab');
    await page.getByLabel(/Short description/i).fill('A fresh project with no pages yet.');
    await page.getByRole('button', { name: /create project locally/i }).click();

    const projectCard = page.locator('.project-card').filter({ hasText: 'Empty runtime project' });
    await projectCard.getByRole('link', { name: /open project/i }).click();

    await expect(page.getByRole('heading', { name: /Empty runtime project/i })).toBeVisible();
    await expect(page.locator('#primaryLessonLink')).toBeHidden();
    await expect(page.locator('#primaryMapLink')).toBeHidden();
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
    await expect(page.getByRole('heading', { name: /Documents/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pages/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Simon Dixon debt-power interview\/model/i })).toBeVisible();
    await expect(page.locator('#primaryLessonLink')).toHaveAttribute(
      'href',
      'page.html?pageId=simon-dixon-linear-lesson',
    );
    await expect(page.locator('#primaryMapLink')).toHaveAttribute(
      'href',
      'page.html?pageId=simon-dixon-debt-power-map',
    );

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

    await page.locator('#linkPageSelect').selectOption({ label: 'Debt-power map' });
    await page.locator('#linkDocumentSelect').selectOption({ label: 'Central bank explainer' });
    await page.locator('#linkForm').getByLabel(/Relationship/i).selectOption('evidence');
    await page.locator('#linkForm').getByRole('button', { name: /Attach document to page/i }).click();
    await expect(page.getByText(/Debt-power map uses Central bank explainer as evidence/i)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: /Central bank explainer/i })).toBeVisible();
    await expect(page.getByText(/Debt-power map uses Central bank explainer as evidence/i)).toBeVisible();
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
    await expect(notesCard.getByRole('link', { name: /Open page/i })).toHaveAttribute(
      'href',
      /page\.html\?pageId=/,
    );
    await notesCard.getByRole('link', { name: /Open page/i }).click();
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

    await page.getByRole('button', { name: /add free block/i }).click();
    await expect(page.locator('.map-node')).toHaveCount(2);
    await expect(page.locator('#saveStatus')).toContainText(/Added block/i);

    await page.goto(`${pageRuntimePath}?pageId=simon-dixon-debt-power-map`);
    await expect(page.locator('.map-node')).toHaveCount(13);
    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();

    await page.goto(createdMapUrl);
    await expect(page.getByRole('heading', { name: /Blank systems map/i })).toBeVisible();
    await expect(page.locator('.map-node')).toHaveCount(2);
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
    await expect(page.locator('.topbar')).toContainText(/Project: Geopolitics & Economics/i);
    await expect(page.locator('.topbar')).toContainText(/Page: Editable map/i);
    await expect(page.locator('.topbar')).not.toContainText(/Advanced learning map app/i);
    await expect(page.locator('.topbar')).not.toContainText(/Simon Dixon’s debt-power model/i);
    await expect(page.getByRole('link', { name: /project/i })).toHaveAttribute(
      'href',
      /project\.html\?projectId=geopolitics-economics/,
    );
    await expect(page.getByRole('link', { name: /^lesson$/i })).toHaveAttribute(
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
