export type EquationTopic =
  | 'linear'
  | 'quadratic'
  | 'exponential'
  | 'absolute_value'
  | 'simultaneous'
  | 'arithmetic'
  | 'probability'
  | 'geometry'
  | 'trigonometry';

export interface EquationClassification {
  isEquation: boolean;
  isMath: boolean;
  topic?: EquationTopic;
  degree?: number;
  confidence: number;
}

function normalizeEquationText(input: string): string {
  return input
    .trim()
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^\s*\{([^{}]+)\}/g, (_match, inner: string) => {
      const exponent = String(inner).replace(/\s+/g, '');
      if (/^[a-zA-Z]$/.test(exponent) || /^-?\d+$/.test(exponent)) {
        return `^${exponent}`;
      }
      return `^(${exponent})`;
    })
    .replace(/\s+/g, '');
}

function inferDegree(normalized: string): number | undefined {
  const explicitPowers = [...normalized.matchAll(/[a-zA-Z]\^(-?\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((power) => Number.isFinite(power));

  if (explicitPowers.length > 0) {
    return Math.max(...explicitPowers);
  }

  return /[a-zA-Z]/.test(normalized) ? 1 : undefined;
}

const TRIG_PATTERN =
  /\b(?:sin|sine|cos|cosine|tan|tangent)\b|(?:^|[^a-zA-Z])(?:sin|cos|tan)(?=\d|\()/i;

/** Match typed or spoken probability prompts (no equation required). */
export function looksLikeProbability(input: string): boolean {
  const text = input.toLowerCase();
  return (
    /\bprobabilit(?:y|ies)\b/.test(text) ||
    /\bchance\b/.test(text) ||
    /\blikelihood\b/.test(text) ||
    /\bcomplement(?:ary)?\b/.test(text) ||
    /\bmutually\s+exclusive\b/.test(text) ||
    /\bindependent\s+events?\b/.test(text) ||
    /\bcombinat(?:ion|ions)\b|\bnCr\b|\bchoose\b/i.test(input) ||
    /\bpermutat(?:ion|ions)\b|\bnPr\b/i.test(input) ||
    /\bP\s*\(\s*[^)]+\s*\)/.test(input) ||
    /\b[CP]\s*\(\s*\d+\s*,\s*\d+\s*\)/.test(input) ||
    /\b\d+\s*[CP]\s*\d+\b/.test(input) ||
    (/\b(?:die|dice|coin|bag|balls?|marbles?|cards?)\b/.test(text) &&
      /\b(?:probabilit|chance|pick|draw|roll|toss|select)\b/.test(text))
  );
}

export function classifyEquationInput(input: string): EquationClassification {
  const raw = input.trim();
  if (
    /\[trigonometry\]/i.test(raw) ||
    (/\bshape\s*=\s*triangle\b/i.test(raw) &&
      /\bfind\s*=\s*unknown_angle\b/i.test(raw) &&
      /\bvalues\s*=/i.test(raw) &&
      (/(?:θ|theta|unknownAngles)/i.test(raw) || TRIG_PATTERN.test(raw)))
  ) {
    return { isEquation: false, isMath: true, topic: 'trigonometry', confidence: 0.92 };
  }
  if (TRIG_PATTERN.test(raw)) {
    return {
      isEquation: raw.includes('='),
      isMath: true,
      topic: 'trigonometry',
      confidence: 0.95,
    };
  }
  if (/\[geometry\]|\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b|\bhypotenuse\b|\bpythagoras\b|\bperimeter\b|\bcircumference\b|\bradius\b|\barea of\b/i.test(raw)) {
    return { isEquation: false, isMath: true, topic: 'geometry', confidence: 0.9 };
  }

  if (looksLikeProbability(raw)) {
    return { isEquation: false, isMath: true, topic: 'probability', confidence: 0.93 };
  }

  const simultaneousParts = raw
    .split(/\s*(?:;|\band\b|\n)\s*|\s*,\s*(?=[^,=]+=)/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (simultaneousParts.length >= 2 && simultaneousParts.every((p) => p.includes('='))) {
    return { isEquation: true, isMath: true, topic: 'simultaneous', confidence: 0.93 };
  }

  if (/\|[^|]+\|/.test(raw) && raw.includes('=')) {
    return { isEquation: true, isMath: true, topic: 'absolute_value', confidence: 0.92 };
  }

  if (/(?:\d+|e)\^[^=]*[a-zA-Z]/i.test(normalizeEquationText(raw)) && raw.includes('=')) {
    return { isEquation: true, isMath: true, topic: 'exponential', confidence: 0.9 };
  }

  const normalized = normalizeEquationText(input);
  const isEquation = normalized.includes('=');
  const hasVariable = /[a-zA-Z]/.test(normalized);
  const hasMathOperator = /[+\-*/^=]/.test(normalized);
  const degree = hasVariable ? inferDegree(normalized) : undefined;

  if (!isEquation || !hasVariable) {
    const isArithmetic = isEquation && hasMathOperator && !hasVariable;
    return {
      isEquation,
      isMath: hasMathOperator || hasVariable,
      topic: isArithmetic ? 'arithmetic' : undefined,
      confidence: isArithmetic ? 0.88 : isEquation || hasMathOperator ? 0.35 : 0,
    };
  }

  if (degree === 2) {
    return { isEquation, isMath: true, topic: 'quadratic', degree, confidence: 0.95 };
  }

  if (degree === 1) {
    return { isEquation, isMath: true, topic: 'linear', degree, confidence: 0.9 };
  }

  return { isEquation, isMath: true, degree, confidence: 0.6 };
}

/** True when input is a typed math problem with a known topic (equations, probability, etc.). */
export function isClearEquationInput(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (looksLikeProbability(trimmed)) return true;
  if (!/=/.test(trimmed)) return false;
  if (
    /\[geometry\]|\btriangle\b|\brectangle\b|\bsquare\b|\bcircle\b|\bhypotenuse\b|\bpythagoras\b|\bperimeter\b|\bcircumference\b|\bradius\b|\barea of\b/i.test(
      trimmed
    )
  ) {
    return false;
  }
  if (TRIG_PATTERN.test(trimmed) || /\[trigonometry\]/i.test(trimmed)) return false;

  const classification = classifyEquationInput(trimmed);
  return Boolean(
    classification.topic &&
      classification.isMath &&
      (classification.isEquation || classification.topic === 'probability') &&
      classification.confidence >= 0.8
  );
}
