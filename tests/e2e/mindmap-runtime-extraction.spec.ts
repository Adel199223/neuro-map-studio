import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const mindmapPath = '/prototypes/current/mindmap.html';

function readSource(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

test.describe('mindmap runtime asset extraction', () => {
  test('mindmap html loads external CSS and module script without giant inline blocks', () => {
    const html = readSource('public/prototypes/current/mindmap.html');

    expect(html).toContain('<link rel="stylesheet" href="./mindmap.css">');
    expect(html).toContain('<script type="module" src="./mindmap.js"></script>');

    const inlineStyleBodies = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)).map(
      (match) => match[1] ?? '',
    );
    const inlineScriptBodies = Array.from(
      html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
    ).map((match) => match[1] ?? '');

    expect(inlineStyleBodies.every((body) => body.length < 10_000)).toBe(true);
    expect(inlineScriptBodies.every((body) => body.length < 20_000)).toBe(true);
    expect(html).not.toContain('const stage = document.getElementById');
    expect(html).not.toContain(':root{');
  });

  test('extracted CSS and JS keep map runtime markers', () => {
    const css = readSource('public/prototypes/current/mindmap.css');
    const js = readSource('public/prototypes/current/mindmap.js');

    for (const marker of [
      ':root',
      '.map-node',
      '.edge-group',
      '.connection-port',
      '.map-workbench',
      '.review-panel',
      '.input-debug',
      '.placement-overlay',
      '@media (pointer:coarse)',
    ]) {
      expect(css).toContain(marker);
    }

    for (const marker of [
      './workspace-store.js',
      'savePageState',
      'runtimePageId',
      'debugInput',
      'buildReviewNextCards',
      'buildWeakReviewCards',
      'insertBlockBetweenRelationship',
      'reconnectTarget',
      'startConnect',
      './mindmapConstants.js',
      './mindmapDomUtils.js',
      './mindmapGeometry.js',
      './mindmapReviewHelpers.js',
      './mindmapStorageHelpers.js',
      './mindmapRelationshipHelpers.js',
      './mindmapMenuHelpers.js',
    ]) {
      expect(js).toContain(marker);
    }
  });

  test('low-risk runtime modules are imported by the entrypoint', () => {
    const html = readSource('public/prototypes/current/mindmap.html');
    const js = readSource('public/prototypes/current/mindmap.js');
    const constants = readSource('public/prototypes/current/mindmapConstants.js');
    const domUtils = readSource('public/prototypes/current/mindmapDomUtils.js');
    const geometry = readSource('public/prototypes/current/mindmapGeometry.js');
    const reviewHelpers = readSource('public/prototypes/current/mindmapReviewHelpers.js');
    const storageHelpers = readSource('public/prototypes/current/mindmapStorageHelpers.js');
    const relationshipHelpers = readSource('public/prototypes/current/mindmapRelationshipHelpers.js');
    const menuHelpers = readSource('public/prototypes/current/mindmapMenuHelpers.js');

    expect(html).toContain('<script type="module" src="./mindmap.js"></script>');
    expect(html).not.toContain('src="./mindmapConstants.js"');
    expect(html).not.toContain('src="./mindmapDomUtils.js"');
    expect(html).not.toContain('src="./mindmapGeometry.js"');
    expect(html).not.toContain('src="./mindmapReviewHelpers.js"');
    expect(html).not.toContain('src="./mindmapStorageHelpers.js"');
    expect(html).not.toContain('src="./mindmapRelationshipHelpers.js"');
    expect(html).not.toContain('src="./mindmapMenuHelpers.js"');

    for (const marker of [
      './mindmapConstants.js',
      './mindmapDomUtils.js',
      './mindmapGeometry.js',
      './mindmapReviewHelpers.js',
      './mindmapStorageHelpers.js',
      './mindmapRelationshipHelpers.js',
      './mindmapMenuHelpers.js',
    ]) {
      expect(js).toContain(marker);
    }

    for (const marker of [
      'export const relationStyles',
      'export const defaultMap',
      'export const REVIEW_RATING_LABELS',
      'export const PORT_OUTSET',
    ]) {
      expect(constants).toContain(marker);
    }

    for (const marker of [
      'export function clean',
      'export function cloneJson',
      'export function escapeHtml',
      'export function isCanvasGestureBlockedTarget',
    ]) {
      expect(domUtils).toContain(marker);
    }

    for (const marker of [
      './mindmapConstants.js',
      'export function clamp',
      'export function rectsOverlap',
      'export function portPoint',
      'export function edgeGeometry',
    ]) {
      expect(geometry).toContain(marker);
    }

    for (const marker of [
      './mindmapConstants.js',
      './mindmapDomUtils.js',
      'export function normalizeReviewStore',
      'export function createMapReviewCards',
      'export function buildReviewNextCards',
      'export function buildWeakReviewCards',
      'export function reviewStats',
      'export function reviewHistoryText',
    ]) {
      expect(reviewHelpers).toContain(marker);
    }

    for (const marker of [
      './workspace-store.js',
      './mindmapConstants.js',
      './mindmapDomUtils.js',
      './mindmapGeometry.js',
      'export function normalizeMap',
      'export function normalizeWorkspace',
      'export function buildMapPageStatePayload',
      'export function buildWorkspaceExportPayload',
      'export function scheduleAutosave',
    ]) {
      expect(storageHelpers).toContain(marker);
    }

    for (const marker of [
      './mindmapConstants.js',
      './mindmapGeometry.js',
      'export function findDirectedRelationship',
      'export function reverseRelationship',
      'export function changeRelationshipEndpoint',
      'export function buildInsertBetweenRelationshipPayload',
      'export function relationshipReviewCleanupCardIds',
    ]) {
      expect(relationshipHelpers).toContain(marker);
    }

    for (const marker of [
      './mindmapConstants.js',
      'export function buildPortQuickAddMenuItems',
      'export function buildRelationshipContextMenuItems',
      'export function buildInsertBetweenMenuItems',
      'export function buildPortSideMenuItems',
    ]) {
      expect(menuHelpers).toContain(marker);
    }
  });

  test('map route renders blocks and relationships through extracted assets', async ({ page }) => {
    await page.goto(`${mindmapPath}?assetExtractionSmoke=1`);

    await expect(page.locator('.map-node').first()).toBeVisible();
    await expect(page.locator('#edgeLayer g.edge-group').first()).toBeVisible();
    await expect(page.locator('#btnReviewMap')).toBeVisible();

    const assetStatus = await page.evaluate(() => {
      const styleLoaded = Boolean(document.querySelector('link[href="./mindmap.css"]'));
      const scriptLoaded = Boolean(document.querySelector('script[src="./mindmap.js"]'));
      const styledNode = document.querySelector('.map-node');
      const computed = styledNode ? window.getComputedStyle(styledNode) : null;

      return {
        styleLoaded,
        scriptLoaded,
        background: computed?.backgroundColor ?? '',
        borderRadius: computed?.borderRadius ?? '',
      };
    });

    expect(assetStatus.styleLoaded).toBe(true);
    expect(assetStatus.scriptLoaded).toBe(true);
    expect(assetStatus.background).not.toBe('');
    expect(assetStatus.borderRadius).not.toBe('');
  });
});
