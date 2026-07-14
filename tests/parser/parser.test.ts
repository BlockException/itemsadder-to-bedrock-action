import test from 'node:test';
import assert from 'node:assert/strict';
import { parseItemsAdderConfig } from '../../src/parser/index.js';
import { resolve } from 'node:path';

const fixturesDir = resolve('tests/fixtures/parser');

test('parses a simple item config into IR', () => {
  const result = parseItemsAdderConfig(resolve(fixturesDir, 'simple-item.yml'));
  assert.equal(result.ir.namespace, 'demo');
  assert.equal(result.ir.items.length, 1);
  assert.equal(result.ir.items[0].id, 'sword');
  assert.equal(result.ir.items[0].material, 'diamond_sword');
  assert.equal(result.ir.items[0].customModelData, 1);
});

test('parses a custom model item config into IR', () => {
  const result = parseItemsAdderConfig(resolve(fixturesDir, 'custom-model-item.yml'));
  assert.equal(result.ir.items[0].modelPath, 'assets/demo/models/custom_sword.json');
  assert.equal(result.ir.items[0].texturePath, 'assets/demo/textures/custom_sword.png');
});

test('parses a custom block config into IR', () => {
  const result = parseItemsAdderConfig(resolve(fixturesDir, 'custom-block.yml'));
  assert.equal(result.ir.blocks.length, 1);
  assert.equal(result.ir.blocks[0].id, 'crystal_block');
  assert.equal(result.ir.blocks[0].modelPath, 'assets/demo/models/crystal_block.json');
});
