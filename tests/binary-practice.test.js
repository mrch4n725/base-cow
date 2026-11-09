import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toDenary,
  toBinary,
  toHex,
  toTwosComplement,
  twoComplement,
  binaryFractionToDenary,
  denaryToBinaryFraction,
  encodeFloatingPoint,
  decodeFloatingPoint,
  isNormalisedMantissa,
  normaliseFloatingPoint,
  generateQuestion,
  generateQuestionSet,
  tierCatalog,
  evaluateAnswer,
  markAnswers,
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

test('binary fraction conversion is exact for positive and negative values', () => {
  assert.equal(binaryFractionToDenary('0.101'), 0.625);
  assert.equal(binaryFractionToDenary('-10.011'), -2.375);
  assert.equal(denaryToBinaryFraction(0.625, 3), '0.101');
  assert.equal(denaryToBinaryFraction(-2.375, 3), '-10.011');
  assert.throws(() => denaryToBinaryFraction(0.1, 4), /not exactly representable/);
  assert.throws(() => binaryFractionToDenary('0.12'), /Invalid binary fraction/);
  assert.throws(() => binaryFractionToDenary(`0.${'1'.repeat(9)}`), /at most 8/);
  assert.throws(() => denaryToBinaryFraction(0.5, 9), /Invalid binary fraction/);
});

test('floating-point conversion uses a normalized signed mantissa and signed exponent', () => {
  assert.deepEqual(encodeFloatingPoint(0.625), {
    mantissa: '01010000',
    exponent: '0000',
  });
  assert.deepEqual(encodeFloatingPoint(-1.5), {
    mantissa: '10100000',
    exponent: '0001',
  });
  assert.deepEqual(encodeFloatingPoint(-0.5), {
    mantissa: '10000000',
    exponent: '1111',
  });
  assert.deepEqual(decodeFloatingPoint('01010000', '0000'), {
    value: 0.625,
    normalised: true,
    exponent: 0,
  });
  assert.equal(decodeFloatingPoint('10100000', '0001').value, -1.5);
  assert.throws(() => encodeFloatingPoint(0.1), /not exactly representable/);
  assert.throws(() => encodeFloatingPoint(0), /Invalid floating-point/);
});

test('floating-point normalization preserves the value and the exponent scale is a power of two', () => {
  const normalised = normaliseFloatingPoint('00110000', '0010');
  assert.deepEqual(normalised, {
    mantissa: '01100000',
    exponent: '0001',
  });
  assert.equal(decodeFloatingPoint('00110000', '0010').value, 1.5);
  assert.equal(decodeFloatingPoint(normalised.mantissa, normalised.exponent).value, 1.5);
  assert.equal(isNormalisedMantissa(normalised.mantissa), true);
  assert.equal(isNormalisedMantissa('00110000'), false);
  assert.throws(() => normaliseFloatingPoint('00000000', '0000'), /Zero has no normalised/);
});

