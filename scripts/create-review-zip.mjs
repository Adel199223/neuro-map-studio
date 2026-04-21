import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  collectIncludedFiles,
  outputZipRelativePath,
  repoRoot,
  requiredReviewPaths,
  resolveRepoPath,
} from './review-package-config.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
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
    fail(`Required tool "${name}" is not available in WSL. Install it before running package:review.`);
  }
}

ensureTool('zip');

const outputZipPath = resolveRepoPath(outputZipRelativePath);
mkdirSync(dirname(outputZipPath), { recursive: true });
rmSync(outputZipPath, { force: true });

const missingRequiredPaths = requiredReviewPaths.filter((relativePath) => !existsSync(resolveRepoPath(relativePath)));
if (missingRequiredPaths.length > 0) {
  fail(`Cannot create review zip because required files are missing:\n- ${missingRequiredPaths.join('\n- ')}`);
}

const files = collectIncludedFiles();
const missingFromPackage = requiredReviewPaths.filter((relativePath) => !files.includes(relativePath));
if (missingFromPackage.length > 0) {
  fail(`Packaging config omitted required review files:\n- ${missingFromPackage.join('\n- ')}`);
}

run('zip', ['-q', outputZipRelativePath, '-@'], { input: `${files.join('\n')}\n` });

if (!existsSync(outputZipPath)) {
  fail(`Expected review zip was not created at ${outputZipPath}.`);
}

const sizeBytes = statSync(outputZipPath).size;
console.log(`Created ${outputZipRelativePath} with ${files.length} files (${sizeBytes} bytes).`);
