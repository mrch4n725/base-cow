const conversionQuestionTypes = [
  'binary-to-denary',
  'denary-to-binary',
  'binary-to-hex',
  'hex-to-binary',
  'denary-to-hex',
  'hex-to-denary',
];

const floatingPointQuestionTypes = [
  'floating-point-encode',
  'floating-point-decode',
  'floating-point-normalise',
  'floating-point-exponent-decode',
];

const FLOAT_MANTISSA_BITS = 8;
const FLOAT_EXPONENT_BITS = 4;

export const tierCatalog = {
  'KS3': {
    label: 'KS3',
    description: 'Foundations: byte-sized binary, denary and hexadecimal conversions.',
    questionTypes: [...conversionQuestionTypes, 'bit-capacity', 'binary-shift'],
    binaryLength: [4, 8],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'GCSE Foundation': {
    label: 'GCSE Foundation',
    description: 'Byte-sized conversions, binary arithmetic and logical shifts.',
    questionTypes: [
      'binary-addition',
      'binary-subtraction',
      ...conversionQuestionTypes,
      'bit-capacity',
      'binary-shift',
    ],
    binaryLength: [4, 10],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'GCSE Higher': {
    label: 'GCSE Higher',
    description: 'Two’s-complement conversion and arithmetic, plus byte-sized base conversions.',
    questionTypes: [
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
      'binary-addition',
      'binary-subtraction',
      ...conversionQuestionTypes,
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
      'bit-capacity',
      'binary-shift',
      'binary-fraction-to-denary',
      'denary-to-binary-fraction',
      ...floatingPointQuestionTypes,
    ],
    binaryLength: [6, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'A-Level AS': {
    label: 'A-Level AS',
    description: 'Floating-point and binary-fraction practice with signed arithmetic and base conversions.',
    questionTypes: [
      ...floatingPointQuestionTypes,
      'binary-fraction-to-denary',
      'denary-to-binary-fraction',
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
      'binary-addition',
      'binary-subtraction',
      ...conversionQuestionTypes,
      'bit-capacity',
      'binary-shift',
    ],
    binaryLength: [8, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8, 16],
  },
  'A-Level A2': {
    label: 'A-Level A2',
    description: 'A-level floating-point, binary fractions, signed arithmetic and conversions.',
    questionTypes: [
      ...floatingPointQuestionTypes,
      'binary-fraction-to-denary',
      'denary-to-binary-fraction',
      'two-complement-encode',
      'two-complement-decode',
      'two-complement-addition',
      'two-complement-subtraction',
      'binary-addition',
      'binary-subtraction',
      ...conversionQuestionTypes,
      'bit-capacity',
      'binary-shift',
    ],
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
  const text = String(raw).trim().toLowerCase();
  if (!text) return null;
  if (base === 16) {
    const normalised = text.replace(/^0x/, '').replace(/\s+/g, '');
    if (/^[0-9a-f]+$/.test(normalised)) return parseInt(normalised, 16);
  }
  if (base === 2) {
    const normalised = text.replace(/^0b/, '').replace(/\s+/g, '');
    if (/^[01]+$/.test(normalised)) return toDenary(normalised);
  }
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) return Number(text);
  return null;
}

export function evaluateAnswer(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null || String(userAnswer).trim() === '') {
    return false;
  }

  const expected = question.answer;
  const raw = String(userAnswer).trim();

  if (typeof expected === 'number') {
    const parsed = parseAnswerValue(raw, 10);
    if (parsed !== null && parsed === expected) return true;
    if (question.type !== 'hex-to-denary') return false;
    const hexParsed = parseAnswerValue(raw, 16);
    return hexParsed !== null && hexParsed === expected;
  }

  if (typeof expected === 'string') {
    if (question.type === 'floating-point-encode' || question.type === 'floating-point-normalise') {
      const [expectedMantissa, expectedExponent] = expected.split(/\s+/);
      const compactActual = raw.replace(/\s+/g, '').replace(/^(?:0b)/i, '');
      const match = raw.match(/^\s*(?:0b)?([01]+)\s*(?:[,;:|/]\s*|\s+)(?:0b)?([01]+)\s*$/i);
      if (match) {
        return match[1] === expectedMantissa && match[2] === expectedExponent;
      }
      return compactActual === `${expectedMantissa}${expectedExponent}`;
    }

    const expectedValue = expected.replace(/\s+/g, '').toLowerCase();
    const actualValue = raw.replace(/\s+/g, '').toLowerCase();
    if (['binary-to-hex', 'denary-to-hex'].includes(question.type)) {
      const cleanActual = actualValue.replace(/^0x/, '');
      if (!/^[0-9a-f]+$/.test(cleanActual)) return false;
      return parseInt(cleanActual, 16) === parseInt(expectedValue, 16);
    }
    if (['denary-to-binary', 'hex-to-binary'].includes(question.type)) {
      const cleanActual = actualValue.replace(/^0b/, '');
      if (!/^[01]+$/.test(cleanActual)) return false;
      return toDenary(cleanActual) === toDenary(expectedValue);
    }
    if (/^[01]+$/.test(expectedValue)) {
      return actualValue.replace(/^0b/, '') === expectedValue;
    }
    return expectedValue === actualValue;
  }

  return false;
}

export function markAnswers(questions, answers) {
  const results = questions.map((question, index) => {
    const correct = evaluateAnswer(question, answers[index]);
    return {
      correct,
      answer: question.answer,
    };
  });
  return {
    results,
    score: results.filter(({ correct }) => correct).length,
  };
}

function makeQuestion(tier, type) {
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
      prompt: `Convert ${hex}₁₆ to binary, grouping the answer into 4-bit nibbles.`,
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
    const bits = toBinary(randomInt(0, (2 ** width) - 1)).padStart(width, '0');
    const shift = randomInt(1, 3);
    const direction = randomInt(0, 1) === 0 ? 'left' : 'right';
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
      prompt: `Convert ${example.value} to normalized floating point (8-bit signed mantissa, point after sign bit; 4-bit exponent).`,
      answer: `${encoded.mantissa} ${encoded.exponent}`,
    };
  }

  if (type === 'floating-point-decode' || type === 'floating-point') {
    const example = makeFloatingPointExample();
    return {
      type,
      prompt: `Convert mantissa ${example.mantissa} and 4-bit two's-complement exponent ${example.exponent} to denary (point after mantissa sign bit).`,
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
      prompt: `Normalise mantissa ${mantissa} and exponent ${exponent} (point after sign bit; 4-bit exponent).`,
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

export function generateQuestionSet(tierName, quantity = 10) {
  const tier = tierCatalog[tierName] || tierCatalog['GCSE Higher'];
  const set = [];
  for (let i = 0; i < quantity; i += 1) {
    set.push(generateQuestion(tierName, tier.questionTypes[i % tier.questionTypes.length]));
  }
  return set;
}
