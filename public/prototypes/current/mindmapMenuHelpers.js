import {
  colors,
  edgeShapes,
  portLabels,
  ports,
  relationStyles,
  shapes,
  sizePresets,
} from './mindmapConstants.js';

const linkedDirections = ['top', 'right', 'bottom', 'left'];
const insertBlockTypes = [
  ['Concept block', 'concept'],
  ['Question block', 'question'],
  ['Evidence block', 'evidence'],
  ['Document block', 'document'],
];

export function createMenuItem(label, action, options = {}) {
  return { label, action, ...options };
}

export function createMenuSection(label) {
  return { type: 'section', label };
}

export function buildColorMenuItems(colorValues = colors) {
  return colorValues.map((color) =>
    createMenuItem(color[0].toUpperCase(), `color-${color}`, {
      title: `Color: ${color}`,
      ariaLabel: `Color: ${color}`,
      className: `dot-${color}`,
    }),
  );
}

export function buildShapeMenuItems(shapeValues = shapes) {
  return shapeValues.map((shape) => createMenuItem(shape, `shape-${shape}`));
}

export function buildSizeMenuItems(presets = sizePresets) {
  return Object.keys(presets).map((preset) => createMenuItem(preset, `size-${preset}`));
}

export function buildImportanceMenuItems(values = [1, 2, 3]) {
  return values.map((value) => createMenuItem('★'.repeat(value), `importance-${value}`));
}

export function buildRelationTypeMenuItems(styles = relationStyles) {
  return Object.entries(styles).map(([key, style]) =>
    createMenuItem(style.label, `relation-${key}`, { borderColor: style.color }),
  );
}

export function buildStrengthMenuItems(values = [1, 2, 3, 4, 5]) {
  return values.map((value) => createMenuItem(String(value), `strength-${value}`));
}

export function buildEdgeShapeMenuItems(shapeValues = edgeShapes) {
  return shapeValues.map((shape) => createMenuItem(shape, `edge-shape-${shape}`));
}

export function buildPortSideMenuItems(end, portValues = ports, labels = portLabels) {
  const prefix = end === 'from' ? 'port-from' : 'port-to';
  return portValues.map((port) => createMenuItem(labels[port] || port, `${prefix}-${port}`));
}

export function buildLinkedDirectionMenuItems(directions = linkedDirections) {
  return directions.map((side) => createMenuItem(side, `add-linked-${side}`));
}

export function buildMenuRowItems(type) {
  if (type === 'colors') return buildColorMenuItems();
  if (type === 'shapes') return buildShapeMenuItems();
  if (type === 'sizes') return buildSizeMenuItems();
  if (type === 'importance') return buildImportanceMenuItems();
  if (type === 'relations') return buildRelationTypeMenuItems();
  if (type === 'strengths') return buildStrengthMenuItems();
  if (type === 'edgeShapes') return buildEdgeShapeMenuItems();
  if (type === 'fromPorts') return buildPortSideMenuItems('from');
  if (type === 'toPorts') return buildPortSideMenuItems('to');
  if (type === 'linkedDirs') return buildLinkedDirectionMenuItems();
  return [];
}

export function buildPortQuickAddMenuItems() {
  return [
    createMenuItem('Connect existing block', 'port-connect-existing', {
      title: 'Connect this block to another existing block',
      ariaLabel: 'Connect existing block from this port',
    }),
    createMenuSection('Create new linked block'),
    ...insertBlockTypes.map(([label, type]) => createMenuItem(label, `port-add-${type}`)),
  ];
}

export function buildInsertBetweenMenuItems() {
  return insertBlockTypes.map(([label, type]) => createMenuItem(label, `insert-${type}`));
}

export function buildBlockStyleMenuItems() {
  return [
    createMenuSection('Block color'),
    { type: 'colors' },
    createMenuSection('Block shape'),
    { type: 'shapes' },
    createMenuSection('Block size'),
    { type: 'sizes' },
    createMenuSection('Importance'),
    { type: 'importance' },
  ];
}

export function buildRelationshipTypeMenuItems() {
  return [createMenuSection('Relationship type'), { type: 'relations' }];
}

export function buildRelationshipStrengthMenuItems() {
  return [createMenuSection('Importance / thickness'), { type: 'strengths' }];
}

export function buildRelationshipRouteMenuItems() {
  return [createMenuSection('Line route'), { type: 'edgeShapes' }];
}

export function buildRelationshipFromPortMenuItems() {
  return [createMenuSection('From-side connection point'), { type: 'fromPorts' }];
}

