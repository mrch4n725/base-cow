const FLOAT_MANTISSA_BITS = 8;
const FLOAT_EXPONENT_BITS = 4;

export const topicCatalog = {
  'binary-denary': {
    label: 'Binary and denary',
    questionTypes: ['binary-to-denary', 'denary-to-binary'],
  },
  hexadecimal: {
    label: 'Hexadecimal',
    questionTypes: ['binary-to-hex', 'hex-to-binary', 'denary-to-hex', 'hex-to-denary'],
  },
  'binary-arithmetic': {
    label: 'Binary arithmetic',
    questionTypes: ['binary-addition', 'binary-subtraction'],
  },
  'binary-shifts': {
    label: 'Binary shifts',
    questionTypes: ['binary-shift'],
  },
  'bit-capacity': {
    label: 'Bit capacity',
    questionTypes: ['bit-capacity'],
  },
  'twos-complement': {
    label: 'Two’s complement',
    questionTypes: [
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
    ],
  },
  'binary-fractions': {
    label: 'Binary fractions',
    questionTypes: ['binary-fraction-to-denary', 'denary-to-binary-fraction'],
  },
  'floating-point': {
    label: 'Floating point',
    questionTypes: [
      'floating-point-encode',
      'floating-point-decode',
      'floating-point-normalise',
      'floating-point-exponent-decode',
    ],
  },
};

function getQuestionTypes(topics) {
  return topics.flatMap((topicId) => topicCatalog[topicId].questionTypes);
}

const ks3Topics = ['binary-denary', 'hexadecimal', 'binary-shifts'];
const foundationTopics = [...ks3Topics, 'binary-arithmetic'];
const gcseHigherTopics = [...foundationTopics];
const aLevelTopics = Object.keys(topicCatalog);

