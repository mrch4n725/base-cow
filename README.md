# Bag of Cows successor

A lightweight revision site for UK Computer Science students, inspired by the original Bag of Cows binary question generator.

## Features

- Tiered question generation for KS3, GCSE Foundation, GCSE Higher, AS and A2
- Binary, denary and hexadecimal conversion practice
- Binary addition and subtraction
- Two's complement signed values
- Floating-point and fraction-style decimal reasoning
- Teacher answer reveal toggle and scoring
- Repeatable question sets with generation codes

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
