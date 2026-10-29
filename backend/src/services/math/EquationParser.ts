import { create, all } from 'mathjs';
import { ProblemType } from '../../types/math';

const math = create(all);

export interface ParsedEquation {
  left: string;
  right: string;
  normalized: string;
  problemType: ProblemType;
  variable: string;
}

/** CoMER / LaTeX often emits 2^{x}=2^{4}; solvers expect 2^x=2^4 or 2^(x+1). */
export function unwrapLatexExponents(input: string): string {
  return input.replace(/\^\s*\{([^{}]+)\}/g, (_match, inner: string) => {
    const exponent = String(inner).replace(/\s+/g, '');
    if (/^[a-zA-Z]$/.test(exponent) || /^-?\d+$/.test(exponent)) {
      return `^${exponent}`;
    }
    return `^(${exponent})`;
  });
}

const UNICODE_SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
  'ⁿ': 'n',
  'ˣ': 'x',
};

/** Convert attached unicode superscripts (2⁴, 2ˣ) into caret exponents. */
export function convertUnicodeSuperscripts(input: string): string {
  return input.replace(
    /([0-9a-zA-Z])([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿˣ]+)/gi,
    (_match, base: string, supers: string) => {
      const exponent = [...supers].map((ch) => UNICODE_SUPERSCRIPTS[ch] ?? ch).join('');
      return `${base}^${exponent}`;
    }
  );
}

export function normalizeMathInput(input: string): string {
  return convertUnicodeSuperscripts(
    unwrapLatexExponents(
      input
        .trim()
        .replace(/[×·]/g, '*')
        .replace(/÷/g, '/')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/√/g, 'sqrt')
        .replace(/–|−/g, '-')
        // Voice/keyboard sometimes emits duplicate equals (e.g. "3+4==").
        .replace(/(?:\s*=\s*){2,}/g, '=')
    )
  )
    .replace(/\s+/g, '')
    .replace(/(\d)([a-zA-Z])/g, '$1*$2')
    .replace(/\)\(/g, ')*(');
}

