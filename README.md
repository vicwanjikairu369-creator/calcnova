# CalcNova

**One platform. Every calculation.**

A premium, private, single-page calculator workspace built with React, TypeScript, Vite and
Tailwind CSS. All calculations happen in your browser; nothing is uploaded.

## Features (working)

- **Basic calculator** — full keyboard support, memory (MC / MR / M+ / M− / MS), sign toggle, percent, copy result.
- **Scientific calculator** — trig with DEG/RAD modes, log₁₀, ln, √, ∛, n-th root, powers, |x|, n!, ⁿPᵣ, ⁿCᵣ, mod, π, e, scientific notation.
- **Graphing** — multiple equations on one canvas, zoom, pan-ranges, value table, discontinuity handling.
- **Equation solver** — linear, quadratic (real & complex roots), 2×2 systems, with steps.
- **Finance** — simple & compound interest, loan payment + 12-month amortisation preview, margin/markup, VAT.
- **Unit converter** — 12 categories including temperature and decimal-vs-binary data units.
- **Statistics** — mean, median, mode, range, variance, std dev, sample / population toggle, sorted data.
- **Programmer** — 8/16/32/64-bit widths, signed/unsigned, base conversion, AND/OR/XOR/LSH/RSH.
- **Utilities** — date difference, BMI (neutral framing), percentage, GCD/LCM, matrix add/multiply/det, scientific notation.
- **History & notebook** — local-only, searchable, copyable, exportable JSON.
- **Settings** — light/dark/system theme, angle mode, significant digits, thousands separator, reset.
- **Global search** — from the sidebar, mobile drawer and home page.

## Security & mathematical reliability

- Expressions are parsed by **mathjs**, not `eval` or `new Function`.
- Inputs are length-limited and identifiers like `eval`, `Function`, `__proto__` are rejected.
- Division by zero, `NaN`, `Infinity` and domain errors surface as clear user-facing messages.
- Numerical approximations are labelled as such in the equation solver.
- No secrets are stored in the client.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173