export const tierCatalog = {
  'KS3': {
    label: 'KS3',
    description: 'Binary, denary and hexadecimal foundations with logical shifts.',
    topics: ks3Topics,
    questionTypes: getQuestionTypes(ks3Topics),
    binaryLength: [4, 8],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'GCSE Foundation': {
    label: 'GCSE Foundation',
    description: 'Byte-sized conversions, binary arithmetic and logical shifts.',
    topics: foundationTopics,
    questionTypes: getQuestionTypes(foundationTopics),
    binaryLength: [4, 10],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'GCSE Higher': {
    label: 'GCSE Higher',
    description: 'Advanced binary conversions, arithmetic and logical shifts.',
    topics: gcseHigherTopics,
    questionTypes: getQuestionTypes(gcseHigherTopics),
    binaryLength: [6, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'A-Level AS': {
    label: 'A-Level AS',
    description: 'Floating-point and binary-fraction practice with signed arithmetic and base conversions.',
    topics: aLevelTopics,
    questionTypes: getQuestionTypes(aLevelTopics),
    binaryLength: [8, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8, 16],
  },
  'A-Level A2': {
    label: 'A-Level A2',
    description: 'A-level floating-point, binary fractions, signed arithmetic and conversions.',
    topics: aLevelTopics,
    questionTypes: getQuestionTypes(aLevelTopics),
    binaryLength: [8, 24],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8, 16],
  },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeFloatingPointExample() {
  const mantissaValues = [64, 80, 96, -128, -96, -80];
  const mantissaValue = mantissaValues[randomInt(0, mantissaValues.length - 1)];
  const exponentValues = [-1, 0, 1];
  const exponentValue = exponentValues[randomInt(0, exponentValues.length - 1)];
  const mantissa = toTwosComplement(mantissaValue, FLOAT_MANTISSA_BITS);
  const exponent = toTwosComplement(exponentValue, FLOAT_EXPONENT_BITS);
  return {
    mantissa,
    exponent,
    value: decodeFloatingPoint(mantissa, exponent).value,
  };
}

export function toDenary(binaryValue) {
  const value = String(binaryValue).trim().replace(/^0b/i, '').replace(/\s+/g, '');
  if (!/^[01]+$/.test(value)) {
    throw new Error(`Invalid binary value: ${binaryValue}`);
  }
  return value.split('').reduce((total, bit, index) => {
    const position = value.length - index - 1;
    return total + Number(bit) * (2 ** position);
  }, 0);
}

export function toBinary(decimalValue) {
  const value = Number(decimalValue);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid decimal value: ${decimalValue}`);
  }
  if (value === 0) return '0';
  return value.toString(2);
}

export function toHex(decimalValue) {
  const value = Number(decimalValue);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid decimal value: ${decimalValue}`);
  }
  return value.toString(16).toUpperCase();
}

export function binaryFractionToDenary(binaryValue) {
  const value = String(binaryValue).trim().replace(/\s+/g, '');
  const match = value.match(/^(-?)([01]*)(?:\.([01]*))?$/);
  if (!match || (!match[2] && !match[3])) {
    throw new Error(`Invalid binary fraction: ${binaryValue}`);
  }

  const [, sign, integerBits, fractionBits = ''] = match;
  if (fractionBits.length > 8) {
    throw new Error('Binary fractions may contain at most 8 fractional bits');
  }
  const integerValue = integerBits ? toDenary(integerBits) : 0;
  const fractionalValue = [...fractionBits].reduce(
    (total, bit, index) => total + Number(bit) / (2 ** (index + 1)),
    0,
  );
  return (sign ? -1 : 1) * (integerValue + fractionalValue);
}

export function denaryToBinaryFraction(decimalValue, fractionalBits = 8) {
  const value = Number(decimalValue);
  const width = Number(fractionalBits);
  if (!Number.isFinite(value) || !Number.isInteger(width) || width < 1 || width > 8) {
    throw new Error(`Invalid binary fraction: ${decimalValue}`);
  }

  const sign = value < 0 ? '-' : '';
  const absoluteValue = Math.abs(value);
  const integer = Math.floor(absoluteValue);
  let fraction = absoluteValue - integer;
  let bits = '';
  for (let index = 0; index < width; index += 1) {
    fraction *= 2;
    if (fraction >= 1) {
      bits += '1';
      fraction -= 1;
    } else {
      bits += '0';
    }
  }

  if (fraction > 1e-10) {
    throw new Error(`${decimalValue} is not exactly representable with ${width} fractional bits`);
  }
  return `${sign}${toBinary(integer)}.${bits}`;
}

export function toTwosComplement(value, bits) {
  const width = Number(bits);
  const signedValue = Number(value);
  if (!Number.isInteger(width) || width < 1 || width > 52
      || !Number.isInteger(signedValue)
      || signedValue < -(2 ** (width - 1))
      || signedValue > (2 ** (width - 1)) - 1) {
    throw new Error(`Invalid ${bits}-bit two's complement value: ${value}`);
  }
  const encoded = signedValue < 0 ? (2 ** width) + signedValue : signedValue;
  return toBinary(encoded).padStart(width, '0');
}

export function twoComplement(value, bits) {
  const width = Number(bits);
  if (!Number.isInteger(width) || width < 1 || width > 52) {
    throw new Error(`Invalid two's complement width: ${bits}`);
  }
  const range = 2 ** width;
  if (!Number.isInteger(value) || value < 0 || value >= range) {
    throw new Error(`Invalid ${width}-bit two's complement bit pattern: ${value}`);
  }
  const signedValue = value % range;
  if (signedValue >= range / 2) {
    return signedValue - range;
  }
  return signedValue;
}

export function isNormalisedMantissa(mantissaBits) {
  const bits = String(mantissaBits).replace(/\s+/g, '');
  return /^[01]{2,}$/.test(bits) && bits[0] !== bits[1];
}

export function decodeFloatingPoint(mantissaBits, exponentBits) {
  const mantissa = String(mantissaBits).replace(/\s+/g, '');
  const exponent = String(exponentBits).replace(/\s+/g, '');
  if (!/^[01]+$/.test(mantissa) || !/^[01]+$/.test(exponent)) {
    throw new Error('Floating-point mantissa and exponent must be binary bit patterns');
  }

  const signedMantissa = twoComplement(toDenary(mantissa), mantissa.length);
  const signedExponent = twoComplement(toDenary(exponent), exponent.length);
  const value = (signedMantissa / (2 ** (mantissa.length - 1))) * (2 ** signedExponent);
  return {
    value,
    normalised: isNormalisedMantissa(mantissa),
    exponent: signedExponent,
  };
}

export function encodeFloatingPoint(value, mantissaWidth = FLOAT_MANTISSA_BITS, exponentWidth = FLOAT_EXPONENT_BITS) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0
      || !Number.isInteger(mantissaWidth) || mantissaWidth < 2 || mantissaWidth > 52
      || !Number.isInteger(exponentWidth) || exponentWidth < 1 || exponentWidth > 52) {
    throw new Error(`Invalid floating-point value or format: ${value}`);
  }

  let exponent = Math.floor(Math.log2(Math.abs(number))) + 1;
  if (number < 0 && Math.abs(number / (2 ** exponent)) === 0.5) {
    exponent -= 1;
  }
  const mantissaValue = number / (2 ** exponent);
  const mantissaInteger = Math.round(mantissaValue * (2 ** (mantissaWidth - 1)));
  const representedValue = (mantissaInteger / (2 ** (mantissaWidth - 1))) * (2 ** exponent);
  if (Math.abs(representedValue - number) > Math.max(1, Math.abs(number)) * 1e-12) {
    throw new Error(`${value} is not exactly representable in this floating-point format`);
  }

  const mantissa = toTwosComplement(mantissaInteger, mantissaWidth);
  const exponentBits = toTwosComplement(exponent, exponentWidth);
  if (!isNormalisedMantissa(mantissa)) {
    throw new Error(`${value} cannot be normalised in this floating-point format`);
  }
  return { mantissa, exponent: exponentBits };
}

export function normaliseFloatingPoint(mantissaBits, exponentBits) {
  const decoded = decodeFloatingPoint(mantissaBits, exponentBits);
  if (decoded.value === 0) {
    throw new Error('Zero has no normalised floating-point representation');
  }
  const mantissa = String(mantissaBits).replace(/\s+/g, '');
  const exponent = String(exponentBits).replace(/\s+/g, '');
  return encodeFloatingPoint(decoded.value, mantissa.length, exponent.length);
}

export function parseAnswerValue(raw, base = 10) {
  const text = String(raw).trim().replace(/\u2212/g, '-').toLowerCase();
  if (!text) return null;
  const compact = text.replace(/\s+/g, '');
  const sign = compact.startsWith('-') ? -1 : 1;
  const unsigned = compact.replace(/^-/, '');

  if (base === 10 && /^0b[01]+$/.test(unsigned)) {
    return sign * Number.parseInt(unsigned.slice(2), 2);
  }
  if (base === 10 && /^0x[0-9a-f]+$/.test(unsigned)) {
    return sign * Number.parseInt(unsigned.slice(2), 16);
  }
  if (base === 16) {
    const normalised = unsigned.replace(/^0x/, '');
    if (!/^0b/.test(unsigned) && /^[0-9a-f]+$/.test(normalised)) {
      return sign * Number.parseInt(normalised, 16);
    }
  }
  if (base === 2) {
    const normalised = unsigned.replace(/^0b/, '');
    if (/^[01]+$/.test(normalised)) return sign * toDenary(normalised);
  }
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(compact)) return Number(compact);
  return null;
}

