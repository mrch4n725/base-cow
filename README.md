# Base Cow

A lightweight, single-page revision tool inspired by the original Bag of Cows question generator. Questions stay together on the page; students enter answers, check the set, and refresh it when ready.

## Features

- Tiered questions for KS3, GCSE Foundation, GCSE Higher, AS and A2
- Binary, denary and hexadecimal conversions, arithmetic, shifts, and two's-complement
- Binary fraction conversion in both directions
- A-level floating-point encoding, decoding and normalization using an 8-bit signed mantissa and 4-bit two's-complement exponent
- Immediate right-answer feedback and a score when checking a set
- A small, topic-organized Resources section with links to established educational sites and official specifications

Floating-point questions use the value `signed mantissa / 2^7 × 2^signed exponent`. Normalized mantissas have different first and second bits. Conversion questions use exactly representable values, avoiding unexplained rounding.

## Curriculum reference

The [AQA A-level Computer Science specification](https://www.aqa.org.uk/subjects/computer-science/a-level/computer-science-7517/specification/subject-content/fundamentals-of-data-representation) informs number-base and binary fraction coverage. The [archived Bag of Cows homepage](https://web.archive.org/web/20191023212751id_/http://bagofcows.com/) describes the original generator's conversions, fractions, two's complement, and mantissa/exponent questions. The live Bag of Cows site now redirects to its retirement notice.

## Run locally

```bash
cd /workspaces/base-cow
python3 -m http.server 8000
```

Then open:

http://localhost:8000

## Alternatively, go to: 
```
mrch4n725.github.io/base-cow/
```

## Tests

```bash
cd /workspaces/base-cow
npm test
```
