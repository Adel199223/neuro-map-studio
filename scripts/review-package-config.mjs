import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));

export const repoRoot = join(scriptsDirectory, '..');
export const outputDirectory = 'artifacts';
export const outputZipRelativePath = `${outputDirectory}/neuro-map-studio-review-context.zip`;

export const includePaths = [
  '.agents',
  '.github',
  'docs',
  'public',
  'scripts',
  'src',
  'tests',
  '.gitignore',
  '.prettierrc.json',
  'AGENTS.md',
  'CHANGELOG.md',
  'CODEX_PROMPT.md',
  'LICENSE',
  'README.md',
  'PLANS.md',
  'eslint.config.js',
  'index.html',
  'package.json',
  'package-lock.json',
  'playwright.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
];

export const excludedDirectoryNames = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'test-results',
  'playwright-report',
  '.git',
  '.vite',
]);

export const requiredReviewPaths = [
  '.agents/skills/a11y-learning-review/SKILL.md',
  '.agents/skills/learning-map-feature/SKILL.md',
  '.agents/skills/prototype-migration/SKILL.md',
  '.github/workflows/pages.yml',
  'LICENSE',
  'public/prototypes/current/mindmap.html',
  'public/prototypes/current/lesson.html',
  'scripts/doctor.mjs',
  'vite.config.ts',
];

export const crossLinkChecks = [
  {
    file: 'public/prototypes/current/mindmap.html',
    snippet: 'href="lesson.html"',
    description: 'mindmap prototype must link to lesson.html',
  },
  {
    file: 'public/prototypes/current/lesson.html',
    snippet: 'href="mindmap.html"',
    description: 'lesson prototype must link to mindmap.html',
  },
];

function toPosixPath(value) {
  return value.split(sep).join('/');
}

export function resolveRepoPath(relativePath) {
  return join(repoRoot, relativePath);
}

export function relativeFromRepoRoot(absolutePath) {
  return toPosixPath(relative(repoRoot, absolutePath));
}

export function shouldExcludePath(relativePath) {
  const normalized = toPosixPath(relativePath).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.') {
    return false;
  }

  const segments = normalized.split('/');
  const baseName = segments.at(-1) ?? '';

  if (segments.some((segment) => excludedDirectoryNames.has(segment))) {
    return true;
  }

  return baseName === '.env' || baseName.startsWith('.env.');
}

export function collectIncludedFiles() {
  const files = new Set();

  function walk(relativePath) {
    if (shouldExcludePath(relativePath)) {
      return;
    }

    const absolutePath = resolveRepoPath(relativePath);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      const entries = readdirSync(absolutePath, { withFileTypes: true })
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));
      for (const entry of entries) {
        walk(toPosixPath(join(relativePath, entry)));
      }
      return;
    }

    files.add(toPosixPath(relativePath));
  }

  for (const includePath of includePaths) {
    walk(includePath);
  }

  return Array.from(files).sort((left, right) => left.localeCompare(right));
}