test('normalized floating-point bit patterns round-trip across the full exponent range', () => {
  for (let mantissaValue = 0; mantissaValue < 256; mantissaValue += 1) {
    const mantissa = mantissaValue.toString(2).padStart(8, '0');
    if (!isNormalisedMantissa(mantissa)) continue;
    for (let exponentValue = 0; exponentValue < 16; exponentValue += 1) {
      const exponent = exponentValue.toString(2).padStart(4, '0');
      const decoded = decodeFloatingPoint(mantissa, exponent);
      assert.equal(decoded.normalised, true);
      const encoded = encodeFloatingPoint(decoded.value);
      assert.deepEqual(encoded, { mantissa, exponent });
    }
  }
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

test('supporting questions and generated floating-point conversions are mathematically gradable', () => {
  for (const type of [
    'bit-capacity',
    'binary-shift',
    'binary-fraction-to-denary',
    'denary-to-binary-fraction',
    'floating-point-encode',
    'floating-point-decode',
    'floating-point-normalise',
    'floating-point-exponent-decode',
  ]) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const question = generateQuestion('GCSE Higher', type);
      assert.equal(evaluateAnswer(question, question.answer), true, type);

      if (type === 'floating-point-encode') {
        const [, value] = question.prompt.match(/Convert (-?\d+(?:\.\d+)?)/);
        const [mantissa, exponent] = question.answer.split(' ');
        assert.ok(Math.abs(decodeFloatingPoint(mantissa, exponent).value - Number(value)) < 1e-9);
      }

      if (type === 'floating-point-decode') {
        const [, mantissa, exponent] = question.prompt.match(/mantissa ([01]{8}) and 4-bit two's-complement exponent ([01]{4})/);
        assert.equal(decodeFloatingPoint(mantissa, exponent).value, question.answer);
      }

      if (type === 'floating-point-normalise') {
        const [, inputMantissa, inputExponent] = question.prompt.match(/mantissa ([01]{8}) and exponent ([01]{4})/);
        const [mantissa, exponent] = question.answer.split(' ');
        assert.ok(
          Math.abs(
            decodeFloatingPoint(inputMantissa, inputExponent).value
              - decodeFloatingPoint(mantissa, exponent).value,
          ) < 1e-9,
        );
        assert.equal(isNormalisedMantissa(mantissa), true);
      }

      if (type === 'floating-point-exponent-decode') {
        const [, exponent] = question.prompt.match(/exponent ([01]{4})/);
        assert.equal(twoComplement(toDenary(exponent), 4), question.answer);
      }

      if (type === 'denary-to-binary-fraction') {
        const [, value] = question.prompt.match(/Convert (-?\d+(?:\.\d+)?)/);
        assert.equal(binaryFractionToDenary(question.answer), Number(value));
      }
    }
  }
});

test('answer marking reports concise correctness and the right answer', () => {
  const questions = [
    { type: 'binary-fraction-to-denary', answer: 0.625 },
    { type: 'floating-point-encode', answer: '01010000 0000' },
  ];
  const marked = markAnswers(questions, ['0.625', 'wrong']);
  assert.deepEqual(marked, {
    results: [
      { correct: true, answer: 0.625 },
      { correct: false, answer: '01010000 0000' },
    ],
    score: 1,
  });
});

test('answer checking respects binary, hexadecimal, numeric and floating-point fields', () => {
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: '1A' }, '0x1a'), true);
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: '1A' }, '0b1a'), false);
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: 'A' }, '000a'), true);
  assert.equal(evaluateAnswer({ type: 'hex-to-binary', answer: '00011010' }, '0b0001 1010'), true);
  assert.equal(evaluateAnswer({ type: 'hex-to-binary', answer: '00011010' }, '11010'), true);
  assert.equal(evaluateAnswer({ type: 'denary-to-binary', answer: '1010' }, '00001010'), true);
  assert.equal(evaluateAnswer({ type: 'binary-to-hex', answer: '1A' }, '1a'), true);
  assert.equal(evaluateAnswer({ type: 'binary-to-hex', answer: '1A' }, '0b1A'), false);
  assert.equal(evaluateAnswer({ type: 'binary-fraction-to-denary', answer: 0.625 }, '0.6250'), true);
  assert.equal(
    evaluateAnswer({ type: 'floating-point-encode', answer: '01010000 0000' }, '010100000000'),
    true,
  );
  assert.equal(
    evaluateAnswer({ type: 'floating-point-encode', answer: '01010000 0000' }, '01010000, 0000'),
    true,
  );
  assert.equal(
    evaluateAnswer({ type: 'floating-point-encode', answer: '01010000 0000' }, '01010000 0001'),
    false,
  );
  assert.equal(
    evaluateAnswer({ type: 'floating-point-encode', answer: '01010000 0000' }, '01010000'),
    false,
  );
});

test('A-level practice sets start with fractional and floating-point questions', () => {
  for (const tier of ['A-Level AS', 'A-Level A2']) {
    const questions = generateQuestionSet(tier, 10);
    assert.deepEqual(
      questions.slice(0, 6).map(({ type }) => type),
      [
        'floating-point-encode',
        'floating-point-decode',
        'floating-point-normalise',
        'floating-point-exponent-decode',
        'binary-fraction-to-denary',
        'denary-to-binary-fraction',
      ],
    );
    questions.forEach((question) => {
      assert.equal(evaluateAnswer(question, question.answer), true, `${tier}: ${question.type}`);
    });
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

test('generated question answers are objective and use manageable values', () => {
  const tiers = Object.keys(tierCatalog);
  for (const tier of tiers) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const questions = generateQuestionSet(tier, 30);
      for (const question of questions) {
        assert.ok(typeof question.answer === 'number' || typeof question.answer === 'string');
        if (typeof question.answer === 'string') {
          const isHexAnswer = ['binary-to-hex', 'denary-to-hex'].includes(question.type);
          const answerPattern = isHexAnswer
            ? /^[0-9A-F]+$/i
            : /^(?:[01]+(?:\.[01]+)?|[01]+\s+[01]+)$/;
          assert.match(question.answer, answerPattern, `${tier} ${question.type} has a non-objective answer`);
        }
        assert.equal(evaluateAnswer(question, question.answer), true, `${tier} ${question.type}`);
        if (typeof question.answer === 'number') {
          const rounded = Math.round(question.answer * 10000) / 10000;
          assert.ok(Math.abs(question.answer - rounded) < 1e-9, `${tier} ${question.type} is awkward to calculate`);
        }
        if (question.type === 'binary-fraction-to-denary') {
          assert.ok(question.prompt.match(/0\.([01]+)₂/)[1].length <= 8);
        }
        if (question.type === 'denary-to-binary-fraction') {
          const [, value] = question.prompt.match(/Convert ([\d.]+)/);
          assert.ok(Math.abs(binaryFractionToDenary(question.answer) - Number(value)) < 1e-9);
          assert.ok(question.answer.match(/\.([01]+)$/)[1].length <= 8);
        }
      }
    }
  }
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
  assert.equal(evaluateAnswer({ type: 'floating-point-decode', answer: 26 }, '1A'), false);
  assert.equal(evaluateAnswer(q, '25'), false);
});
