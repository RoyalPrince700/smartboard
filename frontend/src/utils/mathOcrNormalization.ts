import { classifyEquationInput, type EquationTopic } from './equationClassifier';

export interface NormalizedOcrMath {
  raw: string;
  text: string;
  isEquation: boolean;
  /** @deprecated Use topic === 'quadratic' instead */
  isQuadratic: boolean;
  topic?: EquationTopic;
}

function normalizeFractions(input: string): string {
  return input.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '($1)/($2)');
}

function formatEquationSpacing(input: string): string {
  return input
    .replace(/\s+/g, '')
    .replace(/([+=])/g, ' $1 ')
    .replace(/(?<!^)-/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize absolute-value bars from OCR (CoMER may emit \\vert or |). */
function normalizeAbsoluteBars(input: string): string {
  return input
    .replace(/\\vert/g, '|')
    .replace(/\\left\s*\|/g, '|')
    .replace(/\\right\s*\|/g, '|');
}

export function normalizeOcrMath(raw: string): NormalizedOcrMath {
  let text = raw
    .trim()
    .replace(/\\left|\\right/g, '')
    .replace(/\\,/g, '')
    .replace(/\\ /g, '')
    .replace(/\\mathrm\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\operatorname\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\cdot|\\times|×/g, '*')
    .replace(/−|–/g, '-')
    .replace(/\\pm/g, '±')
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)');

  // CoMER emits LaTeX braces for all exponents (2^{x}=2^{4}), not only ^2/^3.
  text = text.replace(/\^\s*\{([^{}]+)\}/g, (_match, inner: string) => {
    const exponent = String(inner).replace(/\s+/g, '');
    if (/^[a-zA-Z]$/.test(exponent) || /^-?\d+$/.test(exponent)) {
      return `^${exponent}`;
    }
    return `^(${exponent})`;
  });

  text = text
    .replace(/\s*\^\s*2(?!\d)/g, '^2')
    .replace(/\s*\^\s*3(?!\d)/g, '^3')
    .replace(/\s+/g, '');

  text = normalizeAbsoluteBars(text);
  text = normalizeFractions(text);

  // CoMER often emits implicit multiplication as separate tokens: "2 x ^ { 2 }".
  text = text
    .replace(/([0-9])\s*([a-zA-Z])/g, '$1$2')
    .replace(/([a-zA-Z])\s*\^\s*2(?!\d)/g, '$1^2')
    .replace(/([a-zA-Z])\s*\^\s*3(?!\d)/g, '$1^3');

  const formatted = formatEquationSpacing(text);
  const classification = classifyEquationInput(formatted);
  const isQuadratic = classification.topic === 'quadratic';

  return {
    raw,
    text: formatted,
    isEquation: classification.isEquation,
    isQuadratic,
    topic: classification.topic,
  };
}
