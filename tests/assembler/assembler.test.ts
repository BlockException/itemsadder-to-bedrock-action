import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblePacks } from '../../src/assembler/index.js';
import type { IntermediateRepresentation } from '../../src/ir/types.js';

const ir: IntermediateRepresentation = {
  namespace: 'demo',
  items: [{ id: 'sword', material: 'diamond_sword', compatibility: 'FULL', notes: [] }],
  blocks: [{ id: 'crystal_block', material: 'stone', compatibility: 'FULL', notes: [] }],
  sounds: [],
  metadata: { source: 'itemsadder', version: '1.0.0' }
};

test('assembler creates resource and behavior pack data', () => {
  const result = assemblePacks(ir);
  assert.equal(result.resourcePack.items[0].id, 'sword');
  assert.equal(result.behaviorPack.blocks[0].material, 'stone');
});
