import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toDenary,
  toBinary,
  toHex,
  twoComplement,
  generateQuestion,
  evaluateAnswer,
} from '../logic.js';

test('toDenary converts binary to decimal', () => {
  assert.equal(toDenary('101101'), 45);
  assert.equal(toDenary('11111111'), 255);
});

test('toBinary converts decimal to binary', () => {
  assert.equal(toBinary(13), '1101');
  assert.equal(toBinary(255), '11111111');
});

test('toHex converts denary to hexadecimal', () => {
  assert.equal(toHex(255), 'FF');
  assert.equal(toHex(26), '1A');
});

test('twoComplement converts signed byte correctly', () => {
  assert.equal(twoComplement(248, 8), -8);
  assert.equal(twoComplement(255, 8), -1);
});

test('generateQuestion returns a valid question object', () => {
  const q = generateQuestion('GCSE Higher', 'binary-to-denary');
  assert.ok(q.prompt.includes('Convert'));
  assert.ok(typeof q.answer === 'number');
});

test('evaluateAnswer accepts equivalent responses for hexadecimal and binary', () => {
  const q = { type: 'hex-to-denary', answer: 26 };
  assert.equal(evaluateAnswer(q, '26'), true);
  assert.equal(evaluateAnswer(q, '1A'), true);
  assert.equal(evaluateAnswer(q, '25'), false);
});
