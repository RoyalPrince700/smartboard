/**
 * Input normalization for the reasoning pipeline.
 */

import { looksLikeProbability } from '../../services/math/ProbabilitySolver';

export interface NormalizedInput {
  raw: string;
  normalized: string;
  /** Hint: looks like an equation */
  isEquation: boolean;
  /** Hint: contains x² / quadratic pattern */
  isQuadratic: boolean;
  /** Hint: contains x without x² */
  isLinear: boolean;
  /** Hint: variable in exponent, e.g. 2^x */
  isExponential: boolean;
  /** Hint: contains |...| */
  isAbsoluteValue: boolean;
  /** Hint: two or more equations */
  isSimultaneous: boolean;
  /** Hint: numeric expression without variables */
  isArithmetic: boolean;
  /** Hint: probability word problem or counting */
  isProbability: boolean;
  /** Hint: contains sine, cosine, or tangent */
  isTrigonometry: boolean;
}

const TRIG_PATTERN =
  /\b(?:sin|sine|cos|cosine|tan|tangent)\b|(?:^|[^a-zA-Z])(?:sin|cos|tan)(?=\d|\()/i;

/** Unwrap LaTeX exponents so 2^{x}=2^{4} becomes 2^x=2^4 for classification. */
function unwrapLatexExponents(input: string): string {
  return input.replace(/\^\s*\{([^{}]+)\}/g, (_match, inner: string) => {
    const exponent = String(inner).replace(/\s+/g, '');
    if (/^[a-zA-Z]$/.test(exponent) || /^-?\d+$/.test(exponent)) {
      return `^${exponent}`;
    }
    return `^(${exponent})`;
  });
}

export function normalizeReasoningInput(raw: string): NormalizedInput {
  const normalized = unwrapLatexExponents(
    raw
      .trim()
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
  ).replace(/\s+/g, ' ');

  const isEquation = /=/.test(normalized) || /\bsolve\b/i.test(normalized);
  const isQuadratic = /[a-zA-Z]\s*(?:\^?\s*2|²)/.test(normalized);
  const isTrigonometry = TRIG_PATTERN.test(normalized) || /\[trigonometry\]/i.test(normalized);
  const isProbability = looksLikeProbability(normalized);
  const isSimultaneous =
    normalized.split(/\s*(?:;|\band\b|\n)\s*|\s*,\s*(?=[^,=]+=)/i).filter((p) => p.trim().includes('=')).length >= 2;
  const isAbsoluteValue = /\|[^|]+\|/.test(normalized);
  const isExponential =
    /(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(normalized.replace(/\s/g, '')) && normalized.includes('=');
  const arithmeticCompact = normalized.replace(/\s/g, '');
  const isArithmetic =
    !/[a-zA-Z]/.test(arithmeticCompact) &&
    /\d/.test(arithmeticCompact) &&
    /[+\-*/^]/.test(arithmeticCompact.replace(/(^|[+\-*/^(])-/g, '$1'));
  const isLinear =
    /[a-zA-Z]/.test(normalized) &&
    !isQuadratic &&
    !isTrigonometry &&
    !isProbability &&
    !isExponential &&
    !isAbsoluteValue &&
    !isSimultaneous;

  return {
    raw,
    normalized,
    isEquation,
    isQuadratic,
    isLinear,
    isExponential,
    isAbsoluteValue,
    isSimultaneous,
    isArithmetic,
    isTrigonometry,
    isProbability,
  };
}

/** Infer equation degree from normalized input */
export function inferDegree(normalized: string): number | undefined {
  if (/[a-zA-Z]\s*(?:\^?\s*2|²)/.test(normalized)) return 2;
  if (/[a-zA-Z]/.test(normalized)) return 1;
  return undefined;
}

/** Build initial recognizedData hints before solver runs */
export function buildInputHints(normalized: string): Record<string, unknown> {
  const hints: Record<string, unknown> = {};

  const simultaneousParts = normalized
    .split(/\s*(?:;|\band\b|\n)\s*|\s*,\s*(?=[^,=]+=)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (simultaneousParts.length >= 2 && simultaneousParts.every((p) => p.includes('='))) {
    hints.problemType = 'simultaneous';
    return hints;
  }

  if (looksLikeProbability(normalized)) {
    hints.problemType = 'probability';
    return hints;
  }

  if (/\|[^|]+\|/.test(normalized) && normalized.includes('=')) {
    hints.problemType = 'absolute_value';
    return hints;
  }

  if (/(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(normalized.replace(/\s/g, '')) && normalized.includes('=')) {
    hints.problemType = 'exponential';
    return hints;
  }

  // Prefer equation patterns when the input is clearly an equation (avoids misroute from [geometry] prefix).
  if (/=/.test(normalized) && /[a-zA-Z]/.test(normalized)) {
    const degree = inferDegree(normalized);
    if (degree !== undefined) hints.degree = degree;
    if (/[a-zA-Z]\s*(?:\^?\s*2|²)/.test(normalized)) {
      hints.problemType = 'quadratic';
      return hints;
    }
    if (/[a-zA-Z]/.test(normalized)) {
      hints.problemType = 'linear';
      return hints;
    }
  }

  if (TRIG_PATTERN.test(normalized) || /\[trigonometry\]/i.test(normalized)) {
    hints.problemType = 'trigonometry';
    return hints;
  }
  if (/\[geometry\]|\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b|\bpythagoras\b/i.test(normalized)) {
    hints.problemType = 'geometry';
    return hints;
  }
  if (isArithmeticHint(normalized)) {
    hints.problemType = 'arithmetic';
    return hints;
  }
  const degree = inferDegree(normalized);
  if (degree !== undefined) hints.degree = degree;
  if (/[a-zA-Z]\s*(?:\^?\s*2|²)/.test(normalized)) hints.problemType = 'quadratic';
  else if (/[a-zA-Z]/.test(normalized)) hints.problemType = 'linear';
  return hints;
}

function isArithmeticHint(normalized: string): boolean {
  const compact = normalized.replace(/\s/g, '');
  return (
    !/[a-zA-Z]/.test(compact) &&
    /\d/.test(compact) &&
    /[+\-*/^=]/.test(compact)
  );
}
