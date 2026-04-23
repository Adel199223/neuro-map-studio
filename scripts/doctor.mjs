import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  'docs/architecture.md',
  'docs/codex/codex-setup.md',
  'docs/product/current-prototype-audit.md',
	  'docs/exec-plans/github-pages-live-preview.md',
	  'public/prototypes/current/project.html',
	  'public/prototypes/current/project-data.js',
	  'public/prototypes/current/mindmap.html',
	  'public/prototypes/current/lesson.html',
  'docs/product/product-requirements.md',
  'docs/product/interaction-contract.md',
  'docs/product/neuroscience-learning-principles.md',
  'docs/product/tablet-pen-sync-architecture.md',
  'docs/exec-plans/learning-map-workspace-core.md',
  'docs/exec-plans/harness-repair-tablet-architecture.md',
  'docs/exec-plans/pages-enable-review-package-completeness.md',
  'docs/exec-plans/review-zip-packaging-completeness.md',
  '.github/workflows/pages.yml',
  'scripts/review-package-config.mjs',
  'scripts/create-review-zip.mjs',
  'scripts/verify-review-zip.mjs',
  'src/features/learning-map/workspaceCore.ts',
  'src/features/learning-map/types.ts',
  'src/data/simonDixonSeed.ts',
  'tests/e2e/prototype.spec.ts',
  'tests/e2e/workspace-core.spec.ts',
  '.agents/skills/a11y-learning-review/SKILL.md',
  '.agents/skills/learning-map-feature/SKILL.md',
  '.agents/skills/prototype-migration/SKILL.md',
];

const root = process.cwd();
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

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const neededScripts = [
  'dev',
  'build',
  'typecheck',
  'lint',
  'test:e2e',
  'doctor',
  'check',
  'package:review',
  'package:verify',
];
const missingScripts = neededScripts.filter((script) => !pkg.scripts?.[script]);
if (missingScripts.length) {
  console.error('Missing required npm scripts:', missingScripts.join(', '));
  process.exit(1);
}

if (!pkg.devDependencies?.['@types/node']) {
  errors.push('package.json is missing the @types/node devDependency required for Node-side typechecking.');
}

if (!pkg.scripts.typecheck.includes('tsc -b')) {
  errors.push('package.json script "typecheck" must use TypeScript build mode.');
}

if (!pkg.scripts.build.includes('tsc -b')) {
  errors.push('package.json script "build" must include TypeScript build mode before vite build.');
}

expectOrderedSubstrings(
  pkg.scripts.check,
  ['npm run doctor', 'npm run lint', 'npm run build', 'npm run test:e2e'],
  'package.json script "check"',
);

expectIncludes('AGENTS.md', [
  'public/prototypes/current/mindmap.html',
  'public/prototypes/current/lesson.html',
  'docs/product/product-requirements.md',
  'docs/product/interaction-contract.md',
  'docs/product/neuroscience-learning-principles.md',
  'npm run build',
  'npm run check',
  'npm run package:review',
  'npm run package:verify',
]);
expectIncludes('README.md', [
  '/prototypes/current/mindmap.html',
  '/prototypes/current/lesson.html',
  'https://Adel199223.github.io/neuro-map-studio/',
  'https://Adel199223.github.io/neuro-map-studio/prototypes/current/mindmap.html',
  'https://Adel199223.github.io/neuro-map-studio/prototypes/current/lesson.html',
  'CODEX_PROMPT.md',
  'docs/product/tablet-pen-sync-architecture.md',
  '\\\\wsl.localhost\\Ubuntu\\home\\',
  'package:review',
  'package:verify',
  'artifacts/neuro-map-studio-review-context.zip',
  '.agents/',
]);
expectIncludes('docs/codex/codex-setup.md', [
  '.agents/skills/',
  'CODEX_PROMPT.md',
  '\\\\wsl.localhost\\Ubuntu\\home\\',
  'package:review',
  'package:verify',
]);
expectIncludes('CODEX_PROMPT.md', ['docs/product/tablet-pen-sync-architecture.md']);
expectIncludes('LICENSE', ['MIT License']);
expectIncludes('vite.config.ts', ['GITHUB_PAGES', '/neuro-map-studio/']);
expectIncludes('.github/workflows/pages.yml', [
  'actions/configure-pages',
  'actions/upload-pages-artifact',
  'actions/deploy-pages',
]);
expectIncludes('docs/product/current-prototype-audit.md', ['v20 clean connectors']);
expectIncludes('docs/product/tablet-pen-sync-architecture.md', [
  'Pointer Events',
  'IndexedDB',
  'WebSocket',
  'Long-press',
  'right-click',
  'last-writer-wins',
]);

const mapPrototype = read('public/prototypes/current/mindmap.html');
const lessonPrototype = read('public/prototypes/current/lesson.html');

const mapSnippets = [
  'Debt-power map',
  'href="project.html"',
  'href="lesson.html"',
  'simon-dixon-debt-power-learning-workspace-v20-clean-connectors',
];
for (const snippet of mapSnippets) {
  if (!mapPrototype.includes(snippet)) {
    errors.push(`public/prototypes/current/mindmap.html is missing expected content: ${snippet}`);
  }
}

if (!lessonPrototype.includes('href="mindmap.html"')) {
  errors.push('public/prototypes/current/lesson.html must link back to mindmap.html.');
}
if (!lessonPrototype.includes('href="project.html"')) {
  errors.push('public/prototypes/current/lesson.html must link back to project.html.');
}

expectIncludes('public/prototypes/current/project.html', [
  'Neuro Map Studio',
  'Geopolitics &amp; Economics',
  'Simon Dixon debt-power interview/model',
  'href="lesson.html"',
  'href="mindmap.html"',
]);
expectIncludes('public/prototypes/current/project-data.js', [
  'geopolitics-economics',
  'simon-dixon-debt-power',
  'simon-dixon-linear-lesson',
  'simon-dixon-debt-power-map',
]);

if (errors.length) {
  console.error('Doctor check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Doctor check passed. Harness contract looks consistent.');
