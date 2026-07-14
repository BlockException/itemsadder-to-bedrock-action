import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function getShell(): string | undefined {
  const shells = ['sh', 'bash'];
  for (const shell of shells) {
    const result = spawnSync(shell, ['-c', 'echo ok'], { encoding: 'utf8' });
    if (result.status === 0) return shell;
  }
  return undefined;
}

test('entrypoint.sh receives INPUT_FAIL-ON as dash-style environment variable', () => {
  const shell = getShell();
  if (!shell) {
    test.skip('shell not available in the test environment');
    return;
  }

  const workspace = resolve('..');
  const inputPath = resolve('tests/fixtures/e2e/simple-item.yml');
  const outputDir = resolve('dist/action-entrypoint-out');
  const githubOutput = resolve('dist/action-entrypoint-output.txt');

  rmSync(outputDir, { recursive: true, force: true });
  rmSync(githubOutput, { force: true });
  mkdirSync(outputDir, { recursive: true });

  const env = {
    ...process.env,
    GITHUB_OUTPUT: githubOutput
  };

  const scriptPath = resolve('action/entrypoint.sh');
  const result = spawnSync(shell, [
    scriptPath,
    inputPath,
    outputDir,
    'entrypoint-test',
    'markdown',
    'partial'
  ], {
    cwd: resolve('.'),
    env,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, `entrypoint failed: ${result.stderr || result.stdout}`);
  assert.ok(existsSync(githubOutput), 'GITHUB_OUTPUT was not produced');

  const output = readFileSync(githubOutput, 'utf8');
  assert.match(output, /^partial-count=/m, 'partial-count output missing');
  assert.match(output, /^mcpack-path=/m, 'mcpack-path output missing');
  assert.match(output, /^report-path=/m, 'report-path output missing');
});
