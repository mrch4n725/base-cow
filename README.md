# Bag of Cows number-representation practice

A lightweight revision site for UK Computer Science students, inspired by the original Bag of Cows binary question generator. Practice is weighted toward two's-complement representation and signed arithmetic, with shorter, curriculum-sized base-conversion questions.

## Features

- Tiered question generation for KS3, GCSE Foundation, GCSE Higher, AS and A2
- Two's-complement encoding and decoding, plus signed addition and subtraction
- Conversions in both directions between binary, denary and hexadecimal
- Byte-sized unsigned binary addition, subtraction and logical shifts
- Bit-capacity, binary-fraction and floating-point questions
- Teacher answer reveal toggle and scoring
- Question-set codes for reference

Ordinary base-conversion questions use values up to one byte (0–255), avoiding long, oversized binary strings. GCSE Higher and above give priority to two's-complement questions; all six base-conversion directions remain available.

## Curriculum reference

The [AQA AS Computer Science 7516 specification](https://www.aqa.org.uk/subjects/computer-science/as-level/computer-science-7516/specification/subject-content/fundamentals-of-data-representation) is the primary curriculum reference for base conversion, two's-complement signed conversion/subtraction, bit ranges and binary fractions. The [AQA GCSE Computer Science 8525 specification](https://www.aqa.org.uk/subjects/computer-science/gcse/computer-science-8525/specification/subject-content/fundamentals-of-data-representation) also specifies number-base conversion, binary addition and logical shifts. The [archived Bag of Cows homepage](https://web.archive.org/web/20191023212751id_/http://bagofcows.com/) describes the original binary question generator's coverage of conversions, fractions, two's complement, and real numbers with mantissa and exponent. The live Bag of Cows site now redirects to its retirement notice.

## Run locally

```bash
cd /workspaces/base-cow
python3 -m http.server 8000
```

Then open:

http://localhost:8000

## Tests

```bash
cd /workspaces/base-cow
npm test
```
