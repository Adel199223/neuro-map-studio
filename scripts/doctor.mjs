import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const required = [
  'AGENTS.md',
  'CODEX_PROMPT.md',
  'LICENSE',
  'PLANS.md',
  'README.md',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  '.github/workflows/pages.yml',
  '.agents/skills/a11y-learning-review/SKILL.md',
  '.agents/skills/learning-map-feature/SKILL.md',
  '.agents/skills/prototype-migration/SKILL.md',
  'docs/architecture.md',
  'docs/architecture/local-first-workspace.md',
  'docs/codex/codex-setup.md',
  'docs/handoffs/current-main-handoff.md',
  'docs/handoffs/chatgpt-continuation-handoff.md',
  'docs/product/current-state.md',
  'docs/product/learning-model.md',
  'docs/product/product-requirements.md',
  'docs/product/interaction-contract.md',
  'docs/product/neuroscience-learning-principles.md',
  'docs/product/tablet-pen-sync-architecture.md',
  'docs/qa/current-smoke-checklist.md',
  'docs/qa/galaxy-tab-spen-manual-qa.md',
  'docs/roadmap/next-slices.md',
  'public/prototypes/current/project.html',
  'public/prototypes/current/project-data.js',
  'public/prototypes/current/workspace-store.js',
  'public/prototypes/current/page.html',
  'public/prototypes/current/mindmap.html',
  'public/prototypes/current/mindmap.css',
  'public/prototypes/current/mindmap.js',
  'public/prototypes/current/mindmapConstants.js',
  'public/prototypes/current/mindmapDomUtils.js',
  'public/prototypes/current/mindmapGeometry.js',
  'public/prototypes/current/mindmapReviewHelpers.js',
  'public/prototypes/current/lesson.html',
  'scripts/review-package-config.mjs',
  'scripts/create-review-zip.mjs',
  'scripts/verify-review-zip.mjs',
  'src/App.tsx',
  'src/main.tsx',
  'src/styles/global.css',
  'src/features/learning-map/workspaceCore.ts',
  'src/features/learning-map/types.ts',
  'src/data/simonDixonSeed.ts',
  'tests/e2e/prototype.spec.ts',
  'tests/e2e/mindmap-runtime-extraction.spec.ts',
  'tests/e2e/workspace-core.spec.ts',
];

const missing = required.filter((file) => !existsSync(join(root, file)));