function getQuestionFormat(question) {
  if (question.format) return question.format;
  const expected = String(question.answer);
  const binaryWidth = expected.replace(/\s+/g, '').length;

  if (question.type === 'floating-point-encode' || question.type === 'floating-point-normalise') {
    const [mantissa, exponent] = expected.split(/\s+/);
    return {
      kind: 'floating-point',
      mantissaWidth: mantissa.length,
      exponentWidth: exponent.length,
    };
  }
  if (question.type === 'denary-to-binary-fraction') {
    return { kind: 'binary-fraction', fractionalBits: expected.split('.')[1]?.length ?? 0 };
  }
  if (['two-complement-encode', 'two-complement-addition', 'two-complement-subtraction', 'binary-shift']
    .includes(question.type)) {
    const promptWidth = question.prompt?.match(/(?:using (\d+) bits|(\d+)-bit)/);
    return {
      kind: 'binary',
      width: Number(promptWidth?.[1] || promptWidth?.[2]) || binaryWidth,
      signed: question.type.startsWith('two-complement'),
    };
  }
  if (question.type === 'hex-to-binary') return { kind: 'binary', width: binaryWidth };
  if (['binary-to-hex', 'denary-to-hex'].includes(question.type)) return { kind: 'hex' };
  if (question.type === 'denary-to-binary') return { kind: 'binary' };
  if (['binary-addition', 'binary-subtraction'].includes(question.type)) {
    return { kind: 'binary' };
  }
  if (typeof question.answer === 'number') return { kind: 'number' };
  if (/^[01]+$/.test(expected)) return { kind: 'binary' };
  return { kind: 'text' };
}

function invalidAnswer(reason) {
  return { correct: false, reason };
}

function parseNumericInput(raw, type) {
  const value = parseAnswerValue(raw);
  if (value !== null) return value;
  if (type !== 'hex-to-denary') return null;
  const compact = String(raw).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
  if (/^[0-9a-f]+$/i.test(compact)) return Number.parseInt(compact, 16);
  return null;
}

function parseBinaryFractionInput(raw) {
  const compact = String(raw).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
  const match = compact.match(/^(-)?([01]*)(?:\.([01]*))?$/);
  if (!match || (!match[2] && !match[3]) || !compact.includes('.')) return null;
  return {
    value: binaryFractionToDenary(`${match[1] || ''}${match[2] || ''}.${match[3] || ''}`),
    fractionalBits: match[3] || '',
  };
}

function parseFloatingPointInput(raw, format) {
  const text = String(raw).trim().replace(/\u2212/g, '-');
  const separated = text.match(/^(?:0b)?([01]+)\s*(?:[,;:|/]\s*|\s+)(?:0b)?([01]+)$/i);
  if (separated) return { mantissa: separated[1], exponent: separated[2] };

  let joined = text.replace(/\s+/g, '');
  if (/^0b/i.test(joined)) joined = joined.slice(2);
  if (!/^[01]+$/.test(joined)) return null;
  return {
    mantissa: joined.slice(0, format.mantissaWidth),
    exponent: joined.slice(format.mantissaWidth),
  };
}

function evaluateAnswerDetails(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null
      || String(userAnswer).trim() === '') {
    return invalidAnswer('Enter an answer.');
  }

  const expected = question.answer;
  const format = getQuestionFormat(question);

  if (format.kind === 'number') {
    const parsed = parseNumericInput(userAnswer, question.type);
    if (parsed === null) return invalidAnswer('Enter a denary number.');
    return parsed === expected
      ? { correct: true, reason: '' }
      : invalidAnswer('That value is not correct.');
  }

  if (format.kind === 'binary-fraction') {
    const parsed = parseBinaryFractionInput(userAnswer);
    if (!parsed) {
      return invalidAnswer('Binary fraction answers can only contain 0 and 1 with an optional leading minus sign.');
    }
    if (parsed.value === binaryFractionToDenary(expected)
        && parsed.fractionalBits.length !== format.fractionalBits) {
      return invalidAnswer(`Right value, but this answer needs ${format.fractionalBits} bits.`);
    }
    return parsed.value === binaryFractionToDenary(expected)
      ? { correct: true, reason: '' }
      : invalidAnswer('That binary fraction is not correct.');
  }

  if (format.kind === 'floating-point') {
    const [expectedMantissa, expectedExponent] = String(expected).split(/\s+/);
    const parsed = parseFloatingPointInput(userAnswer, format);
    if (!parsed) {
      return invalidAnswer('Floating-point answers must contain binary mantissa and exponent bits.');
    }
    if (parsed.mantissa.length !== format.mantissaWidth) {
      return invalidAnswer(`The mantissa needs ${format.mantissaWidth} bits.`);
    }
    if (parsed.exponent.length !== format.exponentWidth) {
      return invalidAnswer(`The exponent needs ${format.exponentWidth} bits.`);
    }
    const mantissaCorrect = parsed.mantissa === expectedMantissa;
    const exponentCorrect = parsed.exponent === expectedExponent;
    if (mantissaCorrect && exponentCorrect) return { correct: true, reason: '' };
    if (!mantissaCorrect && !exponentCorrect) {
      return invalidAnswer('Both the mantissa and exponent are incorrect.');
    }
    return invalidAnswer(`The ${mantissaCorrect ? 'exponent' : 'mantissa'} is incorrect.`);
  }

  if (format.kind === 'binary') {
    const compact = String(userAnswer).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
    const bits = compact.replace(/^0b/i, '');
    if (!/^[01]+$/.test(bits)) {
      return invalidAnswer('Binary answers can only contain 0 and 1.');
    }
    const expectedBits = String(expected).replace(/\s+/g, '');
    const valueOf = (value) => (
      format.signed ? signedBinaryValue(value) : Number.parseInt(value, 2)
    );
    const valueIsCorrect = valueOf(bits) === valueOf(expectedBits);
    if (format.width && bits.length !== format.width) {
      if (valueIsCorrect) {
        return invalidAnswer(`Right value, but this answer needs ${format.width} bits.`);
      }
      return invalidAnswer('That binary value is not correct.');
    }
    return valueIsCorrect
      ? { correct: true, reason: '' }
      : invalidAnswer('That binary value is not correct.');
  }

  if (format.kind === 'hex') {
    const compact = String(userAnswer).trim().replace(/\u2212/g, '-').replace(/\s+/g, '');
    const digits = compact.replace(/^0x/i, '');
    if (/^0b/i.test(compact) || !/^[0-9a-f]+$/i.test(digits)) {
      return invalidAnswer('Hexadecimal answers can only contain 0–9 and A–F.');
    }
    return Number.parseInt(digits, 16) === Number.parseInt(String(expected), 16)
      ? { correct: true, reason: '' }
      : invalidAnswer('That hexadecimal value is not correct.');
  }

  return String(userAnswer).trim().replace(/\s+/g, '').toLowerCase()
      === String(expected).replace(/\s+/g, '').toLowerCase()
    ? { correct: true, reason: '' }
    : invalidAnswer('That answer is not correct.');
}

