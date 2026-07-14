import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompatibilityReport } from '../../src/report/index.js';
import type { IntermediateRepresentation } from '../../src/ir/types.js';

const ir: IntermediateRepresentation = {
  namespace: 'demo',
  items: [{ id: 'sword', material: 'diamond_sword', compatibility: 'FULL', notes: [] }],
  blocks: [],
  sounds: [],
  metadata: { source: 'itemsadder', version: '1.0.0' }
};

test('report builder returns compatibility report with assets', () => {
  const report = buildCompatibilityReport(ir);
  assert.equal(report.assets.length, 1);
  assert.equal(report.assets[0].status, 'FULL');
});
