import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildPackage } from '../../src/packaging/index.js';
import type { ConversionRun } from '../../src/ir/types.js';

const outputDir = resolve('dist/test-packaging');

test('packaging produces mcpack and report file', async () => {
  mkdirSync(outputDir, { recursive: true });
  const run: ConversionRun = {
    inputManifest: { hash: 'hash', size: 0, files: ['a.yml'] },
    ir: { namespace: 'demo', items: [], blocks: [], sounds: [], metadata: { source: 'itemsadder', version: '1.0.0' } },
    compatibilityReport: { generatedAt: new Date().toISOString(), converterVersion: '0.1.0', compatibilityMappingVersion: '0.1.0', assets: [] }
  };
  const result = await buildPackage(run, outputDir, 'demo', 'json');
  assert.ok(existsSync(result.outputPath));
  assert.ok(existsSync(resolve(outputDir, 'demo.report.json')));
  rmSync(outputDir, { recursive: true, force: true });
});