export function evaluateAnswer(question, userAnswer) {
  return evaluateAnswerDetails(question, userAnswer).correct;
}

export function markAnswers(questions, answers) {
  const results = questions.map((question, index) => {
    const { correct, reason } = evaluateAnswerDetails(question, answers[index]);
    return {
      correct,
      answer: question.answer,
      reason,
      working: question.working || [],
    };
  });
  return {
    results,
    score: results.filter(({ correct }) => correct).length,
  };
}

function signedBinaryValue(bits) {
  return twoComplement(toDenary(bits), bits.length);
}

function getGeneratedFormat(type, prompt, answer) {
  if (type === 'floating-point-encode' || type === 'floating-point-normalise') {
    return {
      kind: 'floating-point',
      mantissaWidth: FLOAT_MANTISSA_BITS,
      exponentWidth: FLOAT_EXPONENT_BITS,
    };
  }
  if (type === 'denary-to-binary-fraction') {
    return {
      kind: 'binary-fraction',
      fractionalBits: Number(prompt.match(/with (\d+) fractional bits/)?.[1]),
    };
  }
  if (type === 'hex-to-binary') {
    return { kind: 'binary', width: String(answer).length, grouping: 'nibble' };
  }
  if (type === 'two-complement-encode'
      || type === 'two-complement-addition'
      || type === 'two-complement-subtraction'
      || type === 'binary-shift') {
    const width = prompt.match(/(?:using (\d+) bits|(\d+)-bit)/);
    return {
      kind: 'binary',
      width: Number(width?.[1] || width?.[2]),
      signed: type.startsWith('two-complement'),
    };
  }
  if (type === 'denary-to-binary') return { kind: 'binary' };
  if (type === 'binary-addition' || type === 'binary-subtraction') {
    return { kind: 'binary' };
  }
  if (type === 'binary-to-hex' || type === 'denary-to-hex') return { kind: 'hex' };
  if (typeof answer === 'number') return { kind: 'number' };
  return { kind: 'text' };
}

function binaryPlaceValueSteps(bits) {
  const terms = [...bits].flatMap((bit, index) => {
    if (bit !== '1') return [];
    const power = bits.length - index - 1;
    return [`2^${power} = ${2 ** power}`];
  });
  return terms.length > 0 ? terms : ['There are no 1 bits, so the value is 0.'];
}

function repeatedHalvingSteps(value) {
  if (value === 0) return ['0 in binary is 0.'];
  const steps = [];
  let remaining = value;
  while (remaining > 0) {
    const quotient = Math.floor(remaining / 2);
    const remainder = remaining % 2;
    steps.push(`${remaining} ÷ 2 = ${quotient} remainder ${remainder}`);
    remaining = quotient;
  }
  steps.push(`Read the remainders from bottom to top: ${toBinary(value)}.`);
  return steps;
}

function binaryOperationSteps(firstBits, secondBits, operator) {
  const width = Math.max(firstBits.length, secondBits.length);
  const first = firstBits.padStart(width, '0');
  const second = secondBits.padStart(width, '0');
  const lines = [];
  let carryOrBorrow = 0;
  let result = '';

  for (let index = width - 1; index >= 0; index -= 1) {
    const firstBit = Number(first[index]);
    const secondBit = Number(second[index]);
    if (operator === '+') {
      const column = firstBit + secondBit + carryOrBorrow;
      const resultBit = column % 2;
      const nextCarry = Math.floor(column / 2);
      lines.push(
        `Column ${width - index}: ${firstBit} + ${secondBit} + carry ${carryOrBorrow} = ${column}; write ${resultBit}, carry ${nextCarry}.`,
      );
      carryOrBorrow = nextCarry;
      result = `${resultBit}${result}`;
    } else {
      const column = firstBit - secondBit - carryOrBorrow;
      const nextBorrow = column < 0 ? 1 : 0;
      const resultBit = (column + 2) % 2;
      lines.push(
        `Column ${width - index}: ${firstBit} − ${secondBit} − borrow ${carryOrBorrow} = ${column}; write ${resultBit}, borrow ${nextBorrow}.`,
      );
      carryOrBorrow = nextBorrow;
      result = `${resultBit}${result}`;
    }
  }

  if (operator === '+' && carryOrBorrow) result = `${carryOrBorrow}${result}`;
  const firstValue = toDenary(first);
  const secondValue = toDenary(second);
  const denaryResult = operator === '+' ? firstValue + secondValue : firstValue - secondValue;
  lines.push(`Denary check: ${firstValue} ${operator} ${secondValue} = ${denaryResult}.`);
  lines.push(`Binary result: ${result}.`);
  return lines;
}