if (missing.length) {
  console.error('Missing required files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const errors = [];

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

function expectIncludes(file, expected) {
  const source = read(file);
  for (const snippet of expected) {
    if (!source.includes(snippet)) {
      errors.push(`${file} is missing expected content: ${snippet}`);
    }
  }
}

function expectEither(file, snippets, label) {
  const source = read(file);
  if (!snippets.some((snippet) => source.includes(snippet))) {
    errors.push(`${file} is missing expected content for ${label}: ${snippets.join(' OR ')}`);
  }
}

function expectNoLargeInlineBlocks(file, tagName, { maxBytes, maxLines }) {
  const source = read(file);
  const pattern = new RegExp(`<${tagName}(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');

  for (const match of source.matchAll(pattern)) {
    const body = match[1] ?? '';
    const byteCount = Buffer.byteLength(body, 'utf8');
    const lineCount = body.split('\n').length;

    if (byteCount > maxBytes || lineCount > maxLines) {
      errors.push(
        `${file} contains a large inline <${tagName}> block (${lineCount} lines, ${byteCount} bytes). Use external files for map runtime assets.`,
      );
    }
  }
}

function expectOrderedSubstrings(value, ordered, label) {
  let cursor = -1;
  for (const snippet of ordered) {
    const next = value.indexOf(snippet, cursor + 1);
    if (next === -1) {
      errors.push(`${label} is missing expected step: ${snippet}`);
      return;
    }
    cursor = next;
  }
}

const pkg = JSON.parse(read('package.json'));
const normalScripts = ['dev', 'build', 'typecheck', 'lint', 'test:e2e', 'doctor', 'check'];
const packageScripts = ['package:review', 'package:verify'];
const missingScripts = [...normalScripts, ...packageScripts].filter((script) => !pkg.scripts?.[script]);

if (missingScripts.length) {
  errors.push(`package.json is missing required npm scripts: ${missingScripts.join(', ')}`);
}

if (!pkg.devDependencies?.['@types/node']) {
  errors.push('package.json is missing @types/node for Node-side typechecking.');
}

if (!pkg.scripts?.typecheck?.includes('tsc -b')) {
  errors.push('package.json script "typecheck" must use TypeScript build mode.');
}

if (!pkg.scripts?.build?.includes('tsc -b') || !pkg.scripts?.build?.includes('vite build')) {
  errors.push('package.json script "build" must include TypeScript build mode and Vite build.');
}

expectOrderedSubstrings(
  pkg.scripts?.check ?? '',
  ['npm run doctor', 'npm run lint', 'npm run build', 'npm run test:e2e'],
  'package.json script "check"',
);

expectIncludes('AGENTS.md', [
  'Current source-of-truth branch',
  '/home/fa507/dev/neuro-map-studio-codex',
  'Sources & blocks panel',
  'selection toolbar',
  'notification bubble',
  'pageId-scoped map state',
  'JSON workspace backup/export/import',
  'Do not run `package:review` or `package:verify` unless explicitly asked.',
]);

expectIncludes('CODEX_PROMPT.md', [
  'Current architecture summary',
  'page.html?pageId=<id>',
  'Sources & blocks panel',
  'Normal checks',
  'Do not push, merge, delete branches',
]);

expectIncludes('README.md', [
  'local-first ADHD/dyslexia-friendly learning workspace',
  'Project hub',
  'Sources & blocks panel',
  'placement mode',
  'docs/handoffs/current-main-handoff.md',
  'docs/architecture/local-first-workspace.md',
  'Do not run packaging scripts or create a zip unless explicitly asked.',
]);

expectIncludes('docs/handoffs/current-main-handoff.md', [
  'Latest shipped feature baseline',
  '7b062803a309b21daeda74e11a6b0183931d0f58',
  'Sources & blocks panel',
  'pageId-scoped map state',
]);

expectIncludes('docs/handoffs/chatgpt-continuation-handoff.md', [
  'Latest shipped feature baseline',
  'Source-of-truth branch: main',
  'Sources & blocks panel',
  'Normal checks',
]);

expectIncludes('docs/product/current-state.md', [
  'Workspace Dashboard',
  'Project Hub',
  'Sources & blocks panel',
  'Document blocks preserve `documentId`',
  'Backup And Restore',
]);

expectIncludes('docs/product/learning-model.md', [
  'Active Restructuring',
  'Retrieval Practice',
  'Dual Coding',
  'Semantic Relationships',
  'Tablet And S Pen Flow',
]);

expectIncludes('docs/architecture/local-first-workspace.md', [
  'neuro-map-studio-local-workspace',
  'pageDocumentLinks',
  'pageStates',
  'pageId-scoped map workspace state',
  'Backup JSON',
]);

expectIncludes('docs/qa/galaxy-tab-spen-manual-qa.md', [
  'Sources & blocks panel',
  'Selection toolbar',
  'Notification bubble',
  'Zoom controls',
  'S Pen',
  '?debugInput=1',
]);

expectIncludes('docs/qa/current-smoke-checklist.md', [
  'Workspace Dashboard',
  'Project Hub',
  'Sources & blocks panel',
  'placement mode',
  'backup',
]);

expectIncludes('docs/roadmap/next-slices.md', [
  'Source And Document Workflow',
  'Review And Retrieval Pages',
  'Relationship Editing',
  'Backup Safety',
  'Future Operation Log',
]);

expectIncludes('vite.config.ts', ['GITHUB_PAGES', '/neuro-map-studio/']);
expectIncludes('.github/workflows/pages.yml', [
  'actions/configure-pages',
  'actions/upload-pages-artifact',
  'actions/deploy-pages',
]);

expectIncludes('src/main.tsx', ['createRoot', '<App />']);
expectIncludes('src/App.tsx', [
  'Workspace board',
  'Recent pages & diagrams',
  'exportWorkspaceBackup',
  'importWorkspaceBackup',
  'Backup and restore',
  'pageRuntimeHref',
]);
expectIncludes('src/styles/global.css', [
  '.workspace-frame',
  '.workspace-rail',
  '.board-grid',
  '.app-dialog',
  'Comic Sans',
]);

expectIncludes('public/prototypes/current/workspace-store.js', [
  'neuro-map-studio-local-workspace',
  'STORE_NAMES',
  'projects',
  'documents',
  'pages',
  'pageDocumentLinks',
  'pageStates',
  'getWorkspaceSnapshot',
  'exportWorkspaceBackup',
  'importWorkspaceBackup',
  'createProject',
  'createDocument',
  'createPage',
  'savePageState',
  'linkPageDocument',
  'pageRuntimeHref',
]);

expectIncludes('public/prototypes/current/project.html', [
  'Project hub',
  'Pages board',
  'Documents board',
  'Utilities',
  'Page document references',
  'New map',
  'New page',
  'Add document',
  'pageRuntimeHref',
]);

expectIncludes('public/prototypes/current/page.html', [
  'Page runtime',
  'pageId',
  'Related documents',
  'Page content',
  'savePageState',
  'mindmap.html',
  'lesson.html',
]);

expectIncludes('public/prototypes/current/mindmap.html', [
  './mindmap.css',
  'type="module" src="./mindmap.js"',
  'Sources &amp; blocks',
  'placementOverlay',
  'workbenchAddConcept',
  'workbenchAddQuestion',
  'workbenchAddEvidence',
  'workbenchAddDocument',
  'selectionShelf',
  'toast',
  'zoomDock',
]);
expectNoLargeInlineBlocks('public/prototypes/current/mindmap.html', 'style', { maxBytes: 10_000, maxLines: 120 });
expectNoLargeInlineBlocks('public/prototypes/current/mindmap.html', 'script', { maxBytes: 20_000, maxLines: 240 });
expectEither('public/prototypes/current/mindmap.html', ['btnResetView', 'Reset to 100 percent'], 'reset view control');

expectIncludes('public/prototypes/current/mindmap.css', [
  ':root',
  '.map-node',
  '.edge-group',
  '.connection-port',
  '.map-workbench',
  '.selection-shelf',
  '.review-panel',
  '.input-debug',
  '.placement-overlay',
  '@media (pointer:coarse)',
  '@media print',
]);

expectIncludes('public/prototypes/current/mindmap.js', [
  './workspace-store.js',
  './mindmapConstants.js',
  './mindmapDomUtils.js',
  './mindmapGeometry.js',
  './mindmapReviewHelpers.js',
  'data-workbench-document-id',
  'documentId',
  'debugInput',
  'savePageState',
  'runtimePageId',
  'buildReviewNextCards',
  'buildWeakReviewCards',
  'insertBlockBetweenRelationship',
  'startConnect',
  'reconnectTarget',
]);

expectIncludes('public/prototypes/current/mindmapConstants.js', [
  'export const relationStyles',
  'export const defaultMap',
  'export const REVIEW_RATING_LABELS',
  'export const PORT_OUTSET',
]);

expectIncludes('public/prototypes/current/mindmapDomUtils.js', [
  'export function clean',
  'export function cloneJson',
  'export function escapeHtml',
  'export function isCanvasGestureBlockedTarget',
]);

expectIncludes('public/prototypes/current/mindmapGeometry.js', [
  './mindmapConstants.js',
  'export function clamp',
  'export function rectsOverlap',
  'export function portPoint',
  'export function edgeGeometry',
]);

expectIncludes('public/prototypes/current/mindmapReviewHelpers.js', [
  './mindmapConstants.js',
  './mindmapDomUtils.js',
  'export function normalizeReviewStore',
  'export function createMapReviewCards',
  'export function buildReviewNextCards',
  'export function buildWeakReviewCards',
  'export function reviewStats',
  'export function reviewHistoryText',
  'export function relationshipReviewCardId',
]);

expectIncludes('public/prototypes/current/lesson.html', [
  'glossary',
  'read',
  'href="mindmap.html"',
  'href="project.html"',
]);

expectIncludes('public/prototypes/current/project-data.js', [
  'geopolitics-economics',
  'simon-dixon-debt-power',
  'simon-dixon-linear-lesson',
  'simon-dixon-debt-power-map',
  'page.html?pageId=',
]);

expectIncludes('tests/e2e/prototype.spec.ts', [
  'workspace backup export includes schema metadata',
  'workspace backup import rejects invalid JSON',
  'page runtime dispatches seeded lesson and map pages',
  'map workbench placement mode opens',
  'creates a persistent movable and linkable document block',
  '?debugInput=1',
]);

if (errors.length) {
  console.error('Doctor check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Doctor check passed. Current main harness contract looks consistent.');
