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
  topicCatalog,
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

test('tier topic lists match the intended curriculum progression', () => {
  const expectedTopics = {
    KS3: ['binary-denary', 'hexadecimal', 'binary-shifts'],
    'GCSE Foundation': [
      'binary-denary',
      'hexadecimal',
      'binary-shifts',
      'binary-arithmetic',
    ],
    'GCSE Higher': [
      'binary-denary',
      'hexadecimal',
      'binary-shifts',
      'binary-arithmetic',
    ],
    'A-Level AS': Object.keys(topicCatalog),
    'A-Level A2': Object.keys(topicCatalog),
  };

  Object.entries(expectedTopics).forEach(([tierName, topics]) => {
    assert.deepEqual(tierCatalog[tierName].topics, topics);
    assert.deepEqual(
      tierCatalog[tierName].questionTypes,
      topics.flatMap((topicId) => topicCatalog[topicId].questionTypes),
    );
  });
});

test('question sets filter unavailable topics and cover each enabled topic', () => {
  const selectedTopics = ['binary-denary', 'hexadecimal'];
  const questions = generateQuestionSet('GCSE Foundation', selectedTopics.length, selectedTopics);
  const usedTopics = new Set(questions.map(({ type }) => (
    Object.entries(topicCatalog).find(([, topic]) => topic.questionTypes.includes(type))[0]
  )));
  assert.deepEqual([...usedTopics].sort(), [...selectedTopics].sort());

  const filtered = generateQuestionSet('KS3', 10, ['hexadecimal', 'floating-point']);
  assert.equal(filtered.length, 10);
  filtered.forEach(({ type }) => {
    assert.ok(topicCatalog.hexadecimal.questionTypes.includes(type));
  });

  assert.deepEqual(generateQuestionSet('GCSE Higher', 10, []), []);
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
        const [, inputMantissa, inputExponent] = question.prompt.match(
          /8-bit mantissa ([01]{8}) and the 4-bit exponent ([01]{4})/,
        );
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
      { correct: true, answer: 0.625, reason: '', working: [] },
      {
        correct: false,
        answer: '01010000 0000',
        reason: 'Floating-point answers must contain binary mantissa and exponent bits.',
        working: [],
      },
    ],
    score: 1,
  });
});

test('answer checking respects binary, hexadecimal, numeric and floating-point fields', () => {
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: '1A' }, '0x1a'), true);
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: '1A' }, '0b1a'), false);
  assert.equal(evaluateAnswer({ type: 'denary-to-hex', answer: 'A' }, '000a'), true);
  assert.equal(evaluateAnswer({ type: 'hex-to-binary', answer: '00011010' }, '0b0001 1010'), true);
  assert.equal(evaluateAnswer({ type: 'hex-to-binary', answer: '00011010' }, '11010'), false);
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