export function buildRelationshipToPortMenuItems() {
  return [createMenuSection('To-side connection point'), { type: 'toPorts' }];
}

export function buildNodeContextMenuItems({ isDocumentNode = false, canConnectPending = false } = {}) {
  return [
    createMenuItem('✎ Edit title', 'edit-title'),
    createMenuItem('☰ Edit body text', 'edit-body'),
    ...(isDocumentNode ? [createMenuItem('▣ Open document details', 'document-details')] : []),
    createMenuItem('＋ Add linked block', 'add-linked-node'),
    createMenuSection('Add linked block from side'),
    { type: 'linkedDirs' },
    ...(canConnectPending ? [createMenuItem('⛓ Connect pending source to this', 'connect-pending')] : []),
    createMenuItem('⛓ Start connection from this', 'start-connect'),
    createMenuItem('↳ Create detail map view from this block', 'page-from-node'),
    createMenuItem('⧉ Duplicate block', 'duplicate'),
    createMenuItem('◎ Center on this block', 'center-node'),
    ...buildBlockStyleMenuItems(),
    createMenuItem('⌫ Remove all its connections', 'remove-edges'),
    createMenuItem('Delete block', 'delete-node', { danger: true }),
  ];
}

export function buildRelationshipContextMenuTitle({ fromTitle = '', toTitle = '' } = {}) {
  return `${fromTitle || 'Block'} — ${toTitle || 'Block'}`;
}

export function buildRelationshipContextMenuItems({ relationLabel = 'causes', relationNote = '' } = {}) {
  return [
    createMenuItem('✎ Rename link label', 'edge-label'),
    createMenuItem('⇄ Reverse direction', 'edge-reverse'),
    createMenuItem('Insert block between', 'edge-insert-between', {
      title: 'Insert block between',
      ariaLabel: 'Insert block between',
    }),
    createMenuItem('Change source', 'edge-change-source', {
      title: 'Change source',
      ariaLabel: 'Change source',
    }),
    createMenuItem('Change target', 'edge-change-target', {
      title: 'Change target',
      ariaLabel: 'Change target',
    }),
    ...buildRelationshipTypeMenuItems(),
    ...buildRelationshipStrengthMenuItems(),
    ...buildRelationshipRouteMenuItems(),
    ...buildRelationshipFromPortMenuItems(),
    ...buildRelationshipToPortMenuItems(),
    createMenuItem('Delete this link', 'edge-delete', { danger: true }),
    createMenuSection('Current meaning'),
    createMenuItem(`${relationLabel}: ${relationNote}`, 'noop', { disabled: true }),
  ];
}

export function buildCanvasContextMenuItems({ hasSelectedBlock = false, focusMode = false } = {}) {
  return [
    createMenuItem('＋ Add free block here', 'add-free-here'),
    createMenuItem('＋↗ Add linked block from selected here', 'add-linked-here', { disabled: !hasSelectedBlock }),
    createMenuItem('▣ Add document block here', 'add-document-block'),
    createMenuItem('◎ Recenter full map', 'recenter'),
    createMenuItem('1× Reset zoom around selected', 'reset-view'),
    createMenuItem(focusMode ? '◉ Turn focus mode off' : '◉ Turn focus mode on', 'toggle-focus'),
    createMenuItem('↺ Show remember prompt', 'toggle-remember'),
    createMenuItem('? Show visual code', 'toggle-legend'),
    createMenuItem('⌁ Tidy map layout', 'tidy'),
    createMenuItem('＋ Create new map view', 'new-page'),
    createMenuItem('⧉ Duplicate map view', 'duplicate-page'),
    createMenuItem('⇩ Export current map view', 'export'),
    createMenuItem('⇩ Export map workspace backup', 'export-workspace'),
    createMenuItem('⇧ Import map or workspace', 'import-file'),
  ];
}

export function buildPageMenuItems({ pages = [], activePageId = '', canDelete = false } = {}) {
  return [
    createMenuSection('Switch map view'),
    ...pages.map((page) =>
      createMenuItem(`${page.id === activePageId ? '✓ ' : ''}${page.title || 'Untitled view'}`, `switch-page-${page.id}`),
    ),
    createMenuSection('Create and manage'),
    createMenuItem('＋ New blank map view', 'new-page'),
    createMenuItem('⧉ Duplicate current map view', 'duplicate-page'),
    createMenuItem('✎ Rename current map view', 'rename-page'),
    createMenuItem('⇩ Export current map view', 'export'),
    createMenuItem('⇩ Export all map views', 'export-workspace'),
    createMenuItem('Delete current map view', 'delete-page', { danger: true, disabled: !canDelete }),
  ];
}
