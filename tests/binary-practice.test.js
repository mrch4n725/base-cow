import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toDenary,
  toBinary,
  toHex,
  toTwosComplement,
  twoComplement,
  generateQuestion,
  generateQuestionSet,
  tierCatalog,
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

test('toTwosComplement encodes signed values at the requested width', () => {
  assert.equal(toTwosComplement(-128, 8), '10000000');
  assert.equal(toTwosComplement(-8, 8), '11111000');
  assert.equal(toTwosComplement(127, 8), '01111111');
  assert.throws(() => toTwosComplement(128, 8), /Invalid 8-bit/);
});

test('twoComplement converts signed byte correctly', () => {
  assert.equal(twoComplement(248, 8), -8);
  assert.equal(twoComplement(255, 8), -1);
  assert.throws(() => twoComplement(256, 8), /Invalid 8-bit/);
});

test('all binary, denary and hexadecimal conversion directions are generated', () => {
  const conversionTypes = [
    'binary-to-denary',
    'denary-to-binary',
    'binary-to-hex',
    'hex-to-binary',
    'denary-to-hex',
    'hex-to-denary',
  ];

  conversionTypes.forEach((type) => {
    const question = generateQuestion('GCSE Higher', type);
    assert.ok(question.prompt.includes('Convert'));
    assert.equal(evaluateAnswer(question, question.answer), true);
    const binaryOperand = question.prompt.match(/([01]{1,})₂/);
    if (binaryOperand) assert.ok(binaryOperand[1].length <= 8);
    const hexOperand = question.prompt.match(/([0-9A-F]+)₁₆/);
    if (hexOperand) assert.ok(Number.parseInt(hexOperand[1], 16) <= 255);
  });
});

test('higher-tier sets prioritize signed arithmetic and rotate through every base conversion', () => {
  const questions = generateQuestionSet('GCSE Higher', 10);
  assert.deepEqual(
    questions.slice(0, 6).map(({ type }) => type),
    [
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
      'binary-addition',
      'binary-subtraction',
    ],
  );
  assert.deepEqual(
    questions.slice(6).map(({ type }) => type),
    [
      'binary-to-denary',
      'denary-to-binary',
      'binary-to-hex',
      'hex-to-binary',
    ],
  );
  const fullCycle = generateQuestionSet('GCSE Higher', 20).map(({ type }) => type);
  assert.equal(fullCycle.filter((type) => type.startsWith('two-complement-')).length, 8);
  for (const type of [
    'binary-to-denary',
    'denary-to-binary',
    'binary-to-hex',
    'hex-to-binary',
    'denary-to-hex',
    'hex-to-denary',
  ]) {
    assert.ok(fullCycle.includes(type), `${type} is part of the full rotation`);
  }
});

test('two-complement questions encode, decode and calculate signed values correctly', () => {
  for (const type of [
    'two-complement-encode',
    'two-complement-decode',
    'two-complement-addition',
    'two-complement-subtraction',
  ]) {
    const question = generateQuestion('GCSE Higher', type);
    assert.equal(evaluateAnswer(question, question.answer), true);
    if (type === 'two-complement-decode') {
      assert.ok(question.answer >= -128 && question.answer <= 127);
    } else {
      assert.match(question.answer, /^[01]{8}$/);
    }
  }

  for (const type of ['two-complement-addition', 'two-complement-subtraction']) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const question = generateQuestion('GCSE Higher', type);
      const [first, second] = [...question.prompt.matchAll(/([01]{8})₂/g)]
        .map((match) => twoComplement(toDenary(match[1]), 8));
      const result = type === 'two-complement-addition' ? first + second : first - second;
      assert.equal(twoComplement(toDenary(question.answer), 8), result);
      assert.ok(result >= -128 && result <= 127);
    }
  }
});

test('supporting bit-capacity, shift, binary-fraction and floating-point questions are gradable', () => {
  for (const type of ['bit-capacity', 'binary-shift', 'binary-fraction-to-denary', 'floating-point']) {
    const question = generateQuestion('GCSE Higher', type);
    assert.equal(evaluateAnswer(question, question.answer), true);
  }
});

test('every configured tier topic generates a gradable question', () => {
  Object.entries(tierCatalog).forEach(([tierName, tier]) => {
    [...new Set(tier.questionTypes)].forEach((type) => {
      const question = generateQuestion(tierName, type);
      assert.equal(evaluateAnswer(question, question.answer), true, `${tierName}: ${type}`);
    });
  });
});

test('conversion prompts use values no larger than one byte', () => {
  const conversionTypes = [
    'binary-to-denary',
    'denary-to-binary',
    'binary-to-hex',
    'hex-to-binary',
    'denary-to-hex',
    'hex-to-denary',
  ];
  for (const type of conversionTypes) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const question = generateQuestion('A-Level A2', type);
      const decimalOperand = question.prompt.match(/Convert (\d+) to/);
      if (decimalOperand) assert.ok(Number(decimalOperand[1]) <= 255);
      const binaryOperand = question.prompt.match(/([01]+)₂/);
      if (binaryOperand) assert.ok(binaryOperand[1].length <= 8);
      const hexOperand = question.prompt.match(/([0-9A-F]+)₁₆/);
      if (hexOperand) assert.ok(Number.parseInt(hexOperand[1], 16) <= 255);
    }
  }
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
