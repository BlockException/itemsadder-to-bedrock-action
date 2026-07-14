import test from 'node:test';
import assert from 'node:assert/strict';
import { transformGeometry } from '../../src/geometry/index.js';
import type { ItemIR, BlockIR } from '../../src/ir/types.js';

const items: ItemIR[] = [{ id: 'sword', displayName: 'Sword', material: 'diamond_sword', compatibility: 'FULL', notes: [] }];
const blocks: BlockIR[] = [{ id: 'crystal_block', material: 'stone', compatibility: 'FULL', notes: [] }];

test('geometry transform returns item and block geometries', () => {
  const result = transformGeometry(items, blocks);
  assert.equal(result.itemGeometries.length, 1);
  assert.equal(result.blockGeometries.length, 1);
  assert.equal(result.itemGeometries[0].bones[0].cubes[0].size[0], 16);
});
