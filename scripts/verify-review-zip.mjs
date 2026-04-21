import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import {
  crossLinkChecks,
  excludedDirectoryNames,
  outputZipRelativePath,
  repoRoot,
  requiredReviewPaths,
  resolveRepoPath,
  shouldExcludePath,
} from './review-package-config.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });
  if (result.error) {
    fail(`${command} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    fail(output || `${command} exited with status ${result.status}.`);
  }
  return result;
}

function ensureTool(name) {
  if (process.platform !== 'linux') {
    fail(`Run this packaging workflow from a WSL/Linux shell. Current platform: ${process.platform}`);
  }

  const result = spawnSync('bash', ['-lc', `command -v ${name}`], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    fail(`Required tool "${name}" is not available in WSL. Install it before running package:verify.`);
  }
}

function collectUnexpectedPaths(rootDirectory, currentRelativePath = '') {
  const absoluteDirectory = currentRelativePath ? join(rootDirectory, currentRelativePath) : rootDirectory;
  const entries = readdirSync(absoluteDirectory, { withFileTypes: true });
  const unexpected = [];

  for (const entry of entries) {
    const relativePath = currentRelativePath ? `${currentRelativePath}/${entry.name}` : entry.name;
    if (shouldExcludePath(relativePath)) {
      unexpected.push(relativePath);
      continue;
    }
    if (entry.isDirectory()) {
      unexpected.push(...collectUnexpectedPaths(rootDirectory, relativePath));
    }
  }

  return unexpected.sort((left, right) => left.localeCompare(right));
}

ensureTool('unzip');

const outputZipPath = resolveRepoPath(outputZipRelativePath);
if (!existsSync(outputZipPath)) {
  fail(`Review zip not found at ${outputZipPath}. Run npm run package:review first.`);
}

const tempDirectory = mkdtempSync(join(tmpdir(), 'neuro-map-studio-review-'));

try {
  run('unzip', ['-q', outputZipPath, '-d', tempDirectory], { cwd: repoRoot });

  const missingRequiredPaths = requiredReviewPaths.filter(
    (relativePath) => !existsSync(join(tempDirectory, relativePath)),
  );
  if (missingRequiredPaths.length > 0) {
    fail(`Extracted review zip is missing required files:\n- ${missingRequiredPaths.join('\n- ')}`);
  }

  const doctorRun = spawnSync('node', ['scripts/doctor.mjs'], {
    cwd: tempDirectory,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (doctorRun.error) {
    fail(`node scripts/doctor.mjs failed to start in extracted copy: ${doctorRun.error.message}`);
  }
  if (doctorRun.status !== 0) {
    const output = [doctorRun.stdout, doctorRun.stderr].filter(Boolean).join('\n').trim();
    fail(output || 'Extracted review zip failed node scripts/doctor.mjs.');
  }

  for (const { file, snippet, description } of crossLinkChecks) {
    const source = readFileSync(join(tempDirectory, file), 'utf8');
    if (!source.includes(snippet)) {
      fail(`Extracted review zip failed cross-link verification: ${description}.`);
    }
  }

  const unexpectedExcludedPaths = collectUnexpectedPaths(tempDirectory);
  if (unexpectedExcludedPaths.length > 0) {
    fail(`Extracted review zip contains excluded paths:\n- ${unexpectedExcludedPaths.join('\n- ')}`);
  }

  const excludedAtRoot = Array.from(excludedDirectoryNames).filter((name) => existsSync(join(tempDirectory, name)));
  if (excludedAtRoot.length > 0) {
    fail(`Extracted review zip contains excluded top-level directories:\n- ${excludedAtRoot.join('\n- ')}`);
  }

  console.log(`Verified ${outputZipRelativePath}. Extracted doctor check and package completeness checks passed.`);
} finally {
  rmSync(tempDirectory, { recursive: true, force: true });
}