export function extractGraphExpression(input: string): string | null {
  const patterns = [
    /graph\s+y\s*=\s*(.+)/i,
    /plot\s+y\s*=\s*(.+)/i,
    /graph\s+(.+)/i,
    /plot\s+(.+)/i,
    /^y\s*=\s*(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return normalizeGraphExpr(match[1].trim());
  }
  return null;
}

function normalizeGraphExpr(expr: string): string {
  let e = normalizeMathInput(expr);
  if (e.startsWith('y=')) e = e.slice(2);
  return e;
}

export function parseEquation(input: string): ParsedEquation | null {
  const simultaneous = parseSimultaneousInput(input);
  if (simultaneous) {
    return {
      left: simultaneous.equations[0]?.left ?? '',
      right: simultaneous.equations[0]?.right ?? '',
      normalized: simultaneous.normalized,
      problemType: 'simultaneous',
      variable: simultaneous.variable,
    };
  }

  const normalized = normalizeMathInput(input);
  const graphExpr = extractGraphExpression(input);
  if (graphExpr) {
    return {
      left: graphExpr,
      right: '0',
      normalized: `y=${graphExpr}`,
      problemType: 'graph',
      variable: 'x',
    };
  }

  const eqIndex = normalized.indexOf('=');
  if (eqIndex === -1) return null;

  let left = normalized.slice(0, eqIndex);
  let right = normalized.slice(eqIndex + 1);

  if (!left && right) {
    if (!/[a-zA-Z]/.test(right)) {
      return {
        left: right,
        right: '',
        normalized: `${right}=`,
        problemType: 'arithmetic',
        variable: 'x',
      };
    }
    left = right;
    right = '0';
  }

  if (left && !right) {
    if (!/[a-zA-Z]/.test(left)) {
      return {
        left,
        right: '',
        normalized: `${left}=`,
        problemType: 'arithmetic',
        variable: 'x',
      };
    }
    right = '0';
  }

  const variable = detectVariable(left + right);
  const problemType = classifyEquation(left, right, variable);

  return { left, right, normalized: `${left}=${right}`, problemType, variable };
}

function detectVariable(expr: string): string {
  const match = expr.match(/[a-zA-Z]/);
  return match ? match[0].toLowerCase() : 'x';
}

function classifyEquation(left: string, right: string, variable: string): ProblemType {
  const combined = `${left}${right}`;

  if (/\|[^|]+\|/.test(combined)) return 'absolute_value';

  if (/(?:\d+|e)\^[^=]*[a-zA-Z]|[a-zA-Z]\^[a-zA-Z]/.test(combined)) return 'exponential';

  const varPattern = new RegExp(`${variable}\\^2|${variable}²`, 'i');
  const linearPattern = new RegExp(`${variable}(?!\\^|\\d)`, 'i');

  if (varPattern.test(combined)) return 'quadratic';
  if (linearPattern.test(combined)) return 'linear';
  if (/[a-zA-Z]/.test(combined)) return 'expression';
  return 'arithmetic';
}

export interface ParsedSimultaneous {
  equations: Array<{ left: string; right: string }>;
  normalized: string;
  variable: string;
}

export function parseSimultaneousInput(input: string): ParsedSimultaneous | null {
  const raw = input.trim();
  const parts = raw
    .split(/\s*(?:;|\band\b|\n)\s*|\s*,\s*(?=[^,=]+=)/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  const equations: Array<{ left: string; right: string }> = [];
  for (const part of parts) {
    const normalized = normalizeMathInput(part);
    const eqIndex = normalized.indexOf('=');
    if (eqIndex === -1) return null;
    equations.push({
      left: normalized.slice(0, eqIndex),
      right: normalized.slice(eqIndex + 1),
    });
  }

  const combined = equations.map((eq) => `${eq.left}${eq.right}`).join('');
  const variables = [...combined.matchAll(/[a-zA-Z]/g)].map((m) => m[0].toLowerCase());
  const uniqueVars = [...new Set(variables)];
  if (uniqueVars.length !== 2) return null;

  return {
    equations,
    normalized: equations.map((eq) => `${eq.left}=${eq.right}`).join(';'),
    variable: uniqueVars[0],
  };
}

export function moveToStandardForm(left: string, right: string, _variable: string): string {
  if (right === '0') return left;
  return `(${left})-(${right})`;
}

export interface QuadraticCoeffs {
  a: number;
  b: number;
  c: number;
}

function roundCoeff(n: number): number {
  return Math.round(n * 1e10) / 1e10;
}

function evalAt(expr: string, variable: string, value: number): number {
  const compiled = math.compile(expr.replace(/²/g, '^2').replace(/³/g, '^3'));
  const result = compiled.evaluate({ [variable]: value });
  return typeof result === 'number' ? result : Number(result);
}

export function parseQuadraticCoeffs(expr: string, variable: string): QuadraticCoeffs | null {
  try {
    const y0 = evalAt(expr, variable, 0);
    const y1 = evalAt(expr, variable, 1);
    const ym1 = evalAt(expr, variable, -1);
    if (![y0, y1, ym1].every((n) => Number.isFinite(n))) return null;

    return {
      a: roundCoeff((y1 + ym1) / 2 - y0),
      b: roundCoeff((y1 - ym1) / 2),
      c: roundCoeff(y0),
    };
  } catch {
    return parseQuadraticCoeffsFallback(expr, variable);
  }
}

function parseCoefficient(raw: string): number {
  const coef = raw.replace(/[()*]/g, '');
  if (coef === '' || coef === '+') return 1;
  if (coef === '-') return -1;
  const n = parseFloat(coef);
  return Number.isFinite(n) ? n : NaN;
}

function parseQuadraticCoeffsFallback(expr: string, variable: string): QuadraticCoeffs | null {
  const v = variable;
  let e = expr.replace(/\s/g, '').replace(/\*/g, '').replace(/[()]/g, '').replace(/\^2/g, '²');

  if (e.startsWith('+')) e = e.slice(1);

  let a = 0;
  let b = 0;
  let c = 0;

  const terms = e.match(/[+-]?[^+-]+/g) ?? [];
  if (terms.length === 0) return null;

  for (const term of terms) {
    const t = term.trim();
    if (!t) continue;

    if (new RegExp(`${v}²|${v}\\^2`, 'i').test(t)) {
      a += parseCoefficient(t.replace(new RegExp(`${v}(²|\\^2)`, 'i'), ''));
    } else if (new RegExp(`${v}(?!²|\\^|\\d)`, 'i').test(t)) {
      b += parseCoefficient(t.replace(new RegExp(v, 'i'), ''));
    } else {
      const num = parseCoefficient(t);
      if (Number.isFinite(num)) c += num;
    }
  }

  if (![a, b, c].every((n) => Number.isFinite(n))) return null;
  return { a, b, c };
}

export function parseLinearCoeffs(expr: string, variable: string): { m: number; c: number } | null {
  const coeffs = parseQuadraticCoeffs(expr, variable);
  if (!coeffs) return null;
  return { m: coeffs.b, c: coeffs.c };
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n - Math.round(n)) < 1e-10) return String(Math.round(n));
  return n.toFixed(4).replace(/\.?0+$/, '');
}

export function formatFraction(numerator: string | number, denominator: string | number): string {
  return `[FRAC:${numerator}:${denominator}]`;
}

/** Display-friendly math: use × not *, ² not ^2, spaced operators. */
export function formatPrettyMath(expr: string): string {
  let s = expr.trim();
  if (!s) return s;

  s = s.replace(/\^2/g, '²').replace(/\^3/g, '³');
  s = s.replace(/(\d)\*([a-zA-Z])/g, '$1$2');
  s = s.replace(/(\d)\*\(/g, '$1(');
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\*/g, ' × ');
  s = s.replace(/\//g, ' ÷ ');
  s = s.replace(/\s*\+\s*/g, ' + ');
  s = s.replace(/\s*-\s*/g, ' - ');
  s = s.replace(/\s*=\s*/g, ' = ');
  s = s.replace(/\s*×\s*/g, ' × ');
  s = s.replace(/\s*÷\s*/g, ' ÷ ');
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

export function formatPrettyEquation(left: string, right: string): string {
  const lhs = formatPrettyMath(left);
  if (right === '' || right === undefined) return lhs;
  return `${lhs} = ${formatPrettyMath(right)}`;
}
