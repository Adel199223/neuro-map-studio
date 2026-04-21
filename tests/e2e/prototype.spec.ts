import { expect, test } from '@playwright/test';

const mindmapPath = '/prototypes/current/mindmap.html';
const lessonPath = '/prototypes/current/lesson.html';

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

  test('learning map loads article-specific blocks', async ({ page }) => {
    await page.goto(mindmapPath);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: /debt-power model/i })).toBeVisible();
    await expect(page.locator('.map-node')).toHaveCount(13);
    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();
    await expect(page.locator('.map-node', { hasText: 'Money starts as debt' })).toBeVisible();
    await expect(page.locator('.connection-port')).toHaveCount(52);
  });

  test('learning map recenter and zoom controls do not blank the canvas', async ({ page }) => {
    await page.goto(mindmapPath);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: /zoom in/i }).click();
    await page.getByRole('button', { name: /zoom out/i }).click();
    await page.getByRole('button', { name: /recenter full map/i }).click();

    await expect(page.locator('.map-node', { hasText: 'Core claim' })).toBeVisible();
  });

  test('lesson prototype includes glossary and read-aloud controls', async ({ page }) => {
    await page.goto(lessonPath);
    await expect(page.getByRole('heading', { name: /debt-power map/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /open editable learning map/i }).first()).toBeVisible();
    const readControls = page.locator('.read-toolbar, .reader-toolbar, [aria-label*="Read"], [aria-label*="read"]');
    expect(await readControls.count()).toBeGreaterThan(0);
  });
});
