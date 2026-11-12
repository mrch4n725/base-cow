# Base Cow

A lightweight, single-page revision tool inspired by the original Bag of Cows question generator. Questions stay together on the page; students enter answers, check the set, and refresh it when ready.

## Features

- Five tier choices, with descriptions and topic availability for KS3, GCSE Foundation, GCSE Higher, A-Level AS and A-Level A2
- Topic toggles; a refreshed set covers every selected topic when the question count is high enough
- Binary, denary and hexadecimal conversions, arithmetic, shifts, and two's-complement
- Binary fraction conversion in both directions
- A-level floating-point encoding, decoding and normalization using an 8-bit signed mantissa and 4-bit two's-complement exponent
- Check a single answer with Enter, or check the full set to see its score
- Answer checking reveals right answers, explanations for incorrect answers, and expandable step-by-step working
- Light and dark themes that follow the system preference until manually changed; the choice is not saved
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
