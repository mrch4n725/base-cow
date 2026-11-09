export const tierCatalog = {
  'KS3': {
    label: 'KS3',
    description: 'Foundations for Year 7-9: short binary values and simple denary/hex conversions.',
    questionTypes: ['binary-to-denary', 'denary-to-binary', 'binary-to-hex', 'hex-to-denary'],
    binaryLength: [4, 8],
    denaryRange: [0, 255],
    hexRange: [0, 255],
  },
  'GCSE Foundation': {
    label: 'GCSE Foundation',
    description: 'GCSE Foundation level: binary, denary and hex with straightforward arithmetic.',
    questionTypes: ['binary-to-denary', 'denary-to-binary', 'binary-to-hex', 'hex-to-denary', 'binary-addition', 'binary-subtraction'],
    binaryLength: [4, 10],
    denaryRange: [0, 1023],
    hexRange: [0, 1023],
  },
  'GCSE Higher': {
    label: 'GCSE Higher',
    description: 'Higher tier work: larger numbers, two’s complement and floating-point reasoning.',
    questionTypes: ['binary-to-denary', 'denary-to-binary', 'binary-to-hex', 'hex-to-denary', 'binary-addition', 'binary-subtraction', 'two-complement', 'floating-point'],
    binaryLength: [6, 16],
    denaryRange: [0, 65535],
    hexRange: [0, 65535],
  },
  'A-Level AS': {
    label: 'A-Level AS',
    description: 'Transition into AS level computer science: signed values and structured bit manipulation.',
    questionTypes: ['binary-to-denary', 'denary-to-binary', 'binary-to-hex', 'hex-to-denary', 'two-complement', 'floating-point', 'binary-addition', 'binary-subtraction'],
    binaryLength: [8, 16],
    denaryRange: [0, 65535],
    hexRange: [0, 65535],
  },
  'A-Level A2': {
    label: 'A-Level A2',
    description: 'A2-level challenge: deeper number systems and representation of real numbers.',
    questionTypes: ['binary-to-denary', 'denary-to-binary', 'binary-to-hex', 'hex-to-denary', 'two-complement', 'floating-point', 'binary-addition', 'binary-subtraction', 'fraction-to-denary'],
    binaryLength: [8, 24],
    denaryRange: [0, 16777215],
    hexRange: [0, 16777215],
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

export function twoComplement(value, bits) {
  const width = Number(bits) || 8;
  const range = 2 ** width;
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
  if (/^-?\d+$/.test(text)) return Number(text);
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
    if (parsed !== null) return parsed === expected;
    const hexParsed = parseAnswerValue(raw, 16);
    if (hexParsed !== null) return hexParsed === expected;
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
  const range = tier.binaryLength;
  const bitLength = randomInt(range[0], range[1]);
  const rawValue = randomInt(0, 2 ** bitLength - 1);
  const binary = rawValue.toString(2).padStart(bitLength, '0');

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
    const number = randomInt(0, Math.min(tier.denaryRange[1], 2 ** bitLength - 1));
    return {
      type,
      prompt: `Convert ${number} to binary.`,
      answer: toBinary(number),
    };
  }

  if (type === 'hex-to-denary') {
    const number = randomInt(0, Math.min(tier.hexRange[1], 4095));
    const hex = toHex(number);
    return {
      type,
      prompt: `Convert ${hex}₁₆ to denary (base 10).`,
      answer: number,
    };
  }

  if (type === 'hex-to-binary') {
    const number = randomInt(0, Math.min(tier.hexRange[1], 4095));
    const hex = toHex(number);
    return {
      type,
      prompt: `Convert ${hex}₁₆ to binary.`,
      answer: toBinary(number),
    };
  }

  if (type === 'denary-to-hex') {
    const number = randomInt(0, Math.min(tier.hexRange[1], 4095));
    return {
      type,
      prompt: `Convert ${number} to hexadecimal.`,
      answer: toHex(number),
    };
  }

  if (type === 'binary-addition') {
    const first = randomInt(0, 2 ** Math.min(8, bitLength) - 1);
    const second = randomInt(0, 2 ** Math.min(8, bitLength) - 1);
    const result = first + second;
    return {
      type,
      prompt: `Add ${toBinary(first)}₂ and ${toBinary(second)}₂. Give your answer in binary.`,
      answer: toBinary(result),
    };
  }

  if (type === 'binary-subtraction') {
    const first = randomInt(1, 2 ** Math.min(8, bitLength) - 1);
    const second = randomInt(0, first);
    const result = first - second;
    return {
      type,
      prompt: `Calculate ${toBinary(first)}₂ − ${toBinary(second)}₂. Give your answer in binary.`,
      answer: toBinary(result),
    };
  }

  if (type === 'two-complement') {
    const width = randomInt(8, 16);
    const raw = randomInt(0, (2 ** width) - 1);
    const signed = twoComplement(raw, width);
    return {
      type,
      prompt: `Interpret ${raw.toString(2).padStart(width, '0')}₂ as a ${width}-bit two's complement number. What is the denary value?`,
      answer: signed,
    };
  }

  if (type === 'floating-point') {
    const mantissaBits = randomInt(3, 8);
    const exponent = randomInt(-3, 3);
    const mantissa = randomInt(1, 2 ** mantissaBits - 1);
    const value = (mantissa / (2 ** mantissaBits)) * (2 ** exponent);
    return {
      type,
      prompt: `A normalised floating point value has mantissa ${mantissa}/${2 ** mantissaBits} and exponent ${exponent}. What is the denary value to 3 d.p.?`,
      answer: Number(value.toFixed(3)),
    };
  }

  if (type === 'fraction-to-denary') {
    const numerator = randomInt(1, 15);
    const denominator = 2 ** randomInt(1, 5);
    const decimal = numerator / denominator;
    return {
      type,
      prompt: `Write ${numerator}/${denominator} as a denary fraction.`,
      answer: Number(decimal.toFixed(4)),
    };
  }

  return {
    type,
    prompt: 'Convert 1010₂ to denary.',
    answer: 10,
  };
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
