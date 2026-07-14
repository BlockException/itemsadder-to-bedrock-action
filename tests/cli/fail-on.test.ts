import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldFailOn, normalizeFailOn } from '../../src/cli/index.js';
import type { FailOnLevel } from '../../src/cli/types.js';

const report = [
  { status: 'FULL' },
  { status: 'PARTIAL' },
  { status: 'MANUAL_REQUIRED' },
  { status: 'IMPOSSIBLE' }
];

test('normalizeFailOn maps README values correctly', () => {
  assert.equal(normalizeFailOn('never'), 'NONE');
  assert.equal(normalizeFailOn('partial'), 'PARTIAL');
  assert.equal(normalizeFailOn('manual_required'), 'MANUAL_REQUIRED');
  assert.equal(normalizeFailOn('impossible'), 'IMPOSSIBLE');
  assert.equal(normalizeFailOn('unknown'), 'NONE');
});

test('shouldFailOn none never never fails', () => {
  assert.equal(shouldFailOn(report, 'NONE'), false);
});

test('shouldFailOn partial fails at partial and above', () => {
  assert.equal(shouldFailOn(report, 'PARTIAL'), true);
});

test('shouldFailOn manual_required fails at manual_required and above', () => {
  assert.equal(shouldFailOn(report, 'MANUAL_REQUIRED'), true);
});

test('shouldFailOn impossible fails only at impossible', () => {
  assert.equal(shouldFailOn(report, 'IMPOSSIBLE'), true);
});

test('shouldFailOn full never fails at full threshold', () => {
  assert.equal(shouldFailOn([{ status: 'FULL' }], 'PARTIAL'), false);
});
