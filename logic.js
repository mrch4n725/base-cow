const conversionQuestionTypes = [
  'binary-to-denary',
  'denary-to-binary',
  'binary-to-hex',
  'hex-to-binary',
  'denary-to-hex',
  'hex-to-denary',
];

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
      'floating-point',
    ],
    binaryLength: [6, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8],
  },
  'A-Level AS': {
    label: 'A-Level AS',
    description: 'Signed two’s-complement conversion and arithmetic, with base conversions and real numbers.',
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
      'floating-point',
    ],
    binaryLength: [8, 16],
    conversionRange: [0, 255],
    arithmeticWidth: 8,
    twoComplementWidths: [8, 16],
  },
  'A-Level A2': {
    label: 'A-Level A2',
    description: 'Extended signed arithmetic, conversions, binary fractions and floating-point values.',
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
      'floating-point',
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
    if (parsed !== null) return Math.abs(parsed - expected) < 1e-9;
    const hexParsed = parseAnswerValue(raw, 16);
    if (hexParsed !== null) return Math.abs(hexParsed - expected) < 1e-9;
    return false;
  }

  if (typeof expected === 'string') {
    const cleanExpected = expected.replace(/\s+/g, '').toLowerCase();
    const cleanActual = raw.replace(/\s+/g, '').toLowerCase();
    if (question.type === 'hex-to-binary' || question.type === 'binary-to-hex' || question.type === 'denary-to-hex') {
      return cleanExpected === cleanActual.replace(/^0x/, '').replace(/^0b/, '');
    }
    return cleanExpected === cleanActual.replace(/^0x/, '').replace(/^0b/, '');
  }

  return false;
}

function makeBinaryQuestion(tier, type) {
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
    const fractionBits = toBinary(randomInt(1, 15)).padStart(4, '0');
    const value = [...fractionBits].reduce(
      (total, bit, index) => total + Number(bit) / (2 ** (index + 1)),
      0,
    );
    return {
      type,
      prompt: `Convert the binary fraction 0.${fractionBits}₂ to denary.`,
      answer: Number(value.toFixed(4)),
    };
  }

  if (type === 'floating-point') {
    const mantissaBits = randomInt(3, 8);
    const exponent = randomInt(-3, 3);
    const mantissa = randomInt(2 ** (mantissaBits - 1), (2 ** mantissaBits) - 1);
    const mantissaBinary = toBinary(mantissa).padStart(mantissaBits, '0');
    const value = (mantissa / (2 ** mantissaBits)) * (2 ** exponent);
    return {
      type,
      prompt: `A normalised binary floating-point value has mantissa 0.${mantissaBinary}₂ and exponent ${exponent}. What is its denary value to 3 d.p.?`,
      answer: Number(value.toFixed(3)),
    };
  }

  throw new Error(`Unsupported question type: ${type}`);
}

export function generateQuestion(tierName, typeOverride) {
  const tier = tierCatalog[tierName] || tierCatalog['GCSE Higher'];
  const typeList = tier.questionTypes;
  const selectedType = typeOverride || typeList[randomInt(0, typeList.length - 1)];
  return makeBinaryQuestion(tier, selectedType);
}

export function generateQuestionSet(tierName, quantity = 10) {
  const tier = tierCatalog[tierName] || tierCatalog['GCSE Higher'];
  const set = [];
  for (let i = 0; i < quantity; i += 1) {
    set.push(generateQuestion(tierName, tier.questionTypes[i % tier.questionTypes.length]));
  }
  return set;
}
