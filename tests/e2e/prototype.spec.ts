import { expect, test, type Locator, type Page } from '@playwright/test';

const mindmapPath = '/prototypes/current/mindmap.html';
const debugMindmapPath = `${mindmapPath}?debugInput=1`;
const lessonPath = '/prototypes/current/lesson.html';

async function resetMindmap(page: Page, path = mindmapPath) {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function longPress(locator: Locator, options: { pointerId?: number; x?: number; y?: number } = {}) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Could not determine locator bounding box for long-press test.');
  }
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
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Could not determine locator bounding box for context-menu test.');
  }
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
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Could not determine locator bounding box for synthetic click test.');
  }
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

test.describe('current standalone prototypes', () => {
  test('root app exposes prototype entry links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /open current learning map prototype/i })).toHaveAttribute(
      'href',
      '/prototypes/current/mindmap.html',
    );
    await expect(page.getByRole('link', { name: /open current lesson prototype/i })).toHaveAttribute(
      'href',
      '/prototypes/current/lesson.html',
    );
  });

  test('learning map loads article-specific blocks and keeps ports outside block bounds', async ({ page }) => {
    await resetMindmap(page);

    await expect(page.getByRole('heading', { name: /debt-power model/i })).toBeVisible();
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

  test('touch long-press opens block and canvas menus', async ({ page }) => {
    await resetMindmap(page);

    const coreNode = page.locator('.map-node[data-id="core"]');
    await longPress(coreNode, { pointerId: 51 });
    await expect(page.getByRole('button', { name: /add linked block/i }).first()).toBeVisible();

    await page.keyboard.press('Escape');
    await longPress(page.locator('#stage'), { pointerId: 52, x: 84, y: 96 });
    await expect(page.getByRole('button', { name: /add free block here/i })).toBeVisible();
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

  test('input diagnostics stay hidden by default', async ({ page }) => {
    await resetMindmap(page);

    await expect(page.locator('#inputDebugPanel')).toBeHidden();
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
    await page.goto(lessonPath);
    await expect(page.getByRole('heading', { name: /debt-power map/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open editable learning map/i }).first()).toBeVisible();
    const readControls = page.locator('.read-toolbar, .reader-toolbar, [aria-label*="Read"], [aria-label*="read"]');
    expect(await readControls.count()).toBeGreaterThan(0);
  });
});
