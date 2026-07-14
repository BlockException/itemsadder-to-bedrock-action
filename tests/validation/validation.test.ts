import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { validateInputPath } from '../../src/validation/index.js';

test('validation rejects missing path', () => {
  const result = validateInputPath(resolve('does-not-exist.yml'));
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'Input path does not exist');
});