test('every generated question carries non-empty working and format metadata', () => {
  Object.entries(tierCatalog).forEach(([tierName, tier]) => {
    [...new Set(tier.questionTypes)].forEach((type) => {
      const question = generateQuestion(tierName, type);
      assert.ok(Array.isArray(question.working) && question.working.length > 0, `${type} working`);
      assert.ok(question.format && typeof question.format.kind === 'string', `${type} format`);
      assert.ok(question.working.every((step) => typeof step === 'string' && step.length > 0));
    });
  });

  const widthPrompts = [
    ['hex-to-binary', /using \d+ bits/],
    ['two-complement-encode', /using \d+ bits/],
    ['two-complement-addition', /using \d+-bit two's complement.*Give the \d+-bit/],
    ['two-complement-subtraction', /using \d+-bit two's complement.*Give the \d+-bit/],
    ['binary-shift', /Give the 8-bit result/],
    ['denary-to-binary-fraction', /with \d+ fractional bits/],
    ['floating-point-encode', /8-bit signed mantissa and a 4-bit exponent/],
    ['floating-point-normalise', /8-bit mantissa and a 4-bit exponent/],
    ['floating-point-decode', /8-bit mantissa .*4-bit two's-complement exponent/],
  ];
  widthPrompts.forEach(([type, pattern]) => {
    assert.match(generateQuestion('A-Level AS', type).prompt, pattern, type);
  });
});

test('value-only formats compare values and allow leading zeros, prefixes, whitespace and minus signs', () => {
  const cases = [
    [{ type: 'binary-to-denary', answer: 10 }, '0b 0000 1010'],
    [{ type: 'hex-to-denary', answer: 26 }, '0X001a'],
    [{ type: 'denary-to-binary', answer: '1010' }, '0000 1010'],
    [{ type: 'binary-to-hex', answer: 'A' }, '0x000a'],
    [{ type: 'denary-to-hex', answer: 'A' }, '0X000A'],
    [{ type: 'binary-addition', answer: '1010' }, '00001010'],
    [{ type: 'binary-subtraction', answer: '1010' }, '00001010'],
    [{ type: 'bit-capacity', answer: 3 }, '003'],
    [{ type: 'binary-fraction-to-denary', answer: 0.625 }, '0.6250'],
    [{ type: 'floating-point-decode', answer: -0.75 }, '−0.750'],
    [{ type: 'floating-point-exponent-decode', answer: -1 }, '−01'],
    [{ type: 'two-complement-decode', answer: -1 }, '−1.0'],
  ];
  cases.forEach(([question, answer]) => assert.equal(evaluateAnswer(question, answer), true));
});

test('width-stated answers enforce widths and explain correct values with the wrong length', () => {
  const wrongLengthAnswers = [
    [
      {
        type: 'two-complement-encode',
        answer: '11111111',
        format: { kind: 'binary', width: 8, signed: true },
      },
      '1111',
      'Right value, but this answer needs 8 bits.',
    ],
    [
      {
        type: 'two-complement-addition',
        answer: '11111111',
        format: { kind: 'binary', width: 8, signed: true },
      },
      '1111',
      'Right value, but this answer needs 8 bits.',
    ],
    [
      {
        type: 'two-complement-subtraction',
        answer: '11111111',
        format: { kind: 'binary', width: 8, signed: true },
      },
      '1111',
      'Right value, but this answer needs 8 bits.',
    ],
    [
      {
        type: 'binary-shift',
        answer: '00001010',
        format: { kind: 'binary', width: 8 },
      },
      '1010',
      'Right value, but this answer needs 8 bits.',
    ],
    [
      {
        type: 'hex-to-binary',
        answer: '00011010',
        format: { kind: 'binary', width: 8 },
      },
      '11010',
      'Right value, but this answer needs 8 bits.',
    ],
    [
      {
        type: 'denary-to-binary-fraction',
        answer: '0.101',
        format: { kind: 'binary-fraction', fractionalBits: 3 },
      },
      '0.1010',
      'Right value, but this answer needs 3 bits.',
    ],
  ];
  wrongLengthAnswers.forEach(([question, answer, reason]) => {
    const result = markAnswers([question], [answer]).results[0];
    assert.equal(result.correct, false, question.type);
    assert.equal(result.reason, reason, question.type);
  });

  const floatQuestion = {
    type: 'floating-point-encode',
    answer: '01010000 0000',
    format: { kind: 'floating-point', mantissaWidth: 8, exponentWidth: 4 },
  };
  const normaliseQuestion = {
    ...floatQuestion,
    type: 'floating-point-normalise',
  };
  [' ', ',', ';', ':', '|', '/'].forEach((separator) => {
    const answer = `0b01010000${separator}0b0000`;
    assert.equal(evaluateAnswer(floatQuestion, answer), true, separator);
    assert.equal(evaluateAnswer(normaliseQuestion, answer), true, separator);
  });
  assert.equal(evaluateAnswer(floatQuestion, '010100000000'), true);
  assert.equal(markAnswers([floatQuestion], ['0101000 0000']).results[0].reason,
    'The mantissa needs 8 bits.');
  assert.equal(markAnswers([floatQuestion], ['01010000 000']).results[0].reason,
    'The exponent needs 4 bits.');
  assert.equal(markAnswers([floatQuestion], ['01010001 0000']).results[0].reason,
    'The mantissa is incorrect.');
  assert.equal(markAnswers([floatQuestion], ['01010000 0001']).results[0].reason,
    'The exponent is incorrect.');
});

test('invalid answer characters return useful format-specific reasons', () => {
  const answers = [
    [{ type: 'denary-to-binary', answer: '1010' }, '102', 'Binary answers can only contain 0 and 1.'],
    [{ type: 'denary-to-hex', answer: 'A' }, 'G', 'Hexadecimal answers can only contain 0–9 and A–F.'],
    [
      {
        type: 'denary-to-binary-fraction',
        answer: '0.101',
        format: { kind: 'binary-fraction', fractionalBits: 3 },
      },
      '0.12',
      'Binary fraction answers can only contain 0 and 1 with an optional leading minus sign.',
    ],
    [{ type: 'binary-to-denary', answer: 10 }, 'ten', 'Enter a denary number.'],
  ];
  answers.forEach(([question, answer, reason]) => {
    assert.equal(markAnswers([question], [answer]).results[0].reason, reason);
  });
});

test('A-level practice sets cover all topics while GCSE sets omit A-level-only topics', () => {
  for (const tier of ['A-Level AS', 'A-Level A2']) {
    const questions = generateQuestionSet(tier, tierCatalog[tier].topics.length);
    const usedTopics = new Set(questions.map(({ type }) => (
      Object.entries(topicCatalog).find(([, topic]) => topic.questionTypes.includes(type))[0]
    )));
    assert.deepEqual([...usedTopics].sort(), [...tierCatalog[tier].topics].sort());
    questions.forEach((question) => assert.equal(
      evaluateAnswer(question, question.answer),
      true,
      `${tier}: ${question.type}`,
    ));
  }

  const gcseQuestions = generateQuestionSet('GCSE Higher', 30);
  gcseQuestions.forEach(({ type }) => {
    assert.ok(!topicCatalog['binary-fractions'].questionTypes.includes(type));
    assert.ok(!topicCatalog['floating-point'].questionTypes.includes(type));
    assert.ok(!topicCatalog['twos-complement'].questionTypes.includes(type));
    assert.ok(!topicCatalog['bit-capacity'].questionTypes.includes(type));
  });
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

test('numeric marking rejects near misses while accepting equivalent decimal formatting', () => {
  const fractionQuestion = { type: 'binary-fraction-to-denary', answer: 0.625 };
  assert.equal(evaluateAnswer(fractionQuestion, '0.6250'), true);
  assert.equal(evaluateAnswer(fractionQuestion, '0.6250000001'), false);

  const floatingPointQuestion = { type: 'floating-point-decode', answer: -0.75 };
  assert.equal(evaluateAnswer(floatingPointQuestion, '-0.750'), true);
  assert.equal(evaluateAnswer(floatingPointQuestion, '-0.7500000001'), false);
});

test('floating-point encoding normalises exact positive and negative boundaries', () => {
  const boundaryCases = [
    [0.5, '01000000', '0000'],
    [1, '01000000', '0001'],
    [-0.5, '10000000', '1111'],
    [-1, '10000000', '0000'],
  ];

  for (const [value, mantissa, exponent] of boundaryCases) {
    const encoded = encodeFloatingPoint(value);
    assert.deepEqual(encoded, { mantissa, exponent });
    assert.equal(isNormalisedMantissa(encoded.mantissa), true);
    assert.equal(decodeFloatingPoint(encoded.mantissa, encoded.exponent).value, value);
  }
});