function workingForQuestion(question, format) {
  const { type, prompt, answer } = question;
  const binaryOperands = [...prompt.matchAll(/([01]+)₂/g)].map((match) => match[1]);

  if (type === 'binary-to-denary') {
    const bits = binaryOperands[0];
    return [
      ...binaryPlaceValueSteps(bits),
      `Add the place values: ${toDenary(bits)}.`,
    ];
  }
  if (type === 'denary-to-binary') {
    const value = Number(prompt.match(/Convert (\d+) to binary/)?.[1]);
    return repeatedHalvingSteps(value);
  }
  if (type === 'binary-to-hex') {
    const bits = binaryOperands[0];
    const grouped = bits.padStart(Math.ceil(bits.length / 4) * 4, '0').match(/.{4}/g);
    return [
      `Group from the right into 4-bit nibbles: ${grouped.join(' ')}.`,
      ...grouped.map((nibble) => `${nibble}₂ = ${toHex(toDenary(nibble))}₁₆`),
      `Hexadecimal answer: ${answer}.`,
    ];
  }
  if (type === 'hex-to-binary') {
    const hex = prompt.match(/([0-9A-F]+)₁₆/i)?.[1] || '';
    return [
      ...[...hex].map((digit) => `${digit.toUpperCase()}₁₆ = ${Number.parseInt(digit, 16).toString(2).padStart(4, '0')}₂`),
      `Join the 4-bit groups: ${answer}.`,
    ];
  }
  if (type === 'denary-to-hex') {
    const value = Number(prompt.match(/Convert (\d+) to hexadecimal/)?.[1]);
    let remaining = value;
    const steps = [];
    do {
      const quotient = Math.floor(remaining / 16);
      const remainder = remaining % 16;
      steps.push(`${remaining} ÷ 16 = ${quotient} remainder ${toHex(remainder)}.`);
      remaining = quotient;
    } while (remaining > 0);
    steps.push(`Read the remainders from bottom to top: ${answer}.`);
    return steps;
  }
  if (type === 'hex-to-denary') {
    const hex = prompt.match(/([0-9A-F]+)₁₆/i)?.[1] || '';
    const terms = [...hex].reverse().map((digit, position) => (
      `${digit.toUpperCase()} × 16^${position} = ${Number.parseInt(digit, 16) * (16 ** position)}`
    ));
    return [...terms, `Add the place values: ${answer}.`];
  }
  if (type === 'binary-addition' || type === 'binary-subtraction') {
    return binaryOperationSteps(
      binaryOperands[0],
      binaryOperands[1],
      type === 'binary-addition' ? '+' : '-',
    );
  }
  if (type === 'two-complement-encode') {
    const value = Number(prompt.match(/Convert (-?\d+)/)?.[1]);
    const width = format.width;
    if (value >= 0) {
      return [
        `Convert ${value} to binary: ${toBinary(value)}.`,
        `Pad to ${width} bits: ${answer}.`,
      ];
    }
    const magnitude = Math.abs(value);
    const magnitudeBits = toBinary(magnitude).padStart(width, '0');
    const inverted = [...magnitudeBits].map((bit) => (bit === '0' ? '1' : '0')).join('');
    return [
      `Write the magnitude ${magnitude} in ${width} bits: ${magnitudeBits}.`,
      `Invert the bits: ${inverted}.`,
      `Add 1: ${answer}.`,
    ];
  }
  if (type === 'two-complement-decode' || type === 'two-complement') {
    const bits = binaryOperands[0];
    const signedWeight = -(2 ** (bits.length - 1));
    const signedContribution = bits[0] === '1' ? signedWeight : 0;
    const otherWeights = [...bits.slice(1)].flatMap((bit, index) => {
      if (bit !== '1') return [];
      const power = bits.length - index - 2;
      return [`2^${power} = ${2 ** power}`];
    });
    const terms = [signedContribution, ...[...bits.slice(1)].map((bit, index) => (
      bit === '1' ? 2 ** (bits.length - index - 2) : 0
    ))];
    return [
      `The most significant bit has weight ${signedWeight}; its contribution is ${signedContribution}.`,
      ...otherWeights,
      `Add the signed place values: ${terms.reduce((total, term) => total + term, 0)}.`,
    ];
  }
  if (type === 'two-complement-addition' || type === 'two-complement-subtraction') {
    const width = format.width;
    const [firstBits, secondBits] = binaryOperands;
    const first = signedBinaryValue(firstBits);
    const second = signedBinaryValue(secondBits);
    const isAddition = type === 'two-complement-addition';
    const result = signedBinaryValue(answer);
    return [
      `Decode the operands: ${firstBits}₂ = ${first} and ${secondBits}₂ = ${second}.`,
      isAddition
        ? `Add the signed values: ${first} + (${second < 0 ? `−${Math.abs(second)}` : second}) = ${result}.`
        : `Subtract by adding the negated second value: ${first} + (−${second}) = ${result}.`,
      ...(!isAddition
        ? [`The ${width}-bit two's-complement encoding of ${-second} is ${toTwosComplement(-second, width)}.`]
        : []),
      `Denary check: the result is ${result}, encoded in ${width} bits as ${answer}.`,
    ];
  }
  if (type === 'bit-capacity') {
    const count = prompt.match(/represent (\d+) different unsigned values/);
    const width = prompt.match(/in (\d+) bits/);
    const unsignedValue = prompt.match(/unsigned value (\d+)/);
    if (count) {
      const values = Number(count[1]);
      return [
        `Find n using log₂(${values}) = ${answer}.`,
        `${answer} bits give 2^${answer} = ${values} different values.`,
      ];
    }
    if (width) {
      const bits = Number(width[1]);
      return [
        `${bits} bits represent 2^${bits} = ${2 ** bits} unsigned values.`,
        `The largest value is 2^${bits} − 1 = ${answer}.`,
      ];
    }
    const value = Number(unsignedValue?.[1]);
    return [
      `Find the smallest n for which 2^n > ${value}.`,
      `2^${Number(answer) - 1} = ${2 ** (Number(answer) - 1)} ≤ ${value} < 2^${answer} = ${2 ** Number(answer)}.`,
      `So ${answer} bits are needed.`,
    ];
  }
  if (type === 'binary-shift') {
    const [, placesText, direction, bits] = prompt.match(/(\d+)-place logical shift (left|right) to ([01]+)₂/);
    const places = Number(placesText);
    const value = toDenary(bits);
    const shiftedValue = toDenary(answer);
    return [
      `Move each bit ${places} place${places === 1 ? '' : 's'} ${direction}; fill vacated places with 0.`,
      direction === 'left'
        ? `A left shift multiplies by 2^${places}: ${value} × ${2 ** places} = ${shiftedValue}.`
        : `A right shift divides by 2^${places}: ${value} ÷ ${2 ** places} = ${shiftedValue} remainder ${value % (2 ** places)}; discard the remainder.`,
      `The ${format.width}-bit result is ${answer}.`,
    ];
  }
  if (type === 'binary-fraction-to-denary') {
    const bits = prompt.match(/0\.([01]+)₂/)?.[1] || '';
    const placeValues = [...bits].flatMap((bit, index) => (
      bit === '1' ? [`1/2^${index + 1} = ${1 / (2 ** (index + 1))}`] : []
    ));
    return [
      ...placeValues,
      `Add the fractional place values: ${answer}.`,
    ];
  }
  if (type === 'denary-to-binary-fraction') {
    const value = Number(prompt.match(/Convert (-?\d+(?:\.\d+)?)/)?.[1]);
    const [integerBits, fractionBits] = String(answer).replace(/^-/, '').split('.');
    let fraction = Math.abs(value) - Math.floor(Math.abs(value));
    const steps = [`Convert the integer part to binary: ${toBinary(Math.floor(Math.abs(value)))}.`];
    for (const bit of fractionBits) {
      const previousFraction = fraction;
      const doubled = previousFraction * 2;
      const integerBit = Math.floor(doubled);
      fraction = doubled - integerBit;
      steps.push(`${previousFraction} × 2 = ${doubled}; take integer bit ${integerBit}.`);
    }
    steps.push(`Combine the parts: ${integerBits}.${fractionBits}.`);
    return steps;
  }
  if (type === 'floating-point-decode' || type === 'floating-point') {
    const [, mantissa, exponent] = prompt.match(/mantissa ([01]+) and 4-bit two's-complement exponent ([01]+)/);
    const signedMantissa = signedBinaryValue(mantissa);
    const signedExponent = signedBinaryValue(exponent);
    return [
      `Decode the mantissa as ${signedMantissa} and the exponent as ${signedExponent} using two's complement.`,
      `Mantissa value: ${signedMantissa} ÷ 2^7 = ${signedMantissa / 128}.`,
      `Apply the exponent: (${signedMantissa} ÷ 2^7) × 2^${signedExponent} = ${answer}.`,
    ];
  }
  if (type === 'floating-point-encode') {
    const value = Number(prompt.match(/Convert (-?\d+(?:\.\d+)?)/)?.[1]);
    const [mantissa, exponentBits] = String(answer).split(/\s+/);
    const decoded = decodeFloatingPoint(mantissa, exponentBits);
    const mantissaValue = signedBinaryValue(mantissa);
    return [
      `Choose exponent ${decoded.exponent} so ${value} ÷ 2^${decoded.exponent} = ${mantissaValue / 128}, in [0.5, 1) or [−1, −0.5).`,
      `Write the mantissa as an 8-bit two's-complement value: ${mantissa}.`,
      `Write exponent ${decoded.exponent} as 4-bit two's complement: ${exponentBits}.`,
    ];
  }
  if (type === 'floating-point-normalise') {
    const [, initialMantissa, initialExponent] = prompt.match(
      /mantissa (?:the )?(?:8-bit )?([01]+) and (?:the )?(?:4-bit )?exponent ([01]+)/,
    );
    let mantissa = initialMantissa;
    let shifts = 0;
    while (!isNormalisedMantissa(mantissa) && shifts < mantissa.length) {
      mantissa = `${mantissa.slice(1)}0`;
      shifts += 1;
    }
    const oldExponent = signedBinaryValue(initialExponent);
    const [normalMantissa, normalExponent] = String(answer).split(/\s+/);
    return [
      `Shift the mantissa left ${shifts} place${shifts === 1 ? '' : 's'} until its first two bits differ: ${normalMantissa}.`,
      `Subtract ${shifts} from exponent ${oldExponent}: ${oldExponent} − ${shifts} = ${oldExponent - shifts}.`,
      `Encode the adjusted exponent in 4-bit two's complement: ${normalExponent}.`,
    ];
  }
  if (type === 'floating-point-exponent-decode') {
    const exponent = prompt.match(/exponent ([01]+)/)?.[1] || '';
    const signedWeight = -(2 ** (exponent.length - 1));
    const signedContribution = exponent[0] === '1' ? signedWeight : 0;
    const positiveWeights = binaryPlaceValueSteps(exponent.slice(1));
    return [
      `The most significant bit has negative weight ${signedWeight}; its contribution is ${signedContribution}.`,
      ...positiveWeights,
      `Add the signed weights: ${answer}.`,
    ];
  }
  return [`Answer: ${answer}.`];
}

function attachQuestionMetadata(question) {
  const format = getGeneratedFormat(question.type, question.prompt, question.answer);
  return {
    ...question,
    format,
    working: workingForQuestion(question, format),
  };
}

function makeQuestion(tier, type) {
  return attachQuestionMetadata(makeQuestionBase(tier, type));
}

function makeQuestionBase(tier, type) {
  const [minimumLength, maximumLength] = tier.binaryLength;
  const bitLength = Math.min(randomInt(minimumLength, maximumLength), 8);
  const rawValue = randomInt(0, Math.min(tier.conversionRange[1], 2 ** bitLength - 1));
  const binary = toBinary(rawValue).padStart(bitLength, '0');
  const width = tier.arithmeticWidth;

  if (type === 'binary-to-denary') {
    return {
      type,
      prompt: `Convert ${binary}₂ to denary (base 10).`,
      answer: toDenary(binary),
    };
  }

  if (type === 'binary-to-hex') {
    return {
      type,
      prompt: `Convert ${binary}₂ to hexadecimal.`,
      answer: toHex(toDenary(binary)),
    };
  }

  if (type === 'denary-to-binary') {
    const number = randomInt(0, tier.conversionRange[1]);
    return {
      type,
      prompt: `Convert ${number} to binary.`,
      answer: toBinary(number),
    };
  }

  if (type === 'hex-to-denary') {
    const number = randomInt(0, tier.conversionRange[1]);
    const hex = toHex(number);
    return {
      type,
      prompt: `Convert ${hex}₁₆ to denary (base 10).`,
      answer: number,
    };
  }

  if (type === 'hex-to-binary') {
    const number = randomInt(0, tier.conversionRange[1]);
    const hex = toHex(number);
    return {
      type,
      prompt: `Convert ${hex}₁₆ to binary using ${hex.length * 4} bits and group the answer into 4-bit nibbles.`,
      answer: toBinary(number).padStart(hex.length * 4, '0'),
    };
  }

  if (type === 'denary-to-hex') {
    const number = randomInt(0, tier.conversionRange[1]);
    return {
      type,
      prompt: `Convert ${number} to hexadecimal.`,
      answer: toHex(number),
    };
  }

  if (type === 'binary-addition') {
    const first = randomInt(0, 2 ** width - 1);
    const second = randomInt(0, 2 ** width - 1);
    const result = first + second;
    return {
      type,
      prompt: `Add ${toBinary(first)}₂ and ${toBinary(second)}₂. Give your answer in binary.`,
      answer: toBinary(result),
    };
  }

  if (type === 'binary-subtraction') {
    const first = randomInt(1, 2 ** width - 1);
    const second = randomInt(0, first);
    const result = first - second;
    return {
      type,
      prompt: `Calculate ${toBinary(first)}₂ − ${toBinary(second)}₂. Give your answer in binary.`,
      answer: toBinary(result),
    };
  }

  if (type === 'two-complement-encode') {
    const selectedWidth = tier.twoComplementWidths[
      randomInt(0, tier.twoComplementWidths.length - 1)
    ];
    const signed = randomInt(-(2 ** (selectedWidth - 1)), (2 ** (selectedWidth - 1)) - 1);
    return {
      type,
      prompt: `Convert ${signed} to a signed two's-complement representation using ${selectedWidth} bits. Give your answer in binary.`,
      answer: toTwosComplement(signed, selectedWidth),
    };
  }

  if (type === 'two-complement-decode' || type === 'two-complement') {
    const selectedWidth = tier.twoComplementWidths[
      randomInt(0, tier.twoComplementWidths.length - 1)
    ];
    const raw = randomInt(0, (2 ** selectedWidth) - 1);
    return {
      type,
      prompt: `Interpret ${raw.toString(2).padStart(selectedWidth, '0')}₂ as a signed two's-complement ${selectedWidth}-bit value. Give the denary value.`,
      answer: twoComplement(raw, selectedWidth),
    };
  }

  if (type === 'two-complement-addition' || type === 'two-complement-subtraction') {
    const selectedWidth = tier.twoComplementWidths[
      randomInt(0, tier.twoComplementWidths.length - 1)
    ];
    const minimum = -(2 ** (selectedWidth - 1));
    const maximum = (2 ** (selectedWidth - 1)) - 1;
    const operandMinimum = -(2 ** (selectedWidth - 2));
    const operandMaximum = (2 ** (selectedWidth - 2)) - 1;
    const first = randomInt(operandMinimum, operandMaximum);
    const isAddition = type === 'two-complement-addition';
    const secondMinimum = isAddition
      ? Math.max(operandMinimum, minimum - first)
      : Math.max(operandMinimum, first - maximum);
    const secondMaximum = isAddition
      ? Math.min(operandMaximum, maximum - first)
      : Math.min(operandMaximum, first - minimum);
    const second = randomInt(secondMinimum, secondMaximum);
    const result = isAddition ? first + second : first - second;
    const operator = isAddition ? '+' : '−';
    return {
      type,
      prompt: `${isAddition ? 'Add' : 'Subtract'} ${toTwosComplement(first, selectedWidth)}₂ ${operator} ${toTwosComplement(second, selectedWidth)}₂ using ${selectedWidth}-bit two's complement. Give the ${selectedWidth}-bit binary result (no overflow occurs).`,
      answer: toTwosComplement(result, selectedWidth),
    };
  }

  if (type === 'bit-capacity') {
    const questionKind = randomInt(0, 2);
    if (questionKind === 0) {
      const count = 2 ** randomInt(1, 8);
      return {
        type,
        prompt: `How many bits are needed to represent ${count} different unsigned values?`,
        answer: Math.log2(count),
      };
    }
    if (questionKind === 1) {
      const bits = randomInt(1, 8);
      return {
        type,
        prompt: `What is the largest unsigned denary value that can be stored in ${bits} bits?`,
        answer: (2 ** bits) - 1,
      };
    }
    const value = randomInt(1, 255);
    return {
      type,
      prompt: `What is the minimum number of bits needed to store the unsigned value ${value}?`,
      answer: Math.ceil(Math.log2(value + 1)),
    };
  }

  if (type === 'binary-shift') {
    const shift = randomInt(1, 3);
    const direction = randomInt(0, 1) === 0 ? 'left' : 'right';
    const maximumInput = direction === 'left'
      ? Math.floor(((2 ** width) - 1) / (2 ** shift))
      : (2 ** width) - 1;
    const bits = toBinary(randomInt(0, maximumInput)).padStart(width, '0');
    const shifted = direction === 'left'
      ? (Number.parseInt(bits, 2) << shift) & ((2 ** width) - 1)
      : Number.parseInt(bits, 2) >>> shift;
    return {
      type,
      prompt: `Apply a ${shift}-place logical shift ${direction} to ${bits}₂. Give the ${width}-bit result.`,
      answer: toBinary(shifted).padStart(width, '0'),
    };
  }

  if (type === 'binary-fraction-to-denary') {
    const fractionWidth = randomInt(3, 4);
    const fractionBits = toBinary(randomInt(1, (2 ** fractionWidth) - 1))
      .padStart(fractionWidth, '0');
    return {
      type,
      prompt: `Convert the binary fraction 0.${fractionBits}₂ to denary.`,
      answer: binaryFractionToDenary(`0.${fractionBits}`),
    };
  }

  if (type === 'denary-to-binary-fraction') {
    const fractionWidth = 3;
    const simpleValues = [0.5, 0.625, 0.75, 0.875, 1.25, 1.5, 1.75, 2.5, 2.75];
    const value = simpleValues[randomInt(0, simpleValues.length - 1)];
    return {
      type,
      prompt: `Convert ${value} to binary with ${fractionWidth} fractional bits.`,
      answer: denaryToBinaryFraction(value, fractionWidth),
    };
  }

  if (type === 'floating-point-encode') {
    const example = makeFloatingPointExample();
    const encoded = encodeFloatingPoint(example.value);
    return {
      type,
      prompt: `Convert ${example.value} to normalized floating point (point after the sign bit). Give an 8-bit signed mantissa and a 4-bit exponent.`,
      answer: `${encoded.mantissa} ${encoded.exponent}`,
    };
  }

  if (type === 'floating-point-decode' || type === 'floating-point') {
    const example = makeFloatingPointExample();
    return {
      type,
      prompt: `Convert the 8-bit mantissa ${example.mantissa} and 4-bit two's-complement exponent ${example.exponent} to denary (point after the mantissa sign bit).`,
      answer: example.value,
    };
  }

  if (type === 'floating-point-normalise') {
    const mantissaValues = [16, 32, 48, -16, -32, -48];
    const mantissaValue = mantissaValues[randomInt(0, mantissaValues.length - 1)];
    const exponentValues = [-1, 0, 1, 2];
    const exponentValue = exponentValues[randomInt(0, exponentValues.length - 1)];
    const mantissa = toTwosComplement(mantissaValue, FLOAT_MANTISSA_BITS);
    const exponent = toTwosComplement(exponentValue, FLOAT_EXPONENT_BITS);
    const normalised = normaliseFloatingPoint(mantissa, exponent);
    return {
      type,
      prompt: `Normalise the 8-bit mantissa ${mantissa} and the 4-bit exponent ${exponent} (point after the sign bit). Give an 8-bit mantissa and a 4-bit exponent.`,
      answer: `${normalised.mantissa} ${normalised.exponent}`,
    };
  }

  if (type === 'floating-point-exponent-decode') {
    const exponentValues = [-3, -2, -1, 0, 1, 2, 3];
    const exponentValue = exponentValues[randomInt(0, exponentValues.length - 1)];
    const exponentBits = toTwosComplement(exponentValue, FLOAT_EXPONENT_BITS);
    return {
      type,
      prompt: `Convert the 4-bit two's-complement exponent ${exponentBits} to denary.`,
      answer: exponentValue,
    };
  }

  throw new Error(`Unsupported question type: ${type}`);
}

export function generateQuestion(tierName, typeOverride) {
  const tier = tierCatalog[tierName] || tierCatalog['GCSE Higher'];
  const typeList = tier.questionTypes;
  const selectedType = typeOverride || typeList[randomInt(0, typeList.length - 1)];
  return makeQuestion(tier, selectedType);
}

export function generateQuestionSet(tierName, quantity = 10, topicIds) {
  const tier = tierCatalog[tierName] || tierCatalog['GCSE Higher'];
  const enabledTopics = topicIds === undefined
    ? tier.topics
    : [...new Set(topicIds.filter((topicId) => tier.topics.includes(topicId)))];
  if (enabledTopics.length === 0) return [];

  const shuffledTopics = [...enabledTopics];
  for (let index = shuffledTopics.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [shuffledTopics[index], shuffledTopics[swapIndex]] = [
      shuffledTopics[swapIndex],
      shuffledTopics[index],
    ];
  }

  const set = [];
  for (let i = 0; i < quantity; i += 1) {
    const topicId = i < shuffledTopics.length
      ? shuffledTopics[i]
      : enabledTopics[randomInt(0, enabledTopics.length - 1)];
    const typeList = topicCatalog[topicId].questionTypes;
    const type = typeList[randomInt(0, typeList.length - 1)];
    set.push(generateQuestion(tierName, type));
  }
  return set;
}
