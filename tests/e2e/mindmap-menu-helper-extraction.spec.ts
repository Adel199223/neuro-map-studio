import { expect, test } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(testDirectory, '../..');
const helperUrl = pathToFileURL(resolve(root, 'public/prototypes/current/mindmapMenuHelpers.js')).href;

type MenuDescriptor = {
  type?: string;
  label?: string;
  action?: string;
  title?: string;
  ariaLabel?: string;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  borderColor?: string;
};

async function loadHelpers() {
  return import(`${helperUrl}?cache=${Date.now()}`);
}

function actions(items: MenuDescriptor[]) {
  return items.map((item) => item.action).filter(Boolean);
}

test.describe('mindmap menu helper extraction', () => {
  test('builds port quick-add descriptors with current labels and actions', async () => {
    const { buildPortQuickAddMenuItems } = await loadHelpers();
    const items = buildPortQuickAddMenuItems() as MenuDescriptor[];

    expect(items).toContainEqual({
      label: 'Connect existing block',
      action: 'port-connect-existing',
      title: 'Connect this block to another existing block',
      ariaLabel: 'Connect existing block from this port',
    });
    expect(items).toContainEqual({ type: 'section', label: 'Create new linked block' });
    expect(actions(items)).toEqual([
      'port-connect-existing',
      'port-add-concept',
      'port-add-question',
      'port-add-evidence',
      'port-add-document',
    ]);
  });

  test('builds relationship context descriptors without moving action execution', async () => {
    const { buildRelationshipContextMenuItems, buildRelationshipContextMenuTitle } = await loadHelpers();
    const items = buildRelationshipContextMenuItems({
      relationLabel: 'supports',
      relationNote: 'example or support',
    }) as MenuDescriptor[];

    expect(buildRelationshipContextMenuTitle({ fromTitle: 'A', toTitle: 'B' })).toBe('A — B');
    expect(buildRelationshipContextMenuTitle({})).toBe('Block — Block');
    expect(items).toContainEqual({ label: '✎ Rename link label', action: 'edge-label' });
    expect(items).toContainEqual({ label: '⇄ Reverse direction', action: 'edge-reverse' });
    expect(items).toContainEqual({
      label: 'Insert block between',
      action: 'edge-insert-between',
      title: 'Insert block between',
      ariaLabel: 'Insert block between',
    });
    expect(items).toContainEqual({
      label: 'Change source',
      action: 'edge-change-source',
      title: 'Change source',
      ariaLabel: 'Change source',
    });
    expect(items).toContainEqual({
      label: 'Change target',
      action: 'edge-change-target',
      title: 'Change target',
      ariaLabel: 'Change target',
    });
    expect(items).toContainEqual({ type: 'section', label: 'Relationship type' });
    expect(items).toContainEqual({ type: 'section', label: 'Line route' });
    expect(items).toContainEqual({ type: 'section', label: 'From-side connection point' });
    expect(items).toContainEqual({ type: 'section', label: 'To-side connection point' });
    expect(items).toContainEqual({ label: 'Delete this link', action: 'edge-delete', danger: true });
    expect(items).toContainEqual({ label: 'supports: example or support', action: 'noop', disabled: true });
  });

  test('builds insert-between and port-side menu descriptors', async () => {
    const { buildInsertBetweenMenuItems, buildPortSideMenuItems } = await loadHelpers();

    expect(buildInsertBetweenMenuItems()).toEqual([
      { label: 'Concept block', action: 'insert-concept' },
      { label: 'Question block', action: 'insert-question' },
      { label: 'Evidence block', action: 'insert-evidence' },
      { label: 'Document block', action: 'insert-document' },
    ]);
    expect(buildPortSideMenuItems('from')).toEqual([
      { label: 'auto', action: 'port-from-auto' },
      { label: 'top', action: 'port-from-top' },
      { label: 'right', action: 'port-from-right' },
      { label: 'bottom', action: 'port-from-bottom' },
      { label: 'left', action: 'port-from-left' },
    ]);
    expect(buildPortSideMenuItems('to')).toEqual([
      { label: 'auto', action: 'port-to-auto' },
      { label: 'top', action: 'port-to-top' },
      { label: 'right', action: 'port-to-right' },
      { label: 'bottom', action: 'port-to-bottom' },
      { label: 'left', action: 'port-to-left' },
    ]);
  });

  test('builds row descriptors while preserving source inputs', async () => {
    const {
      buildColorMenuItems,
      buildEdgeShapeMenuItems,
      buildLinkedDirectionMenuItems,
      buildMenuRowItems,
      buildRelationTypeMenuItems,
      buildShapeMenuItems,
      buildSizeMenuItems,
      buildStrengthMenuItems,
    } = await loadHelpers();
    const relationInput = { custom: { label: 'custom relation', color: '#123456', note: 'keep' } };
    const sizeInput = { tiny: { w: 100, h: 80 } };
    const before = JSON.stringify({ relationInput, sizeInput });

    expect(buildColorMenuItems(['blue'])).toEqual([
      {
        label: 'B',
        action: 'color-blue',
        title: 'Color: blue',
        ariaLabel: 'Color: blue',
        className: 'dot-blue',
      },
    ]);
    expect(buildShapeMenuItems(['card'])).toEqual([{ label: 'card', action: 'shape-card' }]);
    expect(buildSizeMenuItems(sizeInput)).toEqual([{ label: 'tiny', action: 'size-tiny' }]);
    expect(buildRelationTypeMenuItems(relationInput)).toEqual([
      { label: 'custom relation', action: 'relation-custom', borderColor: '#123456' },
    ]);
    expect(buildStrengthMenuItems([1, 3, 5])).toEqual([
      { label: '1', action: 'strength-1' },
      { label: '3', action: 'strength-3' },
      { label: '5', action: 'strength-5' },
    ]);
    expect(buildEdgeShapeMenuItems(['curve'])).toEqual([{ label: 'curve', action: 'edge-shape-curve' }]);
    expect(buildLinkedDirectionMenuItems(['top', 'left'])).toEqual([
      { label: 'top', action: 'add-linked-top' },
      { label: 'left', action: 'add-linked-left' },
    ]);
    expect(buildMenuRowItems('relations').some((item: MenuDescriptor) => item.action === 'relation-causes')).toBe(true);
    expect(buildMenuRowItems('unknown')).toEqual([]);
    expect(JSON.stringify({ relationInput, sizeInput })).toBe(before);
  });

  test('builds block, canvas, and page menu descriptors with current disabled states', async () => {
    const { buildCanvasContextMenuItems, buildNodeContextMenuItems, buildPageMenuItems } = await loadHelpers();

    expect(buildNodeContextMenuItems({ isDocumentNode: true, canConnectPending: true })).toEqual(
      expect.arrayContaining([
        { label: '▣ Open document details', action: 'document-details' },
        { label: '⛓ Connect pending source to this', action: 'connect-pending' },
        { label: 'Delete block', action: 'delete-node', danger: true },
      ]),
    );
    expect(buildCanvasContextMenuItems({ hasSelectedBlock: false, focusMode: true })).toEqual(
      expect.arrayContaining([
        { label: '＋↗ Add linked block from selected here', action: 'add-linked-here', disabled: true },
        { label: '◉ Turn focus mode off', action: 'toggle-focus' },
      ]),
    );
    expect(
      buildPageMenuItems({
        pages: [
          { id: 'page-1', title: 'First map' },
          { id: 'page-2', title: '' },
        ],
        activePageId: 'page-1',
        canDelete: false,
      }),
    ).toEqual(
      expect.arrayContaining([
        { label: '✓ First map', action: 'switch-page-page-1' },
        { label: 'Untitled view', action: 'switch-page-page-2' },
        { label: 'Delete current map view', action: 'delete-page', danger: true, disabled: true },
      ]),
    );
  });
});